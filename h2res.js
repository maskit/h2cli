#!/usr/bin/env node

var h2cli = require('.');
var HPACK = require('hpack');
var fs = require('fs');

var tmp = new Buffer(0);
process.stdin.on('data', function (chunk) {
    while (chunk.length >= 9) {
        f = h2cli.frame.Http2FrameFactory.createFrame(chunk);
        console.log(h2cli.util.printFrame(f, true));
        if (f instanceof h2cli.frame.Http2DataFrame && f.length > 0) {
            console.log(" Data:");
            console.log(f.getData().toString());
        }
        if (chunk.length >= f.length) {
            chunk = chunk.slice(f.length + 9);
        }
    }
    if (chunk.length !== 0) {
        tmp = Buffer.concat([tmp, chunk]);
    }
});

process.stdin.on('end', function () {
});
