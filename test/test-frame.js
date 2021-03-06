var assert = require("assert")
var fs = require('fs');
var h2frame = require('../lib/frame');

var FRAME_HEADER_SIZE = 9;

describe('Http2Frame:', function () {
    describe('HEADER_SIZE', function () {
        it('should be a constant value for header size', function () {
            assert.equal(h2frame.Http2Frame.HEADER_SIZE, FRAME_HEADER_SIZE);
            h2frame.Http2PingFrame.FLAG_ACK = 9999;
            assert.equal(h2frame.Http2Frame.HEADER_SIZE, FRAME_HEADER_SIZE);
        });
    });
    describe('length property', function () {
        it('should be the length of payload', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 0);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 256);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x3F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 16383);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 16384);
            frame = new h2frame.Http2Frame(new Buffer([0x80, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 8388863);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 0);
            frame.length = 9999;
            assert.equal(frame.length, 9999);
        });
    });
    describe('type property', function () {
        it('should be the type of frame', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 255);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 0);
            frame.type = 99;
            assert.equal(frame.type, 99);
        });
    });
    describe('flags property', function () {
        it('should be the flags which the frame has', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0x01);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0xFF);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0);
            frame.flags |= 0xFF;
            assert.equal(frame.flags, 0xFF);
        });
    });
    describe('streamId property', function () {
        it('should be the streamId of the frame', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.streamId, 0);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]));
            assert.equal(frame.streamId, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF, 0xFF, 0xFF]));
            assert.equal(frame.streamId, Math.pow(2, 31) -1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]));
            assert.equal(frame.streamId, Math.pow(2, 31) -1);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.streamId, 0);
            frame.streamId = 99999;
            assert.equal(frame.streamId, 99999);
        });
    });
});

describe('Http2DataFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2DataFrame();
        it('should have no payload', function () {
            assert.equal(frame.length, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2DataFrame();
        it('should have type value of DATA frame', function () {
            assert.equal(frame.type , 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2DataFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2DataFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('A frame created with buffer', function () {
        var buf = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
        var frame = new h2frame.Http2DataFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2DataFrame.TYPE_CODE, 0x0);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2DataFrame.TYPE_CODE, 0x0);
        });
    });
    describe('FLAG_END_STREAM', function () {
        it('should be a constant value for END_STREAM flag', function () {
            assert.equal(h2frame.Http2DataFrame.FLAG_END_STREAM, 0x1);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2DataFrame.FLAG_END_STREAM, 0x1);
        });
    });
    describe('FLAG_PADDED', function () {
        it('should be a constant value for PADDED flag', function () {
            assert.equal(h2frame.Http2DataFrame.FLAG_PADDED, 0x8);
            h2frame.Http2DataFrame.FLAG_PADDED = 9999;
            assert.equal(h2frame.Http2DataFrame.FLAG_PADDED, 0x8);
        });
    });
    describe('length property', function () {
        var frame;
        it('should be the length of payload', function () {
            frame = new h2frame.Http2DataFrame();
            assert.equal(frame.length, 0);
            frame.setData(new Buffer([0, 0, 0, 0]), 0);
            assert.equal(frame.length, 4);
            frame.setData(new Buffer([0, 0, 0, 0, 0]), 2);
            assert.equal(frame.length, 8);
        });
    });
    describe('padLength property', function () {
        var frame = new h2frame.Http2DataFrame(new Buffer([
                0x00, 0x00, 0x0A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x00]));
        it('should return length of pad', function () {
            assert.equal(frame.padLength, 1);
            frame.setData(new Buffer([]), 0);
            assert.equal(frame.padLength, 0);
        });
    });
    describe('#getBuffer()', function () {
        var buf = new Buffer([
            0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
        var frame = new h2frame.Http2DataFrame(buf);
        it('should return a buffer, and its length should be sum of frame length plus header size', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, frame.length + FRAME_HEADER_SIZE);
        });
        it('should return whole data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('#getData()', function () {
        var frame = new h2frame.Http2DataFrame(new Buffer([
                0x00, 0x00, 0x0A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x00]));
        it('should return a buffer, and its length should be same as frame length minus padding length', function () {
            assert(frame.getData() instanceof Buffer);
            assert.equal(frame.getData().length, 8);
            assert.equal(frame.getData().length, frame.length - frame.padLength - 1);
        });
        it('should return data part', function () {
            assert.deepEqual(frame.getData(), new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]));
        });
    });
    describe('#setData()', function () {
        var frame = new h2frame.Http2DataFrame(new Buffer([
                0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]));
        it('should change data part', function () {
            var data = new Buffer([0x0A, 0x0B, 0x0C, 0x0D]);
            frame.setData(data);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE), data);
            frame.setData(data, 2);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE + 1, FRAME_HEADER_SIZE + 5), data);
            frame.setData(data);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE), data);
        });
    });
});

describe('Http2HeadersFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2HeadersFrame();
        it('should have 0 octets of payload', function () {
            assert.equal(frame.length, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2HeadersFrame();
        it('should have type value of HEADERS frame', function () {
            assert.equal(frame.type, 1);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2HeadersFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2HeadersFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('A frame created with buffer', function () {
        var buf = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E]);
        var frame = new h2frame.Http2HeadersFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2HeadersFrame.TYPE_CODE, 0x1);
            h2frame.Http2HeadersFrame.TYPE_CODE= 9999;
            assert.equal(h2frame.Http2HeadersFrame.TYPE_CODE, 0x1);
        });
    });
    describe('FLAG_END_STREAM', function () {
        it('should be a constant value for END_STREAM flag', function () {
            assert.equal(h2frame.Http2HeadersFrame.FLAG_END_STREAM, 0x1);
            h2frame.Http2HeadersFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2HeadersFrame.FLAG_END_STREAM, 0x1);
        });
    });
    describe('FLAG_END_HEADERS', function () {
        it('should be a constant value for END_HEADERS flag', function () {
            assert.equal(h2frame.Http2HeadersFrame.FLAG_END_HEADERS, 0x4);
            h2frame.Http2HeadersFrame.FLAG_HEADERS = 9999;
            assert.equal(h2frame.Http2HeadersFrame.FLAG_END_HEADERS, 0x4);
        });
    });
    describe('FLAG_PADDED', function () {
        it('should be a constant value for PADDED flag', function () {
            assert.equal(h2frame.Http2HeadersFrame.FLAG_PADDED, 0x8);
            h2frame.Http2HeadersFrame.FLAG_PADDED = 9999;
            assert.equal(h2frame.Http2HeadersFrame.FLAG_PADDED, 0x8);
        });
    });
    describe('FLAG_PRIORITY', function () {
        it('should be a constant value for PRIORITY flag', function () {
            assert.equal(h2frame.Http2HeadersFrame.FLAG_PRIORITY, 0x20);
            h2frame.Http2HeadersFrame.FLAG_PRIORITY = 9999;
            assert.equal(h2frame.Http2HeadersFrame.FLAG_PRIORITY, 0x20);
        });
    });
    describe('padLength property', function () {
        var frame = new h2frame.Http2HeadersFrame(new Buffer([
                0x00, 0x00, 0x07, 0x05, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x01, 0x02, 0x03, 0x04, 0x00]));
        it('should return length of pad', function () {
            assert.equal(frame.padLength, 1);
            frame.setBlock(new Buffer([]), 0);
            assert.equal(frame.padLength, 0);
        });
    });
    describe('#getBuffer()', function () {
        it('should return a buffer, and its length should be same as header size  if there are no header blocks.', function () {
            var frame = new h2frame.Http2HeadersFrame();
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, FRAME_HEADER_SIZE);
        });
        it('should return a buffer, and its length should be header size + block size.', function () {
            var frame = new h2frame.Http2HeadersFrame(new Buffer([
                    0x00, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x01, 0x02, 0x03, 0x04
                    ]));
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, FRAME_HEADER_SIZE + 4);
        });
    });
    describe('#getBlock', function () {
        var frame = new h2frame.Http2HeadersFrame(new Buffer([
                0x00, 0x00, 0x06, 0x05, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x01, 0x02, 0x03, 0x04, 0x00]));
        it('should return a buffer, and its length should be same as frame length minus padding length', function () {
            assert(frame.getBlock() instanceof Buffer);
            assert.equal(frame.getBlock().length, 4);
            assert.equal(frame.getBlock().length, frame.length - frame.padLength - 1);
        });
        it('should return block part', function () {
            assert.deepEqual(frame.getBlock(), new Buffer([0x01, 0x02, 0x03, 0x04]));
        });
    });
    describe('#setBlock', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2HeadersFrame();
        });
        it('should set header block data', function () {
            frame.setBlock(new Buffer([0x01, 0x02, 0x03, 0x04]));
            assert.deepEqual(new Buffer([
                    0x00, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x01, 0x02, 0x03, 0x04
                    ]), frame.getBuffer());
            assert.deepEqual(new Buffer([
                    0x01, 0x02, 0x03, 0x04
                    ]), frame.getBlock());
        });
        it('should set header block data with padding', function () {
            frame.setBlock(new Buffer([0x01, 0x02, 0x03, 0x04]), 2);
            assert.deepEqual(new Buffer([
                    0x00, 0x00, 0x07, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x02,
                    0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 
                    ]), frame.getBuffer());
            assert.deepEqual(new Buffer([
                    0x01, 0x02, 0x03, 0x04
                    ]), frame.getBlock());
            
        });
    });
});

describe('Http2RstStreamFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2RstStreamFrame();
        it('should have 4 octets of payload', function () {
            assert.equal(frame.length, 4);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2RstStreamFrame();
        it('should have type value of SETTINGS frame', function () {
            assert.equal(frame.type, 3);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2RstStreamFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2RstStreamFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('A frame created with buffer', function () {
        var buf = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C]);
        var frame = new h2frame.Http2RstStreamFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2RstStreamFrame.TYPE_CODE, 0x3);
            h2frame.Http2RstStreamFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2RstStreamFrame.TYPE_CODE, 0x3);
        });
    });
    describe('errorCode property', function () {
        var frame;
        it('should be the error code', function () {
            frame = new h2frame.Http2RstStreamFrame();
            assert.equal(frame.errorCode, 0);
            frame = new h2frame.Http2RstStreamFrame(new Buffer([
                    0x00, 0x00, 0x04, 0x03, 0x00, 0x00, 0x0, 0x00, 0x00,
                    0xFF, 0xFF, 0xFF, 0xFF
                    ]));
            assert.equal(frame.errorCode, 4294967295);
        });
    });
    describe('#getBuffer()', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2RstStreamFrame();
        });
        it('should return a buffer, and its length should be 13 octets.', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, 13);
        });
    });
});

describe('Http2SettingsFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2SettingsFrame();
        it('should have 0 octets of payload', function () {
            assert.equal(frame.length, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2SettingsFrame();
        it('should have type value of SETTINGS frame', function () {
            assert.equal(frame.type, 4);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2SettingsFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2SettingsFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('A frame created with buffer', function () {
        var buf = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
        var frame = new h2frame.Http2SettingsFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2SettingsFrame.TYPE_CODE, 0x4);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2SettingsFrame.TYPE_CODE, 0x4);
        });
    });
    describe('FLAG_ACK', function () {
        it('should be a constant value for ACK flag', function () {
            assert.equal(h2frame.Http2SettingsFrame.FLAG_ACK, 0x1);
            h2frame.Http2SettingsFrame.FLAG_ACK = 9999;
            assert.equal(h2frame.Http2SettingsFrame.FLAG_ACK, 0x1);
        });
    });
    describe('PARAM_SETTINGS_HEADER_TABLE_SIZE', function () {
        it('should be a constant value for SETTINGS_HEADER_TABLE_SIZE(0x1)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_HEADER_TABLE_SIZE, 0x1);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_HEADER_TABLE_SIZE = 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_HEADER_TABLE_SIZE, 0x1);
        });
    });
    describe('PARAM_SETTINGS_ENABLE_PUSH', function () {
        it('should be a constant value for SETTINGS_ENABLE_PUSH(0x2)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_ENABLE_PUSH, 0x2);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_ENABLE_PUSH = 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_ENABLE_PUSH, 0x2);
        });
    });
    describe('PARAM_SETTINGS_MAX_CONCURRENT_STREAMS', function () {
        it('should be a constant value for SETTINGS_MAX_CONCURRENT_STREAMS(0x3)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_CONCURRENT_STREAMS, 0x3);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_CONCURRENT_STREAMS= 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_CONCURRENT_STREAMS, 0x3);
        });
    });
    describe('PARAM_SETTINGS_INITIAL_WINDOW_SIZE', function () {
        it('should be a constant value for SETTINGS_INITIAL_WINDOW_SIZE(0x4)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_INITIAL_WINDOW_SIZE, 0x4);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_INITIAL_WINDOW_SIZE= 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_INITIAL_WINDOW_SIZE, 0x4);
        });
    });
    describe('PARAM_SETTINGS_MAX_FRAME_SIZE', function () {
        it('should be a constant value for SETTINGS_MAX_FRAME_SIZE(0x5)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_FRAME_SIZE, 0x5);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_FRAME_SIZE= 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_FRAME_SIZE, 0x5);
        });
    });
    describe('PARAM_SETTINGS_MAX_HEADER_LIST_SIZE', function () {
        it('should be a constant value for SETTINGS_MAX_HEADER_LIST_SIZE(0x6)', function () {
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_HEADER_LIST_SIZE, 0x6);
            h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_HEADER_LIST_SIZE= 9999;
            assert.equal(h2frame.Http2SettingsFrame.PARAM_SETTINGS_MAX_HEADER_LIST_SIZE, 0x6);
        });
    });
    describe('#getBuffer()', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should return a buffer, and its length should be header size if there are no params.', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, FRAME_HEADER_SIZE);
        });
        it('should return a buffer, and its length should be header size + 6 octets if there is one params.', function () {
            frame.setParam(1, 100);
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, FRAME_HEADER_SIZE + 6);
        });
        it('should return a buffer, and its length should be header size + 12 octets if there is two params.', function () {
            frame.setParam(1, 100);
            frame.setParam(2, 100);
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, FRAME_HEADER_SIZE + 12);
        });
    });
    describe('#getParamCount()', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should return 0 if there are no params.', function () {
            assert.equal(frame.getParamCount(), 0);
        });
        it('should return 1 if there is one params. #1', function () {
            frame = new h2frame.Http2SettingsFrame(new Buffer([
                    0x00, 0x00, 0x06, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.getParamCount(), 1);
            frame.setParam(1, 100);
            assert.equal(frame.getParamCount(), 1);
        });
        it('should return 1 if there is one params. #2', function () {
            frame.setParam(1, 100);
            assert.equal(frame.getParamCount(), 1);
        });
    });
    describe('#getParamByIndex', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should return \'undefined\' if there are no paramters.', function () {
            var param = frame.getParamByIndex(0);
            assert.equal(param, void(0));
            param = frame.getParamByIndex(1);
            assert.equal(param, void(1));
        });
        it('should return the id and value of the parameter specified with the index', function () {
            frame = new h2frame.Http2SettingsFrame(new Buffer([
                    0x00, 0x00, 0x0C, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x01, 0x00, 0x00, 0x00, 0xFF,
                    0x00, 0x02, 0x00, 0x00, 0xFF, 0xFF]));
            var param = frame.getParamByIndex(0);
            assert(param);
            assert.equal(param.id, 0x01);
            assert.equal(param.value, 0xFF);

            param = frame.getParamByIndex(1);
            assert.equal(param.id, 0x02);
            assert.equal(param.value, 0xFFFF);
        });
    });
    describe('#getParamById', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should return \'undefined\' if there are no paramters.', function () {
            var param = frame.getParamById(1);
            assert.equal(param, void(0));
        });
        it('should return the id and value of the parameter specified with id', function () {
            frame = new h2frame.Http2SettingsFrame(new Buffer([
                    0x00, 0x00, 0x0C, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x01, 0x00, 0x00, 0x00, 0xFF,
                    0x00, 0x02, 0x00, 0x00, 0xFF, 0xFF]));
            var param = frame.getParamById(1);
            assert(param);
            assert.equal(param.id, 0x01);
            assert.equal(param.value, 0xFF);

            param = frame.getParamById(2);
            assert.equal(param.id, 0x02);
            assert.equal(param.value, 0xFFFF);
        });
    });
    describe('#getParamIndexOf', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should return \'undefined\' if there are no paramters.', function () {
            var index = frame.getParamIndexOf(1);
            assert.equal(index, void(0));
        });
        it('should return a index of the parameter specified with id', function () {
            frame = new h2frame.Http2SettingsFrame(new Buffer([
                    0x00, 0x00, 0x0C, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x01, 0x00, 0x00, 0x00, 0xFF,
                    0x00, 0x02, 0x00, 0x00, 0xFF, 0xFF]));
            var index = frame.getParamIndexOf(0x01);
            assert.equal(index, 0);

            index = frame.getParamIndexOf(0x02);
            assert.equal(index, 1);
        });
    });
    describe('#setParam', function () {
        var frame;
        beforeEach(function () {
            frame = new h2frame.Http2SettingsFrame();
        });
        it('should set a parameter', function () {
            frame.setParam(0x01, 100);
            frame.setParam(0x02, 999);
            var param;

            assert.equal(2, frame.getParamCount());

            param = frame.getParamByIndex(0);
            assert(param);
            assert.equal(param.id, 1);
            assert.equal(param.value, 100);

            param = frame.getParamByIndex(1);
            assert(param);
            assert.equal(param.id, 2);
            assert.equal(param.value, 999);
        });
        it('should overwrite a parameter', function () {
            frame.setParam(0x01, 100);
            frame.setParam(0x01, 999);

            assert.equal(1, frame.getParamCount());

            var param = frame.getParamByIndex(0);
            assert(param);
            assert.equal(param.id, 1);
            assert.equal(param.value, 999);
        });
    });
});

describe('Http2PushPromiseFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PushPromiseFrame();
        it('should have 4 octets of payload', function () {
            assert.equal(frame.length, 4);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PushPromiseFrame();
        it('should have type value of PUSH_PROMISE frame', function () {
            assert.equal(frame.type, 5);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PushPromiseFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PushPromiseFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2PushPromiseFrame.TYPE_CODE, 0x5);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2PushPromiseFrame.TYPE_CODE, 0x5);
        });
    });
    describe('END_HEADERS', function () {
        it('should be a constant value for END_HEADERS flag', function () {
            assert.equal(h2frame.Http2PushPromiseFrame.FLAG_END_HEADERS, 0x4);
            h2frame.Http2PushPromiseFrame.FLAG_END_HEADERS = 9999;
            assert.equal(h2frame.Http2PushPromiseFrame.FLAG_END_HEADERS, 0x4);
        });
    });
    describe('PADDED', function () {
        it('should be a constant value for PADDED flag', function () {
            assert.equal(h2frame.Http2PushPromiseFrame.FLAG_PADDED, 0x8);
            h2frame.Http2PushPromiseFrame.FLAG_PADDED = 9999;
            assert.equal(h2frame.Http2PushPromiseFrame.FLAG_PADDED, 0x8);
        });
    });
    describe('padLength property', function () {
        var frame = new h2frame.Http2PushPromiseFrame(new Buffer([
                0x00, 0x00, 0x09, 0x05, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x00, 0x00, 0x00, 0xFF, 0x01, 0x02, 0x03, 0x04, 0x00]));
        it('should return length of pad', function () {
            assert.equal(frame.padLength, 1);
            frame.setBlock(new Buffer([]), 0);
            assert.equal(frame.padLength, 0);
        });
    });
    describe('#getBuffer()', function () {
        var buf = new Buffer([
            0x00, 0x00, 0x08, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0xFF, 0x01, 0x02, 0x03, 0x04])
        var frame = new h2frame.Http2PushPromiseFrame(buf);
        it('should return a buffer, and its length should be sum of frame length plus header size', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, frame.length + FRAME_HEADER_SIZE);
        });
        it('should return whole data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('#getBlock()', function () {
        var frame = new h2frame.Http2PushPromiseFrame(new Buffer([
                0x00, 0x00, 0x0A, 0x05, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x00, 0x00, 0x00, 0xFF, 0x01, 0x02, 0x03, 0x04, 0x00]));
        it('should return a buffer, and its length should be same as frame length minus padding length', function () {
            assert(frame.getBlock() instanceof Buffer);
            assert.equal(frame.getBlock().length, 4);
            assert.equal(frame.getBlock().length, frame.length - frame.padLength - 5);
        });
        it('should return block part', function () {
            assert.deepEqual(frame.getBlock(), new Buffer([0x01, 0x02, 0x03, 0x04]));
        });
    });
    describe('#setBlock()', function () {
        var frame = new h2frame.Http2PushPromiseFrame(new Buffer([
                0x00, 0x00, 0x08, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0xFF, 0x01, 0x02, 0x03, 0x04]));
        it('should change block part', function () {
            var block = new Buffer([0x11, 0x22, 0x33, 0x44, 0x55, 0x66]);
            frame.setBlock(block);
            assert.deepEqual(frame.getBlock(), block);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE + 4), block);
            frame.setBlock(block, 2);
            assert.deepEqual(frame.getBlock(), block);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE + 5, FRAME_HEADER_SIZE + 11), block);
            frame.setBlock(block);
            assert.deepEqual(frame.getBlock(), block);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE + 4), block);
        });
    });
});

describe('Http2PingFrame:', function () {
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should have 8 octets of payload', function () {
            assert.equal(frame.length, 8);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should have type value of PING frame', function () {
            assert.equal(frame.type, 6);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should have no flags', function () {
            assert.equal(frame.flags, 0);
        });
    });
    describe('A frame created without buffer', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should have streamId zero', function () {
            assert.equal(frame.streamId, 0);
        });
    });
    describe('A frame created with buffer', function () {
        var buf = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
        var frame = new h2frame.Http2PingFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2PingFrame.TYPE_CODE, 0x6);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2PingFrame.TYPE_CODE, 0x6);
        });
    });
    describe('FLAG_ACK', function () {
        it('should be a constant value for ACK flag', function () {
            assert.equal(h2frame.Http2PingFrame.FLAG_ACK, 0x1);
            h2frame.Http2PingFrame.FLAG_ACK = 9999;
            assert.equal(h2frame.Http2PingFrame.FLAG_ACK, 0x1);
        });
    });
    describe('payload property', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should return a buffer, and its length should be 8 octets', function () {
            assert(frame.payload instanceof Buffer);
            assert.equal(frame.payload.length, 8);
        });
        it('should be writable', function () {
            var expected = new Buffer([0x11, 0x22, 0x33, 0x44, 0xAA, 0xBB, 0xCC, 0xDD]);
            frame.payload = expected;
            assert.deepEqual(frame.payload, expected);
            assert.deepEqual(frame.getBuffer().slice(FRAME_HEADER_SIZE, FRAME_HEADER_SIZE + 8), expected);
        });
    });
    describe('#getBuffer()', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should return a buffer, and its length should be 17 octets', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, 17);
        });
    });
});
describe('Http2GoawayFrame:', function () {
    describe('TYPE_CODE', function () {
        it('should be a constant value for type code', function () {
            assert.equal(h2frame.Http2GoawayFrame.TYPE_CODE, 0x7);
            h2frame.Http2DataFrame.TYPE_CODE = 128;
            assert.equal(h2frame.Http2GoawayFrame.TYPE_CODE, 0x7);
        });
    });
    describe('lastStreamId property', function () {
        var frame;
        it('should be the last stream id', function () {
            frame = new h2frame.Http2GoawayFrame();
            assert.equal(frame.lastStreamId, 0);
            frame = new h2frame.Http2GoawayFrame(new Buffer([
                    0x00, 0x00, 0x04, 0x07, 0x00, 0x00, 0x0, 0x00, 0x03,
                    0x00, 0x00, 0x00, 0x01, 0xFF, 0xFF, 0xFF, 0xFF,
                    ]));
            assert.equal(frame.lastStreamId, 1);
        });
        it('should be the last stream id', function () {
            frame = new h2frame.Http2GoawayFrame();
            frame.lastStreamId = 123;
            assert.equal(frame.lastStreamId, 123);
        });
    });
    describe('errorCode property', function () {
        var frame;
        it('should be the error code', function () {
            frame = new h2frame.Http2GoawayFrame();
            assert.equal(frame.errorCode, 0);
            frame = new h2frame.Http2GoawayFrame(new Buffer([
                    0x00, 0x00, 0x04, 0x07, 0x00, 0x00, 0x0, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF,
                    ]));
            assert.equal(frame.errorCode, 4294967295);
        });
        it('should be the last stream id', function () {
            frame = new h2frame.Http2GoawayFrame();
            frame.errorCode = 123;
            assert.equal(frame.errorCode, 123);
        });
    });
    describe('additionalDebugData property', function () {
        var frame;
        it('should be the additional debug data', function () {
            frame = new h2frame.Http2GoawayFrame();
            assert.deepEqual(frame.additionalDebugData, new Buffer(0));
            frame = new h2frame.Http2GoawayFrame(new Buffer([
                    0x00, 0x00, 0x04, 0x07, 0x00, 0x00, 0x0, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF,
                    0x01, 0x02, 0x03, 0x04
                    ]));
            assert.deepEqual(frame.additionalDebugData, new Buffer([0x01, 0x02, 0x03, 0x04]));
        });
        it('should be writable', function () {
            frame = new h2frame.Http2GoawayFrame();
            frame.additionalDebugData = new Buffer([0x05, 0x06, 0x07, 0x08, 0x9, 0xA, 0x0B, 0x0C]);
            assert.deepEqual(frame.additionalDebugData, new Buffer([0x05, 0x06, 0x07, 0x08, 0x9, 0xA, 0x0B, 0x0C]));
        });
    });
});

describe('Http2FrameFactory:', function () {
    describe('#createFrame()', function () {
        it('should create an appropriate frame instance', function () {
            var frame, buf;
            // DATA
            buf = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2DataFrame);
            // HEADERS
            buf = new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2HeadersFrame);
            // PRIORITY
            buf = new Buffer([0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PriorityFrame);
            // RST_STREAM
            buf = new Buffer([0x00, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2RstStreamFrame);
            // SETTINGS
            buf = new Buffer([0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2SettingsFrame);
            // PUSH_PROMISE
            buf = new Buffer([0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PushPromiseFrame);
            // PING
            buf = new Buffer([0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PingFrame);
            // GOAWAY
            buf = new Buffer([0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2GoawayFrame);
            // WINDOW_UPDATE
            buf = new Buffer([0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2WindowUpdateFrame);
            // CONTINUATION
            buf = new Buffer([0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2ContinuationFrame);
        });
        it('should create an Http2Frame instance if type code is unknown', function () {
            var buf, frame;
            buf = new Buffer([0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2Frame);
        });
    });
    describe('#createRequestFrames()', function () {
        it('should create one HEADERS frame and zero or more CONTINUATION frames', function () {
            var frames, blockSize;
            var hpackMock = {
                'encode': function (headers) {
                    return new Buffer(blockSize);
                }
            };
            blockSize = 0;
            frames = h2frame.Http2FrameFactory.createRequestFrames(hpackMock, [], 0);
            assert.equal(frames.length, 1);
            blockSize = 1;
            frames = h2frame.Http2FrameFactory.createRequestFrames(hpackMock, [], 0);
            assert.equal(frames.length, 1);
            blockSize = 16384 - 6;
            frames = h2frame.Http2FrameFactory.createRequestFrames(hpackMock, [], 0);
            assert.equal(frames.length, 1);
            blockSize = 16384 - 5;
            frames = h2frame.Http2FrameFactory.createRequestFrames(hpackMock, [], 0);
            assert.equal(frames.length, 2);
        });
    });
    describe('#registerFrame()', function () {
        it('should add a supported frame type', function () {
            var buf, frame, newFrameClass;
            buf = new Buffer([0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2Frame);
            newFrameClass = function () {};
            h2frame.Http2FrameFactory.registerFrame(0xFF, newFrameClass);
            buf = new Buffer([0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof newFrameClass);
        });
    });
});
