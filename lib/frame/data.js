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
            this.data = buf.slice(9, buf.length - buf[8]);
        } else {
            this.data = buf.slice(8);
        }
    } else {
        this.buf = new Buffer([0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
        this.data = new Buffer(0);
    }
};
util.inherits(Http2DataFrame, Http2Frame);
Object.defineProperty(Http2DataFrame, 'TYPE_CODE', {
    get: function () { return 0x00; },
});
Object.defineProperty(Http2DataFrame, 'FLAG_END_STREAM', {
    get: function () { return 0x01; },
});
Object.defineProperty(Http2DataFrame, 'FLAG_END_SEGMENT', {
    get: function () { return 0x02; },
});
Object.defineProperty(Http2DataFrame, 'FLAG_PADDED', {
    get: function () { return 0x08; },
});
Object.defineProperty(Http2DataFrame.prototype, 'padLength', {
    get: function () {
             if (this.flags & Http2DataFrame.FLAG_PADDED) {
                 return this.buf[8];
             } else {
                 return 0;
             }
    },
    set: function (length) {
             if (this.flags & Http2DataFrame.FLAG_PADDED) {
                 this.buf[8] = length;
             } else {
                 this.buf = Buffer.concat([this.buf.slice(0, 8), new Buffer([length]), this.buf.slice(8)]);
             }
    }
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
            str += ' Padding: ';
            str += this.buf[8];
        }
    }
    return str;
};
Http2DataFrame.prototype.getBuffer = function () {
    var bufs = [];
    this.length = this.data.length;
    bufs.push(this.buf.slice(0, 8));
    if (this.flags & Http2DataFrame.FLAG_PADDED) {
        bufs.push(new Buffer([this.padLength]));
        bufs.push(this.data);
        bufs.push(new Buffer(this.padLength));
    } else {
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
