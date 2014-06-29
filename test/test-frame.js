var assert = require("assert")
var fs = require('fs');
var h2frame = require('../lib/frame');

describe('Http2Frame:', function () {
    describe('HEADER_SIZE', function () {
        it('should be a constant value for header size', function () {
            assert.equal(h2frame.Http2Frame.HEADER_SIZE, 8);
            h2frame.Http2PingFrame.FLAG_ACK = 9999;
            assert.equal(h2frame.Http2Frame.HEADER_SIZE, 8);
        });
    });
    describe('length property', function () {
        it('should be the length of payload', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 0);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 256);
            frame = new h2frame.Http2Frame(new Buffer([0x3F, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 16383);
            frame = new h2frame.Http2Frame(new Buffer([0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.length, 0);
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
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 255);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.type, 0);
            frame.type = 99;
            assert.equal(frame.type, 99);
        });
    });
    describe('flags property', function () {
        it('should be the flags which the frame has', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0x01);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0xFF);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.flags, 0);
            frame.flags |= 0xFF;
            assert.equal(frame.flags, 0xFF);
        });
    });
    describe('streamId property', function () {
        it('should be the streamId of the frame', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
            assert.equal(frame.streamId, 0);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]));
            assert.equal(frame.streamId, 1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF, 0xFF, 0xFF]));
            assert.equal(frame.streamId, Math.pow(2, 31) -1);
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]));
            assert.equal(frame.streamId, Math.pow(2, 31) -1);
        });
        it('should be writable', function () {
            var frame;
            frame = new h2frame.Http2Frame(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
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
        var buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
        var frame = new h2frame.Http2DataFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('FLAG_END_STREAM', function () {
        it('should be a constant value for END_STREAM flag', function () {
            assert.equal(h2frame.Http2DataFrame.FLAG_END_STREAM, 0x1);
            h2frame.Http2DataFrame.FLAG_END_STREAM = 9999;
            assert.equal(h2frame.Http2DataFrame.FLAG_END_STREAM, 0x1);
        });
    });
    describe('FLAG_END_SEGMENT', function () {
        it('should be a constant value for END_SEGMENT flag', function () {
            assert.equal(h2frame.Http2DataFrame.FLAG_END_SEGMENT, 0x2);
            h2frame.Http2DataFrame.FLAG_END_SEGMENT = 9999;
            assert.equal(h2frame.Http2DataFrame.FLAG_END_SEGMENT, 0x2);
        });
    });
    describe('FLAG_PADDED', function () {
        it('should be a constant value for PADDED flag', function () {
            assert.equal(h2frame.Http2DataFrame.FLAG_PADDED, 0x8);
            h2frame.Http2DataFrame.FLAG_PADDED = 9999;
            assert.equal(h2frame.Http2DataFrame.FLAG_PADDED, 0x8);
        });
    });
    describe('padLength property', function () {
        var frame = new h2frame.Http2DataFrame(new Buffer([
                0x00, 0x0A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x00]));
        it('should return length of pad', function () {
            assert.equal(frame.padLength, 1);
            frame.setData(new Buffer([]), 0);
            assert.equal(frame.padLength, 0);
        });
    });
    describe('#toString()', function () {
        var frame;

        beforeEach(function () {
            frame = new h2frame.Http2DataFrame();
        });

        it('should return a string containing frame name', function () {
            assert.notEqual(frame.toString().indexOf('DATA'), -1);
        });
        it('should return a string representation of the flags', function () {
            assert.equal(frame.toString().indexOf('END_STREAM'), -1);
            assert.equal(frame.toString().indexOf('END_SEGMENT'), -1);
            assert.equal(frame.toString().indexOf('END_PADDED'), -1);
            frame.flags = h2frame.Http2DataFrame.FLAG_END_STREAM;
            assert.notEqual(frame.toString().indexOf('END_STREAM'), -1);
            frame.flags = h2frame.Http2DataFrame.FLAG_END_SEGMENT;
            assert.notEqual(frame.toString().indexOf('END_SEGMENT'), -1);
            frame.flags = h2frame.Http2DataFrame.FLAG_PADDED;
            assert.notEqual(frame.toString().indexOf('PADDED'), -1);
        });
        it('should return a string containing padding length', function () {
            frame.setData(new Buffer(128), 10);
            assert.notEqual(frame.toString().indexOf('Padding: 10'), -1);
        });
    });
    describe('#getBuffer()', function () {
        var buf = new Buffer([
            0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
        var frame = new h2frame.Http2DataFrame(buf);
        it('should return a buffer, and its length should be sum of frame length plus 8', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, frame.length + 8);
        });
        it('should return whole data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('#getData()', function () {
        var frame = new h2frame.Http2DataFrame(new Buffer([
                0x00, 0x0A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x01,
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
                0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]));
        it('should change data part', function () {
            var data = new Buffer([0x0A, 0x0B, 0x0C, 0x0D]);
            frame.setData(data);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(8), data);
            frame.setData(data, 2);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(9, 13), data);
            frame.setData(data);
            assert.deepEqual(frame.getData(), data);
            assert.deepEqual(frame.getBuffer().slice(8), data);
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
        var buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
        var frame = new h2frame.Http2PingFrame(buf);
        it('should have same data', function () {
            assert.deepEqual(frame.getBuffer(), buf);
        });
    });
    describe('FLAG_ACK', function () {
        it('should be a constant value for ACK flag', function () {
            assert.equal(h2frame.Http2PingFrame.FLAG_ACK, 0x1);
            h2frame.Http2PingFrame.FLAG_ACK = 9999;
            assert.equal(h2frame.Http2PingFrame.FLAG_ACK, 0x1);
        });
    });
    describe('#toString()', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should return a string containing frame name', function () {
            assert.notEqual(frame.toString().indexOf('PING'), -1);
        });
        it('should return a string containing payload informatin', function () {
            assert.notEqual(frame.toString().indexOf('Payload:'), -1);
        });
    });
    describe('#getBuffer()', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should return a buffer, and its length should be 16 octets', function () {
            assert(frame.getBuffer() instanceof Buffer);
            assert.equal(frame.getBuffer().length, 16);
        });
    });
    describe('#getPayload()', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should return a buffer, and its length should be 8 octets', function () {
            assert(frame.getPayload() instanceof Buffer);
            assert.equal(frame.getPayload().length, 8);
        });
    });
    describe('#setPayload()', function () {
        var frame = new h2frame.Http2PingFrame();
        it('should set the given data into the buffer', function () {
            var expected = new Buffer([0x11, 0x22, 0x33, 0x44, 0xAA, 0xBB, 0xCC, 0xDD]);
            frame.setPayload(expected);
            assert.deepEqual(frame.getPayload(), expected);
            assert.deepEqual(frame.getBuffer().slice(8, 16), expected);
        });
    });
});

describe('Http2FrameFactory:', function () {
    describe('#createFrame()', function () {
        it('should create an appropriate frame instance', function () {
            var frame, buf;
            // DATA
            buf = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2DataFrame);
            // HEADERS
            buf = new Buffer([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2HeadersFrame);
            // PRIORITY
            buf = new Buffer([0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PriorityFrame);
            // RST_STREAM
            buf = new Buffer([0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2RstStreamFrame);
            // SETTINGS
            buf = new Buffer([0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2SettingsFrame);
            // PUSH_PROMISE
            buf = new Buffer([0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PushPromiseFrame);
            // PING
            buf = new Buffer([0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2PingFrame);
            // GOAWAY
            buf = new Buffer([0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2GoawayFrame);
            // WINDOW_UPDATE
            buf = new Buffer([0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2WindowUpdateFrame);
            // CONTINUATION
            buf = new Buffer([0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2ContinuationFrame);
        });
        it('should create an Http2Frame instance if type code is unknown', function () {
            var buf, frame;
            buf = new Buffer([0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
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
            frames = h2frame.Http2FrameFactory.createRequestFrames({}, hpackMock);
            assert.equal(frames.length, 1);
            blockSize = 1;
            frames = h2frame.Http2FrameFactory.createRequestFrames({}, hpackMock);
            assert.equal(frames.length, 1);
            blockSize = 16383;
            frames = h2frame.Http2FrameFactory.createRequestFrames({}, hpackMock);
            assert.equal(frames.length, 1);
            blockSize = 16384;
            frames = h2frame.Http2FrameFactory.createRequestFrames({}, hpackMock);
            assert.equal(frames.length, 2);
        });
    });
    describe('#registerFrame()', function () {
        it('should add a supported frame type', function () {
            var buf, frame, newFrameClass;
            buf = new Buffer([0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof h2frame.Http2Frame);
            newFrameClass = function () {};
            h2frame.Http2FrameFactory.registerFrame(0xFF, newFrameClass);
            buf = new Buffer([0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00]);
            frame = h2frame.Http2FrameFactory.createFrame(buf);
            assert(frame instanceof newFrameClass);
        });
    });
});
