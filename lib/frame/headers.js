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
                this.block = buf.slice(14, buf.length - buf[8]);
            } else {
                this.block = buf.slice(9, buf.length - buf[8]);
            }
        } else {
            if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
                this.block = buf.slice(13);
            } else {
                this.block = buf.slice(8);
            }
        }
    } else {
        this.buf = new Buffer([0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
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
            flags.push('PADDED');
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
            flags.push('PRIORITY');
        }
        str += flags.join(' | ');
        if (this.flags & Http2HeadersFrame.FLAG_PADDED) {
            str += "\n";
            str += ' Padding: ';
            str += this.buf[0];
        }
        if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
        }
    }
    return str;
};
Object.defineProperty(Http2HeadersFrame, 'TYPE_CODE', {
    get: function () { return 0x01; },
});
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
        padding += this.buf[8];
        offset += 1;
    }
    if (this.flags & Http2HeadersFrame.FLAG_PRIORITY) {
        offset += 5;
    }
    return this.buf.slice(offset, this.buf.length - padding);
};
Http2HeadersFrame.prototype.setBlock = function (block, paddingLen) {
    var length = 0;

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
