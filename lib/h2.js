var util = require('util');
var events = require('events');
var h2connection = require('./connection');
var h2frame = require('./frame');
var h2util = require('./util');

var HTTP2_PREFACE = new Buffer('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');

var handleFrame = function (stream, frame) {
    var handler = frameHandlers[frame.type];
    if (handler) {
        handler.call(this, stream, frame);
    } else if (handler === null) {
        // ignore the frame
    } else {
        console.error('no handler: %d', frame.type);
    }
};

var handleDataFrame = function (stream, frame) {
    var data = frame.getData();
    stream.emit('data', data);
};

var handleHeadersFrame = function (stream, frames) {
    var i, headerBlocks = [];
    for (i = 0; i < frames.length; i++) {
        headerBlocks.push(frames[i].getBlock());
    }
    var headers = this.connection.hpack.decode(Buffer.concat(headerBlocks));
    stream.emit('header', headers);
};

var handleSettingsFrame = function (stream, frame) {
    var p, i, params, nParam, ackFrame;
    if (frame.flags & h2frame.Http2SettingsFrame.FLAG_ACK) {
        params = this._settingQueue.shift();
        if (params) {
            nParam = params.length;
            for (i = 0; i < nParam; i++) {
                p = params[i];
                this.connection.setLocalSetting(p.id, p.value);
            }
        }
    } else {
        nParam = frame.getParamCount();
        for (i = 0; i < nParam; i++) {
            p = frame.getParamByIndex(i);
            this.connection.setRemoteSetting(p.id, p.value);
        }
        if (this.config['http2.auto_ack']) {
            ackFrame = new h2frame.Http2SettingsFrame();
            ackFrame.flags |= h2frame.Http2SettingsFrame.FLAG_ACK;
            this.connection.streams[0].send(ackFrame);
        }
    }
};

var handlePushPromiseFrame = function (stream, frame) {
    var self = this;
    var id = stream.connection.newStream(frame.promisedStreamId);
    var newStream = this.connection.streams[id];
    newStream.on('close', function () {});
    newStream.on('header', function () {});
    newStream.on('data', function (data) {
        if (data.length) {
            var frame = new h2frame.Http2WindowUpdateFrame();
            frame.windowSizeIncrement = data.length;
            this.send(frame);
            self.connection.streams[0].send(frame);
        }
    });
};

var handlePingFrame = function (stream, frame) {
    if (!frame.flags & h2frame.Http2PingFrame.FLAG_ACK) {
        var ackFrame = new h2frame.Http2PingFrame();
        ackFrame.payload = frame.payload;
        ackFrame.flags |= h2frame.Http2PingFrame.FLAG_ACK;
        this.connection.streams[0].send(ackFrame);
    }
};

var handleGoawayFrame = function (stream, frame) {
    this.connection.close();
};

var frameHandlers = [
    handleDataFrame,
    null,
    void(0),
    void(0),
    handleSettingsFrame,
    handlePushPromiseFrame,
    handlePingFrame,
    handleGoawayFrame,
    void(0),
    null,
    void(0),
    void(0),
    void(0),
];


var H2 = function (config) {
    this.config = {
        'http2.auto_preface': 1,
        'http2.auto_ack': 1,
        'http2.use_padding': 0,
        'http2.use_upgrade': 0,
        'log.state_change': 0,
        'log.frame_sent': 0,
        'log.frame_received': 0,
        'log.verbose': 1,
        'hpack.use_huffman': 1
    };

    var self = this;
    if (config) {
        Object.keys(config).forEach(function (k) {
            self.config[k] = config[k];
        });
    }
};
util.inherits(H2, events.EventEmitter);

H2.prototype.connect = function (hostname, port, options, callback) {
    var self = this;
    if (!options.secure && typeof options.useUpgrade === 'undefined') {
        options.useUpgrade = self.config['http2.use_upgrade'];
    }
    this.connection = new h2connection.Connection(hostname, port, options);
    this.connection.hpack.useHuffman(self.config['hpack.use_huffman']);
    this.connection.on('connect', function (stream) {
        self.connection.newStream();
        var settingsFrame = new h2frame.Http2SettingsFrame();
        if (!options.useUpgrade) {
            if (self.config['http2.auto_preface']) {
                self.connection.send(HTTP2_PREFACE);
                self.connection.streams[0].send(settingsFrame);
            }
        } else {
            var frameB64 = settingsFrame.getBuffer().slice(9).toString('base64').replace(/=*$/, '');
            self.connection.newStream(1);
            self.connection.send("GET / HTTP/1.1\r\n");
            self.connection.send("Host: " + hostname + "\r\n");
            self.connection.send("Connection: Upgrade\r\n");
            self.connection.send("Upgrade: h2c\r\n");
            self.connection.send("HTTP2-Settings: " + frameB64 + "\r\n");
            self.connection.send("\r\n");
        }
        callback(stream);
    });
    this.connection.on('close', function () {
        self.connection = void(0);
    });
    this.connection.on('error', function (e) {
        callback(null, e);
    });
    this.connection.on('newStream', function (stream) {
        stream.on('frame', function (frame) {
            if (self.config['log.frame_received']) {
                console.log('RECV[%d]: ' + h2util.printFrame(frame, self.config['log.verbose']), this.id);
            }
            handleFrame.call(self, this, frame);
        });
        stream.on('headerFrames', function (frames) {
            handleHeadersFrame.call(self, this, frames);
        });
        stream.on('send', function (frame) {
            if (self.config['log.frame_sent']) {
                console.log("SEND[%d]: " + h2util.printFrame(frame, self.config['log.verbose']), this.id);
            }
        });
        stream.on('stateChange', function (oldState, newState) {
            if (self.config['log.state_change']) {
                console.log('STATE CHANGE[%d]: %s -> %s', this.id, oldState, newState);
            }
        });
    });
    this.connection.on('frame', function (data) {
        var frame = h2frame.Http2FrameFactory.createFrame(data);
        var stream = self.connection.streams[frame.streamId];
        if (!stream) {
            console.log('Unexpected streamId: ' + frame.streamId);
        }
        stream.consumeFrame(frame);
    });
    this._settingQueue = [];
};

H2.prototype.close = function (callback) {
    if (this.connection) {
        this.connection.close(callback);
    } else {
        if (callback) {
            callback();
        }
    }
};

H2.prototype.send = function (frame, streamId, callback) {
    if (!this.connection) {
        console.error('Not connected yet.');
        arguments[arguments.length - 1]();
        return;
    }
    if (arguments[0] instanceof h2frame.Http2Frame) {
        if (typeof arguments[1] === 'number') {
            this.connection.newStream(streamId);
            this.connection.streams[streamId].send(frame, arguments[2]);
        } else {
            this.connection.streams[0].send(frame, arguments[1]);
        }
    } else {
        this.connection.send(frame, callback);
    }
};

H2.prototype.request = function (/* authority, path, method, data, callbacks */) {
    var self = this, authority, path, method, data, callbacks, pos, i, f;
    pos = 0;
    if (arguments[0][0] === '/') {
        authority = self.connection ? self.connection.hostname : '';
    } else {
        authority = arguments[pos++];
    }
    if (self.connection &&
        ((self.connection.port !== 443 || !self.connection.secure) &&
        (self.connection.port !== 80 || self.connection.secure))) {
            authority += ':' + self.connection.port;
    }
    path      = arguments[pos++];
    method    = arguments[pos++];
    if (typeof arguments[pos] === 'string') {
        data = new Buffer(arguments[pos++]);
        callbacks = arguments[pos];
    } else {
        callbacks = arguments[pos];
    }
    if (!self.connection) {
        console.error('Not connected yet.');
        callbacks.error();
        return;
    }
    var headers = [
        [':method', method],
        [':scheme', self.connection.secure ? 'https' : 'http'],
        [':authority', authority],
        [':path', path],
        ['user-agent', 'h2cli/0.18.0']
    ];
    if (data) {
        headers.push(['content-length', '' + data.length]);
    }
    var id = this.connection.newStream();
    var stream = this.connection.streams[id];
    stream.on('close', callbacks.close);
    stream.on('header', callbacks.header);
    stream.on('data', function (data) {
        callbacks.data(data);
        if (data.length) {
            var frame = new h2frame.Http2WindowUpdateFrame();
            frame.windowSizeIncrement = data.length;
            this.send(frame);
            self.connection.streams[0].send(frame);
        }
    });
    var headersFrames = h2frame.Http2FrameFactory.createRequestFrames(this.connection.hpack, headers, this.config['http2.use_padding']);
    if (data) {
        stream.send(headersFrames);
        var dataFrames = h2frame.Http2FrameFactory.createDataFrames(data, this.config['http2.use_padding']);
        dataFrames[dataFrames.length - 1].flags |= h2frame.Http2DataFrame.FLAG_END_STREAM;
        stream.send(dataFrames);
    } else {
        if (headersFrames.length > 1) {
            var dataFrame = new h2frame.Http2DataFrame();
            dataFrame.flags |= h2frame.Http2DataFrame.FLAG_END_STREAM;
            headersFrames.push(dataFrame);
        } else {
            headersFrames[0].flags |= h2frame.Http2HeadersFrame.FLAG_END_STREAM;
        }
        stream.send(headersFrames);
    }
};

H2.prototype.setSetting = function (name, value, callback) {
    var frame = new h2frame.Http2SettingsFrame();
    var paramId = h2frame.Http2SettingsFrame['PARAM_SETTINGS_' + name];
    if (paramId) {
        frame.setParam(paramId, value);
        this._settingQueue.push([{'id': paramId, 'value': value}]);
        this.connection.streams[0].send(frame);
    }
    callback();
};

H2.prototype.setConfig = function (name, value) {
    this.config[name] = parseInt(value, 10);
    if (name === 'hpack.use_huffman') {
        if (this.connection) {
            this.connection.hpack.useHuffman(this.config['hpack.use_huffman']);
        }
    }
};


module.exports = {
    'HTTP2_PREFACE': HTTP2_PREFACE,
    'frame': h2frame,
    'createClient': function (config) {
        return new H2(config);
    },
    'registerFrameHandler': function (type, handler) {
        frameHandlers[type] = handler;
    },
};
