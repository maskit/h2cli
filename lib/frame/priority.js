var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

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
                0x00, 0x00, 0x05, Http2PriorityFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PriorityFrame, Http2Frame);

Http2Frame.defineType(Http2PriorityFrame, {
    NAME: 'PRIORITY',
    CODE: 0x02,
});

Http2Frame.defineFields(Http2PriorityFrame, {
    streamDependency: { offset: Http2Frame.HEADER_SIZE,     bitLength: 31 },
    weight:           { offset: Http2Frame.HEADER_SIZE + 4, bitLength: 1 * 8 },
});
