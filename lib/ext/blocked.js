var util = require('util');
var h2 = require('../h2');
var h2frame = require('../frame');
var h2map = require('../map');

var TYPE_CODE = 0x0B;

var Http2BlockedFrame = h2frame.Http2BlockedFrame = function (buf) {
    if (!(this instanceof Http2BlockedFrame)) {
        return new Http2BlockedFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};

var handleBlockedFrame = function (stream, frame) {
    console.log('BLOCKED is not implemented yet.');
};
util.inherits(Http2BlockedFrame, h2frame.Http2Frame);
h2frame.Http2FrameFactory.registerFrame(TYPE_CODE, Http2BlockedFrame);
h2.registerFrameHandler(TYPE_CODE, handleBlockedFrame);
h2map.frameType2Name[TYPE_CODE] = 'BLOCKED';
