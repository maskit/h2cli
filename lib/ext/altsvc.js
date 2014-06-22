var util = require('util');
var h2 = require('../h2');
var h2frame = require('../frame');
var h2map = require('../map');

var TYPE_CODE = 0x0A;

var Http2AltSvcFrame = h2frame.Http2AltSvcFrame = function (buf) {
    if (!(this instanceof Http2AltSvcFrame)) {
        return new Http2AltSvcFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};

var handleAltSvcFrame = function (stream, frame) {
    console.log('ALTSVC is not implemented yet.');
};
util.inherits(Http2AltSvcFrame, h2frame.Http2Frame);
h2frame.Http2FrameFactory.registerFrame(TYPE_CODE, Http2AltSvcFrame);
h2.registerFrameHandler(TYPE_CODE, handleAltSvcFrame);
h2map.frameType2Name[TYPE_CODE] = 'ALTSVC';
