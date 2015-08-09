var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x00;

/******************
 * DATA FRAME
 ******************/
var Http2DataFrame = module.exports = function (buf) {
    if (!(this instanceof Http2DataFrame)) {
        return new Http2DataFrame(buf);
    }
    if (buf) {
        this.buf = buf;
        if (this.flags & Http2DataFrame.FLAG_PADDED) {
            this.data = buf.slice(Http2Frame.HEADER_SIZE + 1, buf.length - this.padLength);
        } else {
            this.data = buf.slice(Http2Frame.HEADER_SIZE);
        }
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
        this.data = new Buffer(0);
    }
};
util.inherits(Http2DataFrame, Http2Frame);
Object.defineProperty(Http2DataFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});

Http2Frame.defineFlags(Http2DataFrame, {
    END_STREAM: { value: 0x01 },
    PADDED:     { value: 0x08 },
});

Object.defineProperty(Http2DataFrame.prototype, 'padLength', {
    get: function () {
             if (this.flags & Http2DataFrame.FLAG_PADDED) {
                 return this.buf[Http2Frame.HEADER_SIZE + 0];
             } else {
                 return 0;
             }
    },
    set: function (length) {
             if (this.flags & Http2DataFrame.FLAG_PADDED) {
                 this.buf[Http2Frame.HEADER_SIZE + 0] = length;
             } else {
                 this.buf = Buffer.concat([
                     this.buf.slice(0, Http2Frame.HEADER_SIZE),
                     new Buffer([length]),
                     this.buf.slice(Http2Frame.HEADER_SIZE)]);
             }
    }
});
Object.defineProperty(Http2DataFrame, 'MAX_PAD_LENGTH', {
    get: function () { return 256; },
});

Http2DataFrame.prototype.getBuffer = function () {
    var bufs = [], padding;
    if (this.flags & Http2DataFrame.FLAG_PADDED) {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE + 1));
        bufs.push(this.data);
        padding = new Buffer(this.padLength);
        padding.fill(0);
        bufs.push(padding);
    } else {
        bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE));
        bufs.push(this.data);
    }
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
Http2DataFrame.prototype.getData = function () {
    return this.data;
};
Http2DataFrame.prototype.setData = function (data, padding) {
    this.data = data;
    this.padLength = padding;
    if (padding) {
        this.flags |= Http2DataFrame.FLAG_PADDED;
        this.length = this.data.length + 1 + this.padLength;
    } else {
        this.flags &= ~Http2DataFrame.FLAG_PADDED;
        this.length = this.data.length;
    }
};

