var util = require('util');
var events = require('events');
var Readable = require('stream').Readable;
var h2stream = require('./stream');
var h2hpack = require('./hpack');

util.inherits(Http2Reader, Readable);
function Http2Reader(source, options) {
    if (!(this instanceof Http2Reader)) {
        return new Http2Reader(source, options);
    }

    Readable.call(this, options);
    this._bufArray = [];
    this._fsize = -1;
    this._curBufLen = 0;
    this._source = source;

    var self = this;
    source.on('end', function() {
        self.push(null);
    });

    source.on('readable', function() {
        self.read(0);
    });
}
Http2Reader.prototype._read = function(n) {
    var chunk = this._source.read();
    if (chunk === null) {
        return this.push('');
    }

    this._bufArray.push(chunk);
    this._curBufLen += chunk.length;
    if (this._bufArray[0].length < 3) {
        if (this._bufArray.length === 2) {
            this._bufArray = [ Buffer.concat(this._bufArray) ];
        } else {
            return this.push('');
        }
    }
    do {
        if (this._fsize === -1) {
            this._fsize = ((this._bufArray[0].readUInt16BE(0) << 8) + this._bufArray[0].readUInt8(2)) + 9;
        }
        if (this._curBufLen < this._fsize) {
            return this.push('');
        }
        var frameBuf = Buffer.concat(this._bufArray, this._fsize).slice(0, this._fsize);
        this._bufArray = [ this._bufArray[this._bufArray.length - 1].slice(this._bufArray[this._bufArray.length - 1].length - (this._curBufLen - this._fsize)) ];
        this._curBufLen = this._bufArray[0].length;
        this._fsize = -1;
        this.emit('frame', frameBuf);
    } while (this._bufArray[0].length >= 3);
    this.push('');
};

var Connection = module.exports.Connection = function (hostname, port, options) {
    var self = this;
    this.hostname = hostname;
    this.port     = port;
    this.secure   = options.secure;
    this.stream   = void(0);
    this.streams  = [];
    this._localSettings = [
        null,                       // not used
        4096,                       // SETTINGS_HEADER_TABLE_SIZE
        1,                          // SETTINGS_ENABLE_PUSH
        Number.POSITIVE_INFINITY,   // SETTINGS_MAX_CONCURRENT_STREAMS
        65535,                      // SETTINGS_INITIAL_WINDOW_SIZE
        16384,                      // SETTINGS_MAX_FRAME_SIZE
        Number.POSITIVE_INFINITY    // SETTINGS_MAX_HEADER_LIST_SIZE
    ];
    this._remoteSettings = [
        null,                       // not used
        4096,                       // SETTINGS_HEADER_TABLE_SIZE
        1,                          // SETTINGS_ENABLE_PUSH
        Number.POSITIVE_INFINITY,   // SETTINGS_MAX_CONCURRENT_STREAMS
        65535,                      // SETTINGS_INITIAL_WINDOW_SIZE
        16384,                      // SETTINGS_MAX_FRAME_SIZE
        Number.POSITIVE_INFINITY    // SETTINGS_MAX_HEADER_LIST_SIZE
    ];
    this.hpack = new h2hpack.HPACK(this._localSettings[1], this._remoteSettings[1]);
    this.highestStreamId = -1;

    var connectEvent;
    var opt = {
        'host': hostname,
        'port': port,
    };
    if (this.secure) {
        var tls = require('tls');
        opt['rejectUnauthorized'] = false;
        opt['ciphers'] = 'TLSv1.2:' + tls.DEFAULT_CIPHERS;
        if (options['useNpn']) {
            opt['NPNProtocols'] = ['h2', 'h2-14'];
        }
        this.stream = tls.connect(opt);
        connectEvent = 'secureConnect';
    } else {
        this.stream = require('net').connect(opt);
        connectEvent = 'connect';
    }

    this.reader = new Http2Reader(this.stream);
    this.reader.on('frame', function (frame) {
        self.emit('frame', frame);
    });
    this.stream.on(connectEvent, function () {
        self.emit('connect', this);
    });
    this.stream.on('error', function () {
        self.emit('error');
    });
    this.stream.on('end', function () {
        self.emit('close');
    });
};
util.inherits(Connection, events.EventEmitter);

Connection.prototype.send = function (data, callback) {
    this.stream.write(data, callback);
};

Connection.prototype.newStream = function (id) {
    if (typeof id !== 'undefined') {
        if (id % 2 === 1) {
            if (id > this.highestStreamId) {
                this.highestStreamId = id;
            } else {
                return id;
            }
        }
    } else {
        this.highestStreamId++;
        if (this.highestStreamId !== 0 && this.highestStreamId % 2 !== 1) {
            this.highestStreamId++;
        }
        id = this.highestStreamId;
    }
    var stream = new h2stream.Stream(id, this);
    this.streams[id] = stream;
    this.emit('newStream', stream);
    return id;
};

Connection.prototype.close = function (callback) {
    this.stream.end();
    callback();
};

Connection.prototype.getLocalSetting = function (id) {
    return this._localSettings[id];
};

Connection.prototype.setLocalSetting = function (id, value) {
    this._localSettings[id] = value;
};

Connection.prototype.getRemoteSetting = function (id) {
    return this._remoteSettings[id];
};

Connection.prototype.setRemoteSetting = function (id, value) {
    this._remoteSettings[id] = value;
};
