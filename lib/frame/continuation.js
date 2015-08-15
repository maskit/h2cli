var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

/******************
 * CONTINUATION FRAME
 ******************/
var Http2ContinuationFrame = module.exports = function (buf) {
    if (!(this instanceof Http2ContinuationFrame)) {
        return new Http2ContinuationFrame(buf);
    }
    if (buf) {
        this.buf = buf;
        this.block = buf.slice(Http2Frame.HEADER_SIZE);
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, Http2ContinuationFrame.TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]); }
};
util.inherits(Http2ContinuationFrame, Http2Frame);

Http2Frame.defineType(Http2ContinuationFrame, {
    NAME: 'CONTINUATION',
    CODE: 0x09,
});

Http2Frame.defineFlags(Http2ContinuationFrame, {
    END_HEADERS: { value: 0x04 },
});

Http2ContinuationFrame.prototype.getBlock = function () {
    return this.block;
};

Http2ContinuationFrame.prototype.setBlock = function (block) {
    this.block = block;
    this.length = block.length;
};

Http2ContinuationFrame.prototype.getBuffer = function () {
    var bufs = [];
    bufs.push(this.buf.slice(0, Http2Frame.HEADER_SIZE + 1));
    bufs.push(this.block);
    this.buf = Buffer.concat(bufs);
    return this.buf;
};
