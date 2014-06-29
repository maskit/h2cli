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
            assert.equal(frame.flags, 0);
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
        it('should have the buffer', function () {
            assert.equal(frame.getBuffer(), buf);
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
