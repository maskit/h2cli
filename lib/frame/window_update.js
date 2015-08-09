var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

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
                0x00, 0x00, 0x04, Http2WindowUpdateFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2WindowUpdateFrame, Http2Frame);

Http2Frame.defineType(Http2WindowUpdateFrame, {
    NAME: 'WINDOW_UPDATE',
    CODE: 0x08,
});

Http2Frame.defineFields(Http2WindowUpdateFrame, {
    windowSizeIncrement: { offset: Http2Frame.HEADER_SIZE, bitLength: 4 * 8 },
});
