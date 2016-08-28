#!/usr/bin/env node

var h2cli = require('.');
var h2frame = h2cli.frame;
var HPACK = require('hpack');
var fs = require('fs');

const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const hpack = new HPACK();

var seqJsonFile = process.argv[2];
var seqJson = JSON.parse(fs.readFileSync(seqJsonFile));

var FrameName2ObjectName = {
    "data": "Http2DataFrame",
    "headers": "Http2HeadersFrame",
    "priority": "Http2PriorityFrame",
    "rst_stream": "Http2RstStreamFrame",
    "settings": "Http2SettingsFrame",
    "push_promise": "Http2PushPromiseFrame",
    "ping": "Http2PingFrame",
    "goaway": "Http2GoawayFrame",
    "window_update": "Http2WindowUpdateFrame",
    "continuation": "Http2ContinuationFrame",
};

var processors = {
    "send": (s, resolve, reject) => {
        try {
            if (s.type === "preface") {
                process.stdout.write("PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n", 'ascii');
            } else if (s.type === "raw") {
                process.stdout.write(s.data);
            } else {
                let f = new h2frame[FrameName2ObjectName[s.type]]();
                let subp = frameProcessors[s.type];
                if (subp) {
                    subp(s, f);
                }
                generalFrameProcessor(s, f);
                process.stdout.write(f.getBuffer());
            }
            resolve();
        } catch (e) {
            reject();
        }
    },
    "pause": (s, resolve, reject) => {
        process.stdout.cork();
        process.nextTick(() => process.stdout.uncork());
        setTimeout(() => {
            resolve();
        }, s.duration);
    }
,
};

function generalFrameProcessor(s, f) {
    if (s.stream) {
        f.streamId = s.stream;
    }
    if (s.flags) {
        s.flags.split(',').forEach((flag) => {
            if (flag) {
                let flagValue = f.constructor["FLAG_" + flag.toUpperCase()];
                if (typeof flagValue !== 'undefined') {
                    f.flags |= flagValue;
                } else {
                    console.error('FLAG_' + flag.toUpperCase() + ' is not defined');
                }
            }
        });
    }
}
var frameProcessors = {
    "settings": (s, f) => {},
    "headers": (s, f) => {
        let block = hpack.encode(s.headers);
        f.setBlock(block);
    },
};


function run(seq, i) {
    let s = seq[i];
    if (s) {
        let p = processors[s.action];
        new Promise((resolve, reject) => {
            p(s, resolve, reject);
        }).then(() => {
            console.error('Seq#' + i + ' done');
            run(seq, i + 1); 
        });
    }
}
run(seqJson, 0);
