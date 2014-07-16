var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x08;

/******************
 * WINDOW_UPDATE FRAME
 ******************/
var Http2WindowUpdateFrame = module.exports = function (buf) {
    if (!(this instanceof Http2WindowUpdateFrame)) {
        return new Http2WindowUpdateFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x04, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2WindowUpdateFrame, Http2Frame);
Http2WindowUpdateFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Window Size Increment: ' + this.windowSizeIncrement;
    return str;
};
Object.defineProperty(Http2WindowUpdateFrame, 'TYPE_CODE', {
    get: function () { return 0x08; },
});
Object.defineProperty(Http2WindowUpdateFrame.prototype, 'windowSizeIncrement', {
    get: function () {
        return this.buf.readUInt32BE(Http2Frame.HEADER_SIZE);
    },
    set: function (size) {
        return this.buf.writeUInt32BE(size, Http2Frame.HEADER_SIZE);
    },
});
