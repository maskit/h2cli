var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

/******************
 * PING FRAME
 ******************/
var Http2PingFrame = module.exports = function (buf) {
    if (!(this instanceof Http2PingFrame)) {
        return new Http2PingFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([
                0x00, 0x00, 0x08, Http2PingFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    }
};
util.inherits(Http2PingFrame, Http2Frame);

Http2Frame.defineType(Http2PingFrame, {
    NAME: 'PING',
    CODE: 0x06,
});

Http2Frame.defineFlags(Http2PingFrame, {
    ACK: { value: 0x01 },
});

Http2Frame.defineFields(Http2PingFrame, {
    payload: { type: 'BUFFER', offset: Http2Frame.HEADER_SIZE, byteLength: 8 },
});
