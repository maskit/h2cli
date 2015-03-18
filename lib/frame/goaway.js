var util = require('util');
var h2map = require('../map');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x07;

/******************
 * GOAWAY FRAME
 ******************/
var Http2GoawayFrame = module.exports = function (buf) {
    if (!(this instanceof Http2GoawayFrame)) {
        return new Http2GoawayFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x00, 0x08, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2GoawayFrame, Http2Frame);
Object.defineProperty(Http2GoawayFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});
Object.defineProperty(Http2GoawayFrame.prototype, 'lastStreamId', {
    get: function () {
        return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
    },
    set: function (id) {
        this.buf.writeUInt32BE(id, Http2Frame.HEADER_SIZE);
    }
});
Object.defineProperty(Http2GoawayFrame.prototype, 'errorCode', {
    get: function () {
        return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE + 4);
    },
    set: function (errorCode) {
        this.buf.writeUInt32BE(errorCode, Http2Frame.HEADER_SIZE + 4);
    }
});
Http2GoawayFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Last-Stream-ID: ' + this.lastStreamId;
    str += "\n";
    str += ' Error Code: ' + h2map.errorCode2Name[this.errorCode];
    if (this.length > 8) {
        str += "\n";
        str += ' Additional Debug Data: ';
    }
    return str;
};
