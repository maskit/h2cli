var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

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
                0x00, 0x00, 0x04, Http2RstStreamFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2RstStreamFrame, Http2Frame);

Http2Frame.defineType(Http2RstStreamFrame, {
    NAME: 'RST_STREAM',
    CODE: 0x03,
});

Http2Frame.defineFields(Http2RstStreamFrame, {
    errorCode: { offset: Http2Frame.HEADER_SIZE, bitLength: 4 * 8},
});
