var util = require('util');
var events = require('events');
var h2frame = require('./frame');

var Stream = module.exports.Stream = function (id, connection) {
    this.id = id;
    this.connection = connection;
    this.headersFrames = [];
    this.state = Stream.STATE_IDLE;
    this.stat = {
        'sent': 0,
        'received': 0,
    };
};
util.inherits(Stream, events.EventEmitter);
Object.defineProperty(Stream, 'STATE_IDLE', {
    get: function () { return 'IDLE'; },
});
Object.defineProperty(Stream, 'STATE_RESERVED_LOCAL', {
    get: function () { return 'RESERVED (LOCAL)'; },
});
Object.defineProperty(Stream, 'STATE_RESERVED_REMOTE', {
    get: function () { return 'RESERVED (REMOTE)'; },
});
Object.defineProperty(Stream, 'STATE_OPEN', {
    get: function () { return 'OPEN'; },
});
Object.defineProperty(Stream, 'STATE_HALF_CLOSED_LOCAL', {
    get: function () { return 'HARF CLOSED (LOCAL)'; },
});
Object.defineProperty(Stream, 'STATE_HALF_CLOSED_REMOTE', {
    get: function () { return 'HARF CLOSED (REMOTE)'; },
});
Object.defineProperty(Stream, 'STATE_CLOSED', {
    get: function () { return 'CLOSED'; },
});

Stream.prototype.toString = function () {
    var str = 'Stream #' + this.id + ': ' + this.state;
    return str;
};
Stream.prototype.send = function (frames, callback) {
    if (!(frames instanceof Array)) {
        frames = [frames];
    }
    var self = this;
    frames.forEach(function (f) {
        f.streamId = self.id;
        self.emit('send', f);
        if (f.streamId > 0) {
            switch (self.state) {
                case Stream.STATE_IDLE:
                    switch (f.type) {
                        case h2frame.Http2HeadersFrame.TYPE_CODE:
                            if (f.flags & h2frame.Http2HeadersFrame.FLAG_END_STREAM) {
                                setState.call(self, Stream.STATE_HALF_CLOSED_LOCAL);
                            } else {
                                setState.call(self, Stream.STATE_OPEN);
                            }
                            break;
                        case h2frame.Http2PushPromiseFrame.TYPE_CODE:
                            setState.call(self, Stream.STATE_RESERVED_LOCAL);
                            break;
                        default:
                            break;
                    }
                    break;
                case Stream.STATE_RESERVED_LOCAL:
                    switch (f.type) {
                        case h2frame.Http2HeadersFrame.TYPE_CODE:
                            setState.call(self, Stream.STATE_HALF_CLOSED_REMOTE);
                            break;
                        case h2frame.Http2RstStreamFrame.TYPE_CODE:
                            setState.call(self, Stream.STATE_CLOSED);
                            self.emit('close', self);
                            break;
                        default:
                            break;
                    }
                    break;
                case Stream.STATE_RESERVED_REMOTE:
                    switch (f.type) {
                        case h2frame.Http2RstStreamFrame.TYPE_CODE:
                            setState.call(self, Stream.STATE_CLOSED);
                            self.emit('close', self);
                            break;
                        case h2frame.Http2PriorityFrame.TYPE_CODE:
                            // do nothing
                            break;
                        default:
                            break;
                    }
                    break;
                case Stream.STATE_OPEN:
                    if (f.constructor.FLAG_END_STREAM && f.flags & f.constructor.FLAG_END_STREAM) {
                        setState.call(self, Stream.STATE_HALF_CLOSED_LOCAL);
                    } else if (f.type === h2frame.Http2RstStreamFrame.TYPE_CODE) {
                        setState.call(self, Stream.STATE_CLOSED);
                        self.emit('close', self);
                    }
                    break;
                case Stream.STATE_HALF_CLOSED_LOCAL:
                    switch (f.type) {
                        case h2frame.Http2WindowUpdateFrame.TYPE_CODE:
                            // do nothing
                            break;
                        case h2frame.Http2RstStreamFrame.TYPE_CODE:
                            setState.call(self, Stream.STATE_CLOSED);
                            self.emit('close', self);
                            break;
                        default:
                            break;
                    }
                    break;
                case Stream.STATE_HALF_CLOSED_REMOTE:
                    if (f.constructor.FLAG_END_STREAM && f.flags & f.constructor.FLAG_END_STREAM) {
                        setState.call(self, Stream.STATE_CLOSED);
                    } else if (f.type === h2frame.Http2RstStreamFrame.TYPE_CODE) {
                        setState.call(self, Stream.STATE_CLOSED);
                        self.emit('close', self);
                    }
                    break;
                case Stream.STATE_CLOSED:
                    if (f.type === h2frame.Http2PriorityFrame.TYPE_CODE) {
                        // do nothing
                    }
                    break;
                default:
                    break;
            }
        }
        var buf = f.getBuffer();
        self.connection.send(buf, callback);
        self.stat.sent += buf.length;
    });
};
Stream.prototype.consumeFrame = function (frame) {
    this.stat.received += frame.getBuffer().length;
    this.emit('frame', frame);
    if (frame.streamId > 0) {
        switch (this.state) {
            case Stream.STATE_IDLE:
                switch (frame.type) {
                    case h2frame.Http2HeadersFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_OPEN);
                        break;
                    case h2frame.Http2PushPromiseFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_RESERVED_REMOTE);
                        break;
                    default:
                        break;
                }
                break;
            case Stream.STATE_RESERVED_LOCAL:
                switch (frame.type) {
                    case h2frame.Http2RstStreamFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_CLOSED);
                        break;
                    case h2frame.Http2PriorityFrame.TYPE_CODE:
                        // do nothing
                        break;
                    default:
                        console.error('PROTOCOL_ERROR');
                        break;
                }
                break;
            case Stream.STATE_RESERVED_REMOTE:
                switch (frame.type) {
                    case h2frame.Http2HeadersFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_HALF_CLOSED_LOCAL);
                        break;
                    case h2frame.Http2RstStreamFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_CLOSED);
                        break;
                    case h2frame.Http2PriorityFrame.TYPE_CODE:
                        // do nothing
                        break;
                    default:
                        console.error('PROTOCOL_ERROR');
                        break;
                }
                break;
            case Stream.STATE_OPEN:
                if (frame.constructor.FLAG_END_STREAM && frame.flags & frame.constructor.FLAG_END_STREAM) {
                    setState.call(this, Stream.STATE_HALF_CLOSED_REMOTE);
                } else if (frame.type === h2frame.Http2RstStreamFrame.TYPE_CODE) {
                    setState.call(this, Stream.STATE_CLOSED);
                }
                break;
            case Stream.STATE_HALF_CLOSED_LOCAL:
                if (frame.constructor.FLAG_END_STREAM && frame.flags & frame.constructor.FLAG_END_STREAM) {
                    setState.call(this, Stream.STATE_CLOSED);
                } else if (frame.type === h2frame.Http2RstStreamFrame.TYPE_CODE) {
                    setState.call(this, Stream.STATE_CLOSED);
                } else if (frame.type === h2frame.Http2WindowUpdateFrame.TYPE_CODE) {
                    // do nothing
                } else if (frame.type === h2frame.Http2PriorityFrame.TYPE_CODE) {
                    // do nothing
                }
                break;
            case Stream.STATE_HALF_CLOSED_REMOTE:
                switch (frame.type) {
                    case h2frame.Http2WindowUpdateFrame.TYPE_CODE:
                    case h2frame.Http2PriorityFrame.TYPE_CODE:
                        break;
                    case h2frame.Http2RstStreamFrame.TYPE_CODE:
                        setState.call(this, Stream.STATE_CLOSED);
                        break;
                    default:
                        console.error('STREAM_CLOSED');
                        break;
                }
                break;
            case Stream.STATE_CLOSED:
                switch (frame.type) {
                    case h2frame.Http2WindowUpdateFrame.TYPE_CODE:
                    case h2frame.Http2RstStreamFrame.TYPE_CODE:
                    case h2frame.Http2PriorityFrame.TYPE_CODE:
                    case h2frame.Http2DataFrame.TYPE_CODE:
                        // do nothing
                        break;
                    default:
                        console.error('STREAM_CLOSED');
                }
                break;
            default:
                break;
        }
    }
    if (frame.type === 1 || frame.type === 5 || frame.type === 9) {
        this.headersFrames.push(frame);
        if (frame.flags & h2frame.Http2HeadersFrame.FLAG_END_HEADERS) {
            this.emit('headerFrames', this.headersFrames);
            this.headersFrames.length = 0;
        }
    }
    if (frame.type === 0 && frame.flags & h2frame.Http2DataFrame.FLAG_END_STREAM) {
        this.emit('close', this);
    } else if (frame.type == 1 && frame.flags & h2frame.Http2HeadersFrame.FLAG_END_STREAM) {
        this.emit('close', this);
    } else if (frame.type == 3) {
        this.emit('close', this);
    }
};

var setState = function (newState) {
    var oldState = this.state;
    this.state = newState;
    this.emit('stateChange', oldState, newState);
};
