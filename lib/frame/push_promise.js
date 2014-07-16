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
            this.block = buf.slice(13, buf.length - buf[8]);
        } else {
            this.block = buf.slice(12);
        }
    } else {
        this.block = new Buffer(0);
        this.buf = new Buffer([
                0x00, 0x04, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
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
            flags.push('PADDED');
        }
        str += flags.join(' | ');
        if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
            str += "\n";
            str += ' Padding: ';
            str += this.buf[8];
        }
    }
    str += "\n";
    str += ' Promised Stream ID: ' + this.promisedStreamId;
    return str;
}
Object.defineProperty(Http2PushPromiseFrame, 'TYPE_CODE', {
    get: function () { return 0x05; },
});
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
Object.defineProperty(Http2PushPromiseFrame.prototype, 'padLength', {
    get: function () {
             if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
                 return this.buf[8];
             } else {
                 return 0;
             }
    },
    set: function (length) {
             if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
                 this.buf[8] = length;
             } else {
                 this.buf = Buffer.concat([this.buf.slice(0, 8), new Buffer([length]), this.buf.slice(8)]);
             }
    }
});
Http2PushPromiseFrame.prototype.getBuffer = function () {
    var bufs = [];
    if (this.flags & Http2PushPromiseFrame.FLAG_PADDED) {
        bufs.push(this.buf.slice(0, 13));
        bufs.push(this.block);
        bufs.push(new Buffer(this.padLength));
    } else {
        bufs.push(this.buf.slice(0, 12));
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
        this.padding = null;
        this.flags &= ~Http2PushPromiseFrame.FLAG_PADDED;
    }

    this.length = length;
};
