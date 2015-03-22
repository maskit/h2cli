var fs = require('fs');
var h2 = require('../h2');
module.exports = {
    'exec': function (args, callback) {
        var frame;
        switch (args[1]) {
            case 'preface':
                this.client.send(h2.HTTP2_PREFACE, callback);
                break;
            case 'settings':
                frame = new h2.frame.Http2SettingsFrame();
                if ('ack' === args[2]) {
                    frame.flags |= 0x01;
                }
                this.client.send(frame, callback);
                break;
            case 'ping':
                frame = new h2.frame.Http2PingFrame();
                if ('ack' === args[2]) {
                    frame.flags |= 0x01;
                } else if (args[2]) {
                    frame.setPayload(new Buffer(args[2], 'ascii'));
                }
                this.client.send(frame, callback);
                break;
            case 'frame':
                var data = fs.readFileSync(args[3]);
                frame = h2.frame.Http2FrameFactory.createFrame(data);
                this.client.send(frame, parseInt(args[2]), callback);
                break;
            default:
                console.error('Unknown type `' + args[0] + '`');
                callback();
        }
    },
    'arguments': {
        'preface': {},
        'settings': {
            '<ENTER>': {},
            'ack': {}
        },
        'ping': {
            '<ENTER>': {},
            'ack': {}
        },
        'frame': {
            '<stream id>': {
            },
            '*': {
                '<file>': {},
                '*': {}
            }

        },
    },
    'help': {
        'summary': 'Send HTTP/2 frames',
        'description': ''
    }
};
