var util = require('util');
var h2map = require('../map');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x03;

/******************
 * RST_STREAM FRAME
 ******************/
var Http2RstStreamFrame = module.exports = function (buf) {
    if (!(this instanceof Http2RstStreamFrame)) {
        return new Http2RstStreamFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x04, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2RstStreamFrame, Http2Frame);
Object.defineProperty(Http2RstStreamFrame, 'TYPE_CODE', {
    get: function () { return 0x03; },
});
Http2RstStreamFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Error Code: ' + h2map.errorCode2Name[this.getErrorCode()];
    return str;
};
Http2RstStreamFrame.prototype.getErrorCode = function () {
    return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
};
