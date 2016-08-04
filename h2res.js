#!/usr/bin/env node

var h2cli = require('.');
var HPACK = require('hpack');
var fs = require('fs');

var tmp = new Buffer(0);
process.stdin.on('data', function (chunk) {
    chunk = Buffer.concat([tmp, chunk]);
    tmp = new Buffer(0);
    while (chunk !== null && chunk.length >= 9) {
        f = h2cli.frame.Http2FrameFactory.createFrame(chunk);
        console.log(h2cli.util.printFrame(f, true));
        if (f instanceof h2cli.frame.Http2DataFrame && f.length > 0) {
            console.log(" Data:");
            console.log(f.getData().toString());
        }
        if (chunk.length >= f.length + 9) {
            chunk = chunk.slice(f.length + 9);
        } else {
            tmp = chunk;
            chunk = null;
        }
    }
});

process.stdin.on('end', function () {
});
