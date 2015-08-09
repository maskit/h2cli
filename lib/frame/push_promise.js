var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x05;

/******************
 * PUSH_PROMISE FRAME
 ******************/
var Http2PushPromiseFrame = module.exports = function (buf) {
    if (!(this instanceof Http2PushPromiseFrame)) {
        return new Http2PushPromiseFrame(buf);
    }
    if (buf) {
        this.buf = buf;
        if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
            this.block = buf.slice(Http2Frame.HEADER_SIZE + 5, buf.length - this.padLength);
        } else {
            this.block = buf.slice(Http2Frame.HEADER_SIZE + 4);
        }
    } else {
        this.block = new Buffer(0);
        this.buf = new Buffer([
                0x00, 0x00, 0x04, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PushPromiseFrame, Http2Frame);

Object.defineProperty(Http2PushPromiseFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});

Http2Frame.defineFlags(Http2PushPromiseFrame, {
    END_HEADERS: { value: 0x04 },
    PADDED:      { value: 0x08 },

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
Object.defineProperty(Http2PushPromiseFrame.prototype, 'padLength', {
    get: function () {
             if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
                 return this.buf[Http2Frame.HEADER_SIZE + 0];
             } else {
                 return 0;
             }
    },
    set: function (length) {
             if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
                 this.buf[Http2Frame.HEADER_SIZE + 0] = length;
             } else {
                 this.buf = Buffer.concat([
                     this.buf.slice(0, Http2Frame.HEADER_SIZE),
                     new Buffer([length]),
                     this.buf.slice(Http2Frame.HEADER_SIZE)]);
             }
    }
});
Http2PushPromiseFrame.prototype.getBuffer = function () {
    var bufs = [], padding;
    if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE + 5));
        bufs.push(this.block);
        padding = new Buffer(this.padLength);
        padding.fill(0);
        bufs.push(padding);
    } else {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE + 4));
        bufs.push(this.block);
    }
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
Http2PushPromiseFrame.prototype.getBlock = function () {
    return this.block;
};
Http2PushPromiseFrame.prototype.setBlock = function (block, paddingLen) {
    var length = 4;

    this.block = block;
    this.padLength = paddingLen;
    length += block.length;

    if (paddingLen) {
        this.flags |= Http2PushPromiseFrame.FLAG_PADDED;
        length += 1 + paddingLen;
    } else {
        this.flags &= ~Http2PushPromiseFrame.FLAG_PADDED;
    }

    this.length = length;
};
