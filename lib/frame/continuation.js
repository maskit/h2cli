var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x09;

/******************
 * CONTINUATION FRAME
 ******************/
var Http2ContinuationFrame = module.exports = function (buf) {
    if (!(this instanceof Http2ContinuationFrame)) {
        return new Http2ContinuationFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]); }
};
util.inherits(Http2ContinuationFrame, Http2Frame);
Object.defineProperty(Http2ContinuationFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});
Http2Frame.defineFlags(Http2ContinuationFrame, {
    END_HEADERS: { value: 0x04 },
});
Http2ContinuationFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    var flags = [];
    if (this.flags) {
        str += "\n";
        str += ' Flags: ';
        if (this.flags & Http2ContinuationFrame.FLAG_END_HEADERS) {
            flags.push('END_HEADERS');
        }
        str += flags.join(' | ');
    }
    return str;
};
Http2ContinuationFrame.prototype.setBlock = function (block) {
    this.block = block;
    this.length = block.length;
};
