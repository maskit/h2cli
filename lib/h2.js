var util = require('util');
var events = require('events');
var h2connection = require('./connection');
var h2frame = require('./frame');

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
                this.connection.setRemoteSetting(p.id, p.value);
            }
        }
    } else {
        nParam = frame.getParamCount();
        for (i = 0; i < nParam; i++) {
            p = frame.getParamByIndex(i);
            this.connection.setLocalSetting(p.id, p.value);
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
    var stream = this.connection.streams[id];
    stream.on('close', function () {});
    stream.on('header', function () {});
    stream.on('data', function (data) {
        if (data.length) {
            var frame = new h2frame.Http2WindowUpdateFrame();
            frame.windowSizeIncrement = data.length;
            this.send(frame);
            self.connection.streams[0].send(frame);
        }
    });
};

var handlePingFrame = function (stream, frame) {
    if (!frame.flags & h2frame.Http2SettingsFrame.FLAG_ACK) {
        var ackFrame = new h2frame.H2frame.Http2PingFrame();
        ackFrame.setPayload(frame.getPayload());
        ackFrame.flags |= h2frame.Http2PingFrame.FLAG_ACK;
        this.connection.streams[0].send(ackFrame);
    }
};

var frameHandlers = [
    handleDataFrame,
    null,
    void(0),
    void(0),
    handleSettingsFrame,
    handlePushPromiseFrame,
    handlePingFrame,
    void(0),
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
        'log.state_change': 0,
        'log.frame_sent': 0,
        'log.frame_received': 0,
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
    this.connection = new h2connection.Connection(hostname, port, options);
    this.connection.hpack.useHuffman(self.config['hpack.use_huffman']);
    this.connection.on('connect', function (stream) {
        if (options['useUpgrade']) {
            // TODO useUpgrade
        } else {
            if (self.config['http2.auto_preface']) {
                self.connection.send(HTTP2_PREFACE);
            }
            self.connection.newStream();
        }
        callback(stream);
    });
    this.connection.on('close', function () {
        callback();
    });
    this.connection.on('error', function () {
        callback();
    });
    this.connection.on('newStream', function (stream) {
        stream.on('frame', function (frame) {
            if (self.config['log.frame_received']) {
                console.log('RECV[%d]: ' + frame, this.id);
            }
            handleFrame.call(self, this, frame);
        });
        stream.on('headerFrames', function (frames) {
            handleHeadersFrame.call(self, this, frames);
        });
        stream.on('send', function (frame) {
            if (self.config['log.frame_sent']) {
                console.log("SEND[%d]: " + frame, this.id);
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
    this.connection.close(callback);
};

H2.prototype.send = function (frame, streamId, callback) {
    if (arguments[0] instanceof h2frame.Http2Frame) {
        if (typeof arguments[1] === 'number') {
            this.connection.streams[streamId].send(frame, arguments[2]);
        } else {
            this.connection.streams[0].send(frame, arguments[1]);
        }
    } else {
        this.connection.send(frame, callback);
    }
};

H2.prototype.request = function (/* path, method, data, callbacks */) {
    var self = this, path, method, data, callbacks, i, f;
    switch (arguments.length) {
        case 3:
            path = arguments[0];
            method = arguments[1];
            callbacks = arguments[2];
            break;
        case 4:
            path = arguments[0];
            method = arguments[1];
            if (typeof arguments[2] == 'string') {
                data = new Buffer(arguments[2]);
            } else {
            }
            callbacks = arguments[3];
            break;
    }
    var headers = [
        [':method', method],
        [':scheme', self.connection.secure ? 'https' : 'http'],
        [':authority', self.connection.hostname],
        [':path', path],
        ['user-agent', 'h2cli/0.16.0']
    ];
    if (data) {
        headers.push(['content-length', '' + data.length]);
    }
    var headersFrames = h2frame.Http2FrameFactory.createRequestFrames(this.connection.hpack, headers);
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
    if (data) {
        stream.send(headersFrames);
        i = 0;
        while (i < data.length) {
            f = new h2frame.Http2DataFrame();
            f.setData(data.slice(i, i + 8), 0);
            i += 8;
            stream.send(f);
        }
        f = new h2frame.Http2DataFrame();
        f.flags |= h2frame.Http2DataFrame.FLAG_END_STREAM;
        stream.send(f);
    } else {
        headersFrames[headersFrames.length -1].flags |= h2frame.Http2HeadersFrame.FLAG_END_STREAM;
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
