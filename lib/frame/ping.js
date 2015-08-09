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

Http2PingFrame.prototype.getPayload = function () {
    return this.buf.slice(Http2Frame.HEADER_SIZE, Http2Frame.HEADER_SIZE + 8);
};
Http2PingFrame.prototype.setPayload = function (payload) {
    this.buf[Http2Frame.HEADER_SIZE + 0] = payload[0];
    this.buf[Http2Frame.HEADER_SIZE + 1] = payload[1];
    this.buf[Http2Frame.HEADER_SIZE + 2] = payload[2];
    this.buf[Http2Frame.HEADER_SIZE + 3] = payload[3];
    this.buf[Http2Frame.HEADER_SIZE + 4] = payload[4];
    this.buf[Http2Frame.HEADER_SIZE + 5] = payload[5];
    this.buf[Http2Frame.HEADER_SIZE + 6] = payload[6];
    this.buf[Http2Frame.HEADER_SIZE + 7] = payload[7];
};
