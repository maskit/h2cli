var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x01;

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
        this.buf = new Buffer([0x00, 0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        this.block = new Buffer(0);
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
        if (this.flags & Http2HeadersFrame.FLAG_END_HEADERS) {
            flags.push('END_HEADERS');
        }
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            flags.push('PADDED');
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
            flags.push('PRIORITY');
        }
        str += flags.join(' | ');
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            str += "\n";
            str += ' Padding: ';
            str += this.padLength;
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
        }
    }
    return str;
};
Object.defineProperty(Http2HeadersFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});
Object.defineProperty(Http2HeadersFrame, 'FLAG_END_STREAM', {
    get: function () { return 0x01; },
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
