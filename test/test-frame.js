var assert = require("assert")
var fs = require('fs');
var h2frame = require('../lib/frame');

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
