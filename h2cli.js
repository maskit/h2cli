#!/usr/local/bin/node
var fs = require('fs');
var h2 = require('./lib/h2');
var h2client = h2.createClient(); 

// load extensions
require('./lib/ext/altsvc');
require('./lib/ext/blocked');

var commands = {};
commands[''] = function (args, callback) {
    callback();
};
commands.connect = function (args, callback) {
    if (!args[1]) {
        args[1] = 'http://localhost:8080/';
        //args[1] = 'https://nghttp2.org/';
        //args[1] = 'http://nghttp2.org/';
    }
    var url = require('url').parse(args[1]);
    var hostname, port, secure;
    if (url.protocol === 'http:') {
        secure = false;
    } else if (url.protocol === 'https:') {
        secure = true;
    } else {
        console.error('Unknown scheme `' + url.protocol + '`');
        callback();
        return 1;
    }
    if (url.hostname) {
        hostname = url.hostname;
    } else {
        console.error('Hostname is empty');
        callback();
        return 1;
    }
    if (url.port) {
        port = url.port;
    } else if (secure) {
        port = 443;
    } else {
        port = 80;
    }
    console.log('Connecting to ' + hostname + ':' + port);
    h2client.connect(hostname, port, {
        'secure': secure,
        'useNpn': true,
        'useUpgrade': false,
    }, function(stream, error) {
        if (stream && stream.authorizationError) {
            console.log(stream.authorizationError);
        }
        if (stream && stream.npnProtocol) {
            console.log('NPN Protocol: ' + stream.npnProtocol);
        }
        callback();
    });
};

commands.send = function (args, callback) {
    switch (args[1]) {
        case 'preface':
            h2client.send(h2.HTTP2_PREFACE, callback);
            break;
        case 'settings':
            var frame = new h2.frame.Http2SettingsFrame();
            if ('ack' === args[2]) {
                frame.flags |= 0x01;
            } else {
                // TODO send current settings to peer
            }
            h2client.send(frame, callback);
            break;
        case 'ping':
            var frame = new h2.frame.Http2PingFrame();
            if ('ack' === args[2]) {
                frame.flags |= 0x01;
            } else if (args[2]) {
                frame.setPayload(new Buffer(args[2], 'ascii'));
            }
            h2client.send(frame, callback);
            break;
        case 'frame':
            var data = fs.readFileSync(args[3]);
            var frame = h2.frame.Http2FrameFactory.createFrame(data);
            h2client.send(frame, args[2], callback);
            break;
        default:
            console.error('Unknown type `' + args[0] + '`');
            callback();
    }
};

commands.set = function (args, callback) {
    switch (args[1]) {
        case 'settings':
            h2client.setSetting(args[2], args[3], callback);
            break;
    }
};

commands.show = function (args, callback) {
    switch (args[1]) {
        case 'settings':
            console.log(h2client.connection.settings);
            callback();
            break;
        case 'streams':
            console.log(h2client.connection.streams);
            callback();
            break;
        default:
            console.error();
            callback();
    }
};

commands.get = function (args, callback) {
    if (!args[1]) {
        console.log('usage: get URL');
        callback();
        return;
    }
    var response = {
        header: null,
        body: null
    };
    h2client.request(args[1], 'GET', {
        'header': function (headers) {
            response.header = headers;
        },
        'data': function (data) {
            if (response.body) {
                response.body += data;
            } else {
                response.body = data;
            }
        },
        'close': function () {
            console.log('Response');
            console.log(' Header');
            response.header.forEach(function (h) {
                console.log('  ' + h[0] + ': ' + h[1]);
            });
            console.log(' Body');
            console.log('  ' + response.body.toString());
            callback();
        },
    });
};

commands.head = function (args, callback) {
    if (!args[1]) {
        console.log('usage: head URL');
        callback();
        return;
    }
    var response;
    h2client.request(args[1], 'HEAD', {
        'header': function (headers) {
            response = headers;
        },
        'data': function (data) {
        },
        'close': function () {
            console.log(response);
            callback();
        },
    });
};

commands.post = function (args, callback) {
};

commands.close = function (args, callback) {
    h2client.close(callback);
};

var completer = function (line) {
    completions = Object.getOwnPropertyNames(commands);
    return [completions, line];
};

var rl = require('readline').createInterface(process.stdin, process.stdout, completer);
rl.setPrompt('h2> ');
rl.setColor = function (colorAttr) {
    this.write("\033[" + colorAttr + "m");
};
rl.clearColor = function () {
    this.write("\033[m");
};
rl.prompt();
rl.on('line', function(line) {
    var args = line.trim().split(' ');
    var cmd = commands[args[0]]
    var callback = function() { rl.prompt(); };
    if (cmd) {
        cmd(args, callback);
    } else {
        console.error('Unknown command `' + args[0] + '`');
        callback();
    }
}).on('close', function() {
    process.exit(0);
});

