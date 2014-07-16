var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x06;

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
                0x00, 0x08, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    }
};
util.inherits(Http2PingFrame, Http2Frame);
Object.defineProperty(Http2PingFrame, 'TYPE_CODE', {
    get: function () { return 0x06; },
});
Object.defineProperty(Http2PingFrame, 'FLAG_ACK', {
    get: function () { return 1; },
});
Http2PingFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += 'Payload: '+ this.getPayload().toString('hex');
    return str;
};
Http2PingFrame.prototype.getPayload = function () {
    return this.buf.slice(8, 16);
};
Http2PingFrame.prototype.setPayload = function (payload) {
    this.buf[8] = payload[0];
    this.buf[9] = payload[1];
    this.buf[10] = payload[2];
    this.buf[11] = payload[3];
    this.buf[12] = payload[4];
    this.buf[13] = payload[5];
    this.buf[14] = payload[6];
    this.buf[15] = payload[7];
};
