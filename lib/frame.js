var util = require('util');
var h2map = require('./map');

/******************
 * BASE FRAME
 ******************/
var Http2Frame = module.exports.Http2Frame = function (buf) {
    if (!(this instanceof Http2Frame)) {
        return new Http2Frame(buf);
    }
    this.buf = buf;
};
Object.defineProperty(Http2Frame, 'HEADER_SIZE', {
    get: function () { return 8; },
});
Object.defineProperty(Http2Frame.prototype, 'length', {
    get: function () { return this.buf.readUInt16BE(0) & 0x3FFF; },
    set: function (length) { this.buf.writeUInt16BE(length & 0x3FFF, 0); },
});
Object.defineProperty(Http2Frame.prototype, 'type', {
    get: function () { return this.buf[2] },
    set: function (type) { this.buf[2] = type },
});
Object.defineProperty(Http2Frame.prototype, 'flags', {
    get: function () { return this.buf[3] },
    set: function (flags) { this.buf[3] = flags },
});
Object.defineProperty(Http2Frame.prototype, 'streamId', {
    get: function () { return this.buf.readUInt32BE(4) & 0x7FFFFFFF; },
    set: function (id) { this.buf.writeUInt32BE(id, 4); },
});
Http2Frame.prototype.getBuffer = function () {
    return this.buf;
};
Http2Frame.prototype.toString = function () {
    var str = "[";
    str += "Lenght: " + this.length + ", ";
    str += "Type: " + h2map.frameType2Name[this.type] + "(" + this.type + "), ";
    str += "Flags: " + this.flags + ", ";
    str += "StreamID: " + this.streamId;
    str += "]";
    return str;
};

/******************
 * DATA FRAME
 ******************/
var Http2DataFrame = module.exports.Http2DataFrame = function (buf) {
    if (!(this instanceof Http2DataFrame)) {
        return new Http2DataFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2DataFrame, Http2Frame);
Object.defineProperty(Http2DataFrame, 'FLAG_END_STREAM', {
    get: function () { return 0x01; },
});
Object.defineProperty(Http2DataFrame, 'FLAG_END_SEGMENT', {
    get: function () { return 0x02; },
});
Object.defineProperty(Http2DataFrame, 'FLAG_PADDED', {
    get: function () { return 0x08; },
});
Http2DataFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2DataFrame.FLAG_END_STREAM) {
            flags.push('END_STREAM');
        }
        if (this.flags & Http2DataFrame.FLAG_END_SEGMENT) {
            flags.push('END_SEGMENT');
        }
        if (this.flags & Http2DataFrame.FLAG_PADDED) {
            flags.push('PADDED');
        }
        str += flags.join(' | ');
        if (this.flags & Http2DataFrame.FLAG_PADDED) {
            str += "\n";
            str += 'Padding: ';
            str += this.buf[0];
        }
    }
    return str;
};
Http2DataFrame.prototype.getBuffer = function () {
    var bufs = [];
    this.length = this.data.length;
    bufs.push(this.buf.slice(0, 8));
    bufs.push(this.data);
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
Http2DataFrame.prototype.getData = function () {
    var padding = 0, offset = 8;
    if (this.flags & Http2DataFrame.FLAG_PADDED) {
        padding += this.buf[0];
        offset += 1;
    }
    return this.buf.slice(offset, this.buf.length - padding);
};
Http2DataFrame.prototype.setData = function (data, padding) {
    this.data = block;
    this.padding = padding;
};

/******************
 * HEADERS FRAME
 ******************/
var Http2HeadersFrame = module.exports.Http2HeadersFrame = function (buf) {
    if (!(this instanceof Http2HeadersFrame)) {
        return new Http2HeadersFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2HeadersFrame, Http2Frame);
Http2HeadersFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2HeadersFrame.FLAG_END_STREAM) {
            flags.push('END_STREAM');
        }
        if (this.flags & Http2HeadersFrame.FLAG_END_SEGMENT) {
            flags.push('END_SEGMENT');
        }
        if (this.flags & Http2HeadersFrame.FLAG_END_HEADERS) {
            flags.push('END_HEADERS');
        }
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            flags.push('END_PADDED');
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
            flags.push('PRIORITY');
        }
        str += flags.join(' | ');
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            str += "\n";
            str += 'Padding: ';
            str += this.buf[0];
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
        }
    }
    return str;
}
Object.defineProperty(Http2HeadersFrame, 'FLAG_END_STREAM', {
    get: function () { return 0x01; },
});
Object.defineProperty(Http2HeadersFrame, 'FLAG_END_SEGMENT', {
    get: function () { return 0x02; },
});
Object.defineProperty(Http2HeadersFrame, 'FLAG_END_HEADERS', {
    get: function () { return 0x04; },
});
Object.defineProperty(Http2HeadersFrame, 'FLAG_PADDED', {
    get: function () { return 0x08; },
});
Object.defineProperty(Http2HeadersFrame, 'FLAG_PRIORITY', {
    get: function () { return 0x20; },
});
Http2HeadersFrame.prototype.getBuffer = function () {
    var bufs = [];
    bufs.push(this.buf.slice(0, 8));
    bufs.push(this.block);
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
Http2HeadersFrame.prototype.getBlock = function () {
    var padding = 0, offset = 8;
    if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
        padding += this.buf[0];
        offset += 1;
    }
    if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
        offset += 5;
    }
    return this.buf.slice(offset, this.buf.length - padding);
};
Http2HeadersFrame.prototype.setBlock = function (block, paddingLen) {
    var length = 0

    this.block = block;
    length += block.length;

    if (paddingLen) {
        this.padding = new Buffer(paddingLen);
        this.flags |= Http2HeadersFrame.FLAG_PADDED;
        length += 1 + paddingLen;
    } else {
        this.padding = null;
        this.flags &= ~Http2HeadersFrame.FLAG_PADDED;
    }

    this.length = length;
};

/******************
 * PRIORITY FRAME
 ******************/
var Http2PriorityFrame = module.exports.Http2PriorityFrame = function (buf) {
    if (!(this instanceof Http2PriorityFrame)) {
        return new Http2PriorityFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x05, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PriorityFrame, Http2Frame);
Http2PriorityFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Stream Dependency: ' + this.streamDependency;
    str += "\n";
    str += ' Weight: ' + this.weight;
    return str;
};
Object.defineProperty(Http2PriorityFrame, 'streamDependency', {
    get: function () { return 0; },
    set: function (streamId) {  },
});
Object.defineProperty(Http2PriorityFrame, 'weight', {
    get: function () { return 0; },
    set: function (weight) {  },
});

/******************
 * RST_STREAM FRAME
 ******************/
var Http2RstStreamFrame = module.exports.Http2RstStreamFrame = function (buf) {
    if (!(this instanceof Http2RstStreamFrame)) {
        return new Http2RstStreamFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x04, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2RstStreamFrame, Http2Frame);
Http2RstStreamFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Error Code: ' + h2map.errorCode2Name[this.getErrorCode()];
    return str;
};
Http2RstStreamFrame.prototype.getErrorCode = function () {
    return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
};

/******************
 * SETTINGS FRAME
 ******************/
var Http2SettingsFrame = module.exports.Http2SettingsFrame = function (buf) {
    if (!(this instanceof Http2SettingsFrame)) {
        return new Http2SettigsFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2SettingsFrame, Http2Frame);
Object.defineProperty(Http2SettingsFrame, 'FLAG_ACK', {
    get: function () { return 1; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_HEADER_TABLE_SIZE', {
    get: function () { return 1; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_ENABLE_PUSH', {
    get: function () { return 2; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_MAX_CONCURRENT_STREAMS', {
    get: function () { return 3; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_INITIAL_WINDOW_SIZE', {
    get: function () { return 4; },
});
Http2SettingsFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    var params = [], param;
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2SettingsFrame.FLAG_ACK) {
            flags.push('ACK');
        }
        str += flags.join(' | ');
    }
    if ( this.getParamCount()) {
        str += "\n";
        str += ' Params:\n';
        for (var i = 0; i < this.getParamCount(); i++) {
            param = this.getParamByIndex(i);
            if (param.id === Http2SettingsFrame.PARAM_SETTINGS_HEADER_TABLE_SIZE) {
                params.push('  SETTINGS_HEADER_TABLE_SIZE: ' + param.value);
            } else if (param.id === Http2SettingsFrame.PARAM_SETTINGS_ENABLE_PUSH) {
                params.push('  SETTINGS_ENABLE_PUSH: ' + param.value);
            } else if (param.id === Http2SettingsFrame.PARAM_SETTINGS_MAX_CONCURRENT_STREAMS) {
                params.push('  SETTINGS_MAX_CONCURRENT_STREAMS: ' + param.value);
            } else if (param.id === Http2SettingsFrame.PARAM_SETTINGS_INITIAL_WINDOW_SIZE) {
                params.push('  SETTINGS_INITIAL_WINDOW_SIZE: ' + param.value);
            } else {
                params.push('  ' + param.id + ': ' + param.value);
            }
        }
        str += params.join('\n');
    }
    return str;
};
Http2SettingsFrame.prototype.getParamCount = function () {
    return this.length / 6;
};
Http2SettingsFrame.prototype.getParamByIndex = function (index) {
    return {
        id: this.buf.readUInt16BE(Http2Frame.HEADER_SIZE + 6 * index),
        value: this.buf.readUInt32BE(Http2Frame.HEADER_SIZE + 6 * index + 2)
    };
};
Http2SettingsFrame.prototype.getParamById = function (id) {
    var param, i, n = this.getParamCount();
    for (i = 0; i < n; i++) {
        param = this.getParamByIndex(i)
        if (param.id === id) {
            return param;
        }
    }
    return void(0);
};
Http2SettingsFrame.prototype.getParamIndexOf = function (id) {
    var param, i, n = this.getParamCount();
    for (i = 0; i < n; i++) {
        param = this.getParamByIndex(i)
        if (param.id === id) {
            return i;
        }
    }
    return void(0);
};
Http2SettingsFrame.prototype.setParam = function (id, value) {
    var index;
    if (index = this.getParamIndexOf(id)) {
        this.buf.writeUInt32BE(value, Http2Frame.HEADER_SIZE + 6 * index + 2);
    } else {
        var newBuf = new Buffer(6);
        newBuf.writeUInt16BE(id);
        newBuf.writeUInt32BE(value, 2);
        this.buf = Buffer.concat([this.buf, newBuf], this.buf.length + 6);
    }
};

/******************
 * PUSH_PROMISE FRAME
 ******************/
var Http2PushPromiseFrame = module.exports.Http2PushPromiseFrame = function (buf) {
    if (!(this instanceof Http2PushPromiseFrame)) {
        return new Http2PushPromiseFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PushPromiseFrame, Http2Frame);
Http2PushPromiseFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2PushPromiseFrame.FLAG_END_HEADERS) {
            flags.push('END_HEADERS');
        }
        if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
            flags.push('END_PADDED');
        }
        str += flags.join(' | ');
        if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
            str += "\n";
            str += 'Padding: ';
            str += this.buf[0];
        }
    }
    str += "\n";
    str += ' Promised Stream ID: ' + this.promisedStreamId;
    return str;
}
Object.defineProperty(Http2PushPromiseFrame, 'FLAG_END_HEADERS', {
    get: function () { return 0x04; },
});
Object.defineProperty(Http2PushPromiseFrame, 'FLAG_PADDED', {
    get: function () { return 0x08; },
});
Object.defineProperty(Http2PushPromiseFrame.prototype, 'promisedStreamId', {
    get: function () {
        var offset = 0;
        if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
            offset += 1;
        }
        return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE + offset) & 0x7FFFFFFF;
    },
});

/******************
 * PING FRAME
 ******************/
var Http2PingFrame = module.exports.Http2PingFrame = function (buf) {
    if (!(this instanceof Http2PingFrame)) {
        return new Http2PingFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x08, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    }
};
util.inherits(Http2PingFrame, Http2Frame);
Object.defineProperty(Http2PingFrame, 'FLAG_ACK', {
    get: function () { return 1; },
});
Http2PingFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += 'Payload: '+ this.getPayload().toString('hex');
    return str;
};
Http2PingFrame.prototype.getPayload = function () {
    return this.buf.slice(8, 16);
};
Http2PingFrame.prototype.setPayload = function (payload) {
    this.buf[8] = payload[0];
    this.buf[9] = payload[1];
    this.buf[10] = payload[2];
    this.buf[11] = payload[3];
    this.buf[12] = payload[4];
    this.buf[13] = payload[5];
    this.buf[14] = payload[6];
    this.buf[15] = payload[7];
};

/******************
 * GOAWAY FRAME
 ******************/
var Http2GoawayFrame = module.exports.Http2GoawayFrame = function (buf) {
    if (!(this instanceof Http2GoawayFrame)) {
        return new Http2GoawayFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x08, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2GoawayFrame, Http2Frame);
Http2GoawayFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Last-Stream-ID: ' + this.getLastStreamId();
    str += "\n";
    str += ' Error Code: ' + h2map.errorCode2Name[this.getErrorCode()];
    if (this.length > 8) {
        str += "\n";
        str += ' Additional Debug Data: ';
    }
    return str;
};
Http2GoawayFrame.prototype.getLastStreamId = function () {
    return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
};
Http2GoawayFrame.prototype.getErrorCode = function () {
    return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE + 4);
};

/******************
 * WINDOW_UPDATE FRAME
 ******************/
var Http2WindowUpdateFrame = module.exports.Http2WindowUpdateFrame = function (buf) {
    if (!(this instanceof Http2WindowUpdateFrame)) {
        return new Http2GoawayFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2WindowUpdateFrame, Http2Frame);
Http2WindowUpdateFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Window Size Increment: ' + this.windowSizeIncrement;
    return str;
};
Object.defineProperty(Http2WindowUpdateFrame.prototype, 'windowSizeIncrement', {
    get: function () {
        return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
    },
    set: function (size) {
        return this.buf.writeUInt32BE(size, Http2Frame.HEADER_SIZE);
    },
});

/******************
 * CONTINUATION FRAME
 ******************/
var Http2ContinuationFrame = module.exports.Http2ContinuationFrame = function (buf) {
    if (!(this instanceof Http2ContinuationFrame)) {
        return new Http2ContinuationFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([ 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]); }
};
util.inherits(Http2ContinuationFrame, Http2Frame);
Object.defineProperty(Http2ContinuationFrame, 'FLAG_END_HEADERS', {
    get: function () { return 4; },
});
Http2ContinuationFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2ContinuationFrame.FLAG_END_HEADERS) {
            flags.push('END_HEADERS');
        }
        str += flags.join(' | ');
    }
    return str;
};
Http2ContinuationFrame.prototype.setBlock = function (block) {
    this.block = block;
    this.length = block.length;
};

/******************
 * Factory
 ******************/
var Http2FrameFactory = module.exports.Http2FrameFactory = {};
var klasses = [
    Http2DataFrame,
    Http2HeadersFrame,
    Http2PriorityFrame,
    Http2RstStreamFrame,
    Http2SettingsFrame,
    Http2PushPromiseFrame,
    Http2PingFrame,
    Http2GoawayFrame,
    Http2WindowUpdateFrame,
    Http2ContinuationFrame,
    Http2Frame,
    Http2Frame,
];
Http2FrameFactory.createFrame = function (buf) {
    var klass = klasses[buf[2]];
    if (klass) {
        return new klass(buf);
    } else {
        console.log('Unknown frame type: ' + buf[2]);
        return new Http2Frame(buf);
    }
};
Http2FrameFactory.createRequestFrames = function (headers, hpack) {
    var frames = [], f, i;
    var block = hpack.encode(headers);
    if (block.length >= 16384) {
        f = new Http2HeadersFrame();
        f.setBlock(block.slice(0, 16384), 0);
        frames.push(f);
        i = 16383;
        while (i < block.length) {
            f = new Http2ContinuationFrame();
            f.setBlock(block.slice(i, i + 16384), 0);
            i += 16384;
            frames.push(f);
        }
        f.flags |= Http2HeadersFrame.FLAG_END_HEADERS | Http2HeadersFrame.FLAG_END_STREAM;
    } else {
        f = new Http2HeadersFrame();
        f.flags |= Http2HeadersFrame.FLAG_END_HEADERS | Http2HeadersFrame.FLAG_END_STREAM;
        f.setBlock(block, 0);
        frames.push(f);
    }
    return frames;
};
Http2FrameFactory.registerFrame = function (type, klass) {
    klasses[type] = klass;
};
