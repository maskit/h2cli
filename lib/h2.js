var util = require('util');
var events = require('events');
var h2connection = require('./connection');
var h2frame = require('./frame');

var H2 = function () {
};
util.inherits(H2, events.EventEmitter);

H2.prototype.connect = function (hostname, port, options, callback) {
    var self = this;
    this.connection = new h2connection.Connection(hostname, port, options);
    this.connection.on('connect', function (stream) {
        if (options['useUpgrade']) {
            // TODO useUpgrade
        } else {
            self.connection.send(HTTP2_PREFACE);
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
        stream.on('frame', function (stream, frame) {
            handleFrame.call(self, stream, frame);
        });
        stream.on('headerFrames', function (stream, frames) {
            handleHeadersFrame.call(self, stream, frames);
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
};

H2.prototype.close = function (callback) {
    this.connection.close(callback);
};

H2.prototype.send = function (frame, streamId, callback) {
    if (typeof arguments[1] === 'number') {
        this.connection.streams[streamId].send(frame, arguments[2]);
    } else {
        this.connection.streams[0].send(frame, arguments[1]);
    }
};

H2.prototype.request = function (path, method, callbacks) {
    var self = this;
    var headers = {
        ':method': method,
        ':scheme': self.connection.secure ? 'https' : 'http',
        ':authority': self.connection.hostname,
        ':path': path,
    };
    var frames = h2frame.Http2FrameFactory.createRequestFrames(headers, this.connection.hpack);
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
    stream.send(frames);
};

H2.prototype.setSetting = function (name, value, callback) {
    callback();
};

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
    var p, i, nParam = frame.getParamCount(), ackFrame;
    for (i = 0; i < nParam; i++) {
        p = frame.getParamByIndex(i);
        this.connection.settings[p.id] = p.value;
    }
    if (!frame.flags & h2frame.Http2SettingsFrame.FLAG_ACK) {
        ackFrame = new h2frame.Http2SettingsFrame();
        ackFrame.flags |= h2frame.Http2SettingsFrame.FLAG_ACK;
        this.connection.streams[0].send(ackFrame);
    }
};

var handlePushPromiseFrame = function (stream, frame) {
    stream.connection.newStream(frame.promisedStreamId);
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


HTTP2_PREFACE = new Buffer('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n', 'ascii');

module.exports = {
    'HTTP2_PREFACE': HTTP2_PREFACE,
    'frame': h2frame,
    'createClient': function () {
        return new H2();
    },
    'registerFrameHandler': function (type, handler) {
        frameHandlers[type] = handler;
    },
};
