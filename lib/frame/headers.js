var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

/******************
 * HEADERS FRAME
 ******************/
var Http2HeadersFrame = module.exports = function (buf) {
    if (!(this instanceof Http2HeadersFrame)) {
        return new Http2HeadersFrame(buf);
    }
    if (buf) {
        this.buf = buf;
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
                this.block = buf.slice(Http2Frame.HEADER_SIZE + 6, buf.length - this.padLength);
            } else {
                this.block = buf.slice(Http2Frame.HEADER_SIZE + 1, buf.length - this.padLength);
            }
        } else {
            if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
                this.block = buf.slice(Http2Frame.HEADER_SIZE + 5);
            } else {
                this.block = buf.slice(Http2Frame.HEADER_SIZE);
            }
        }
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, Http2HeadersFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        this.block = new Buffer(0);
    }
};
util.inherits(Http2HeadersFrame, Http2Frame);

Http2Frame.defineType(Http2HeadersFrame, {
    NAME: 'HEADERS',
    CODE: 0x01,
});

Http2Frame.defineFlags(Http2HeadersFrame, {
    END_STREAM:  { value: 0x01 },
    END_HEADERS: { value: 0x04 },
    PADDED:      { value: 0x08 },
    PRIORITY:    { value: 0x20 },
});

Object.defineProperty(Http2HeadersFrame, 'MAX_PAD_LENGTH', {
    get: function () { return 256; },
});
Object.defineProperty(Http2HeadersFrame.prototype, 'padLength', {
    get: function () {
             if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
                 return this.buf[Http2Frame.HEADER_SIZE + 0];
             } else {
                 return 0;
             }
    },
    set: function (length) {
             if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
                 this.buf[Http2Frame.HEADER_SIZE + 0] = length;
             } else {
                 this.buf = Buffer.concat([
                     this.buf.slice(0, Http2Frame.HEADER_SIZE),
                     new Buffer([length]),
                     this.buf.slice(Http2Frame.HEADER_SIZE)]);
             }
    }
});
Http2HeadersFrame.prototype.getBuffer = function () {
    var bufs = [], padding;
    if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE + 1));
        bufs.push(this.block);
        padding = new Buffer(this.padLength);
        padding.fill(0);
        bufs.push(padding);
    } else {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE));
        bufs.push(this.block);
    }
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
Http2HeadersFrame.prototype.getBlock = function () {
    return this.block;
};
Http2HeadersFrame.prototype.setBlock = function (block, paddingLen) {
    var length = 0;

    this.block = block;
    this.padLength = paddingLen;
    length += block.length;

    if (paddingLen) {
        this.flags |= Http2HeadersFrame.FLAG_PADDED;
        length += 1 + paddingLen;
    } else {
        this.flags &= ~Http2HeadersFrame.FLAG_PADDED;
    }

    this.length = length;
};
