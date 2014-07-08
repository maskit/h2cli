var util = require('util');
var events = require('events');
var h2frame = require('./frame');

var Stream = module.exports.Stream = function (id, connection) {
    this.id = id;
    this.connection = connection;
    this.headersFrames = [];
};
util.inherits(Stream, events.EventEmitter);
Stream.prototype.send = function (frames) {
    if (!(frames instanceof Array)) {
        frames = [frames];
    }
    var self = this;
    frames.forEach(function (f) {
        f.streamId = self.id;
        console.log("SEND: " + f);
        self.connection.send(f.getBuffer());
    });
};
Stream.prototype.consumeFrame = function (frame) {
    console.log('RECV: ' + frame);
    this.emit('frame', this, frame);
    if (frame.type === 1 || frame.type === 5 || frame.type === 9) {
        this.headersFrames.push(frame);
        if (frame.flags & h2frame.Http2HeadersFrame.FLAG_END_HEADERS) {
            this.emit('headerFrames', this, this.headersFrames);
            this.headersFrames.length = 0;
        }
    }
    if (frame.type == 0 && frame.flags & h2frame.Http2DataFrame.FLAG_END_STREAM) {
        this.emit('close', this);
    } else if (frame.type == 1 && frame.flags & h2frame.Http2HeadersFrame.FLAG_END_STREAM) {
        this.emit('close', this);
    }
};
