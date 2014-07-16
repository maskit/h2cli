var util = require('util');
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
                0x00, 0x08, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2GoawayFrame, Http2Frame);
Object.defineProperty(Http2GoawayFrame, 'TYPE_CODE', {
    get: function () { return 0x07; },
});
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
