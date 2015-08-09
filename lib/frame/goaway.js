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

Http2Frame.defineFields(Http2GoawayFrame, {
    lastStreamId: { offset: Http2Frame.HEADER_SIZE,     bitLength: 4 * 8 },
    errorCode:    { offset: Http2Frame.HEADER_SIZE + 4, bitLength: 4 * 8 },
});

Object.defineProperty(Http2GoawayFrame.prototype, 'additionalDebugData', {
    get: function () {
        return this.buf.slice(8);
    },
});
