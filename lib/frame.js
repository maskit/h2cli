var h2map = require('./map');

var OFFSET_LENGTH_FIELD   = 0,
    OFFSET_TYPE_FIELD     = OFFSET_LENGTH_FIELD   + 3,
    OFFSET_FLAGS_FIELD    = OFFSET_TYPE_FIELD     + 1,
    OFFSET_STREAMID_FIELD = OFFSET_FLAGS_FIELD    + 1,
    OFFSET_PAYLOAD        = OFFSET_STREAMID_FIELD + 4;


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
    get: function () { return OFFSET_PAYLOAD; },
});
Object.defineProperty(Http2Frame.prototype, 'length', {
    get: function () { return (this.buf.readUInt16BE(OFFSET_LENGTH_FIELD) << 8) + this.buf.readUInt8(OFFSET_LENGTH_FIELD + 2); },
    set: function (length) {
        this.buf.writeUInt16BE(length >> 8, OFFSET_LENGTH_FIELD);
        this.buf.writeUInt8(length & 0x0ff, OFFSET_LENGTH_FIELD + 2);
    },
});
Object.defineProperty(Http2Frame.prototype, 'type', {
    get: function () { return this.buf[OFFSET_TYPE_FIELD]; },
    set: function (type) { this.buf[OFFSET_TYPE_FIELD] = type; },
});
Object.defineProperty(Http2Frame.prototype, 'flags', {
    get: function () { return this.buf[OFFSET_FLAGS_FIELD]; },
    set: function (flags) { this.buf[OFFSET_FLAGS_FIELD] = flags; },
});
Object.defineProperty(Http2Frame.prototype, 'streamId', {
    get: function () { return this.buf.readUInt32BE(OFFSET_STREAMID_FIELD) & 0x7FFFFFFF; },
    set: function (id) { this.buf.writeUInt32BE(id, OFFSET_STREAMID_FIELD); },
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

var Http2DataFrame         = module.exports.Http2DataFrame         = require('./frame/data');
var Http2HeadersFrame      = module.exports.Http2HeadersFrame      = require('./frame/headers');
var Http2PriorityFrame     = module.exports.Http2PriorityFrame     = require('./frame/priority');
var Http2RstStreamFrame    = module.exports.Http2RstStreamFrame    = require('./frame/rst_stream');
var Http2SettingsFrame     = module.exports.Http2SettingsFrame     = require('./frame/settings');
var Http2PushPromiseFrame  = module.exports.Http2PushPromiseFrame  = require('./frame/push_promise');
var Http2PingFrame         = module.exports.Http2PingFrame         = require('./frame/ping');
var Http2GoawayFrame       = module.exports.Http2GoawayFrame       = require('./frame/goaway');
var Http2WindowUpdateFrame = module.exports.Http2WindowUpdateFrame = require('./frame/window_update');
var Http2ContinuationFrame = module.exports.Http2ContinuationFrame = require('./frame/continuation');

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
    var klass = klasses[buf[OFFSET_TYPE_FIELD]];
    if (klass) {
        return new klass(buf);
    } else {
        return new Http2Frame(buf);
    }
};
Http2FrameFactory.createRequestFrames = function (hpack, headers, usePadding) {
    var maxFrameSize = 16384; // Should refer to SETTINGS_MAX_FRAME_SIZE
    var frames = [], f, i;
    var block = hpack.encode(headers.sort());
    var maxPadLength = usePadding ? Http2HeadersFrame.MAX_PAD_LENGTH : 0;
    var padLength = Math.floor(Math.random() * (maxPadLength + 1));
    var blockLength = maxFrameSize - padLength - 6; // 6 = PadLength(1) + Stream Dependency(4) + Weight(1)
    if (block.length > blockLength) {
        f = new Http2HeadersFrame();
        f.setBlock(block.slice(0, blockLength), padLength);
        frames.push(f);
        i = blockLength;
        while (i < block.length) {
            f = new Http2ContinuationFrame();
            f.setBlock(block.slice(i, i + maxFrameSize));
            i += maxFrameSize;
            frames.push(f);
        }
        f.flags |= Http2HeadersFrame.FLAG_END_HEADERS;
    } else {
        f = new Http2HeadersFrame();
        f.flags |= Http2HeadersFrame.FLAG_END_HEADERS;
        f.setBlock(block, padLength);
        frames.push(f);
    }
    return frames;
};
Http2FrameFactory.createDataFrames = function (data, usePadding) {
    var maxFrameSize = 16384; // Should refer to SETTINGS_MAX_FRAME_SIZE
    var frames = [], f, i = 0;
    var maxPadLength = usePadding ? Http2DataFrame.MAX_PAD_LENGTH : 0;
    var padLength, dataLength;
    while (i < data.length) {
        padLength = Math.floor(Math.random() * (maxPadLength + 1));
        dataLength = maxFrameSize - padLength - 1; // 1 = PadLength(1)
        f = new Http2DataFrame();
        f.setData(data.slice(i, i + dataLength), padLength);
        i += dataLength;
        frames.push(f);
    }
    if (frames.length === 0) {
        frames.push(new Http2DataFrame());
    }
    return frames;
};
Http2FrameFactory.registerFrame = function (type, klass) {
    klasses[type] = klass;
};
