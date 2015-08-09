var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x02;

/******************
 * PRIORITY FRAME
 ******************/
var Http2PriorityFrame = module.exports = function (buf) {
    if (!(this instanceof Http2PriorityFrame)) {
        return new Http2PriorityFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x00, 0x05, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PriorityFrame, Http2Frame);

Object.defineProperty(Http2PriorityFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});

Http2Frame.defineFields(Http2PriorityFrame, {
    streamDependency: { offset: Http2Frame.HEADER_SIZE, bitLength: 31 },
    weight: { offset: Http2Frame.HEADER_SIZE + 4, bitLength: 1 * 8 },
});
