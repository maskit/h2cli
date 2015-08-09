var util = require('util');
var h2frame = require('../frame');
var Http2Frame = h2frame.Http2Frame;

var TYPE_CODE = 0x04;

/******************
 * SETTINGS FRAME
 ******************/
var Http2SettingsFrame = module.exports = function (buf) {
    if (!(this instanceof Http2SettingsFrame)) {
        return new Http2SettingsFrame(buf);
    }
    if (buf) {
        this.buf = buf;
    } else {
        this.buf = new Buffer([0x00, 0x00, 0x00, TYPE_CODE, 0x00, 0x00, 0x00, 0x00, 0x00]);
    }
};
util.inherits(Http2SettingsFrame, Http2Frame);
Object.defineProperty(Http2SettingsFrame, 'TYPE_CODE', {
    get: function () { return TYPE_CODE; },
});

Http2Frame.defineFlags(Http2SettingsFrame, {
    ACK: { value: 0x01 },
});

Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_HEADER_TABLE_SIZE', {
    get: function () { return 1; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_ENABLE_PUSH', {
    get: function () { return 2; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_MAX_CONCURRENT_STREAMS', {
    get: function () { return 3; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_INITIAL_WINDOW_SIZE', {
    get: function () { return 4; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_MAX_FRAME_SIZE', {
    get: function () { return 5; },
});
Object.defineProperty(Http2SettingsFrame, 'PARAM_SETTINGS_MAX_HEADER_LIST_SIZE', {
    get: function () { return 6; },
});

Http2SettingsFrame.prototype.getParamCount = function () {
    return this.length / 6;
};
Http2SettingsFrame.prototype.getParamByIndex = function (index) {
    if (index >= this.getParamCount()) {
        return void(0);
    }
    return {
        id: this.buf.readUInt16BE(Http2Frame.HEADER_SIZE + 6 * index),
        value: this.buf.readUInt32BE(Http2Frame.HEADER_SIZE + 6 * index + 2)
    };
};
Http2SettingsFrame.prototype.getParamById = function (id) {
    var param, i, n = this.getParamCount();
    for (i = 0; i < n; i++) {
        param = this.getParamByIndex(i);
        if (param.id === id) {
            return param;
        }
    }
    return void(0);
};
Http2SettingsFrame.prototype.getParamIndexOf = function (id) {
    var param, i, n = this.getParamCount();
    for (i = 0; i < n; i++) {
        param = this.getParamByIndex(i);
        if (param.id === id) {
            return i;
        }
    }
    return void(0);
};
Http2SettingsFrame.prototype.setParam = function (id, value) {
    var index;
    if (typeof (index = this.getParamIndexOf(id)) !== 'undefined') {
        this.buf.writeUInt32BE(value, Http2Frame.HEADER_SIZE + 6 * index + 2);
    } else {
        var newBuf = new Buffer(6);
        newBuf.writeUInt16BE(id, 0);
        newBuf.writeUInt32BE(value, 2);
        this.buf = Buffer.concat([this.buf, newBuf], this.buf.length + 6);
        this.length += 6;
    }
};
