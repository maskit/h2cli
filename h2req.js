#!/usr/bin/env node

var h2cli = require('.');
var HPACK = require('hpack');
var fs = require('fs');

var PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";

var reqJsonFile = process.argv[2];
var reqJson = JSON.parse(fs.readFileSync(reqJsonFile));

var settingsFrame = new h2cli.frame.Http2SettingsFrame();
var settingsFrameAck = new h2cli.frame.Http2SettingsFrame();
settingsFrameAck.flags = h2cli.frame.Http2SettingsFrame.FLAG_ACK;
var reqFrames = h2cli.frame.Http2FrameFactory.createRequestFrames(new HPACK(), reqJson.headers);

// Outoput request data
process.stdout.write(PREFACE, 'ascii');
process.stdout.write(settingsFrame.getBuffer());
process.stdout.write(settingsFrameAck.getBuffer());
reqFrames.forEach(function (frame) {
    frame.streamId = 1;
    process.stdout.write(frame.getBuffer());
});
