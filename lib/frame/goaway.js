var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

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
                0x00, 0x00, 0x08, Http2GoawayFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2GoawayFrame, Http2Frame);

Http2Frame.defineType(Http2GoawayFrame, {
    NAME: 'GOAWAY',
    CODE: 0x07,
});

Http2Frame.defineFields(Http2GoawayFrame, {
    lastStreamId:        { type: 'UINT',   offset: Http2Frame.HEADER_SIZE,     bitLength: 4 * 8 },
    errorCode:           { type: 'UINT',   offset: Http2Frame.HEADER_SIZE + 4, bitLength: 4 * 8 },
    additionalDebugData: { type: 'BUFFER', offset: Http2Frame.HEADER_SIZE + 8, byteLength: void(0) },
});
