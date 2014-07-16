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
                0x00, 0x05, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2PriorityFrame, Http2Frame);
Http2PriorityFrame.prototype.toString = function () {
    var str = Http2Frame.prototype.toString.call(this);
    str += "\n";
    str += ' Stream Dependency: ' + this.streamDependency;
    str += "\n";
    str += ' Weight: ' + this.weight;
    return str;
};
Object.defineProperty(Http2PriorityFrame, 'TYPE_CODE', {
    get: function () { return 0x02; },
});
Object.defineProperty(Http2PriorityFrame, 'streamDependency', {
    get: function () { return 0; },
    set: function (streamId) {  },
});
Object.defineProperty(Http2PriorityFrame, 'weight', {
    get: function () { return 0; },
    set: function (weight) {  },
});
