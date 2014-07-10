var fs = require('fs');
var h2 = require('./h2');
var h2client = h2.createClient(); 
var commands = {};
commands.table = {};

var createCompleter = function (hints) {
    return function (line) {
        var args = line.split(' ');
        var i, candidates, hits;
        candidates = hints;
        for (i = 1; i < args.length - 1; i++) {
            if (candidates[args[i]]) {
                candidates = candidates[args[i]];
            } else if (candidates['*']) {
                candidates = candidates['*'];
            } else {
                break;
            }
        }

        hits = Object.keys(candidates).filter(function(c) { return c.indexOf(args[i]) === 0 && args[i][0] !== '<'  && args[i][0] !== '*'});
        if (hits.length === 0) {
            return [Object.keys(candidates).filter(function(c) { return c !== '*'; }).concat(['']), line];
        } else if (hits.length === 1) {
            if (hits[0][0] === '<') {
                return [[hits[0], ''], line];
            } else {
                return [[args.slice(0, i).join(' ') + ' ' + hits[0] + ' '], line];
            }
        } else if (hits.length > 1) {
            return [hits.filter(function(c) { return c !== '*'; }).concat(['']), line];
        }

    };
};

commands.table.connect = {
    'exec': function (args, callback) {
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
    },
    'getCompletions': createCompleter({
        '<url>': {}
    }),
    'help': {
        'summary': 'Connect to server',
        'description': ''
    }
};

commands.table.send = {
    'exec': function (args, callback) {
        switch (args[1]) {
            case 'preface':
                h2client.send(h2.HTTP2_PREFACE, callback);
                break;
            case 'settings':
                var frame = new h2.frame.Http2SettingsFrame();
                if ('ack' === args[2]) {
                    frame.flags |= 0x01;
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
    },
    'getCompletions': createCompleter({
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
            '<file>': {}
        },
    }),
    'help': {
        'summary': 'Send HTTP/2 frames',
        'description': ''
    }
};

commands.table.set = {
    'exec': function (args, callback) {
        if (args.length != 4) {
            console.log('usage: set settings <name> <value>');
            console.log('       set config <name> <value>');
            callback();
            return;
        }
        switch (args[1]) {
            case 'settings':
                h2client.setSetting(args[2], args[3], callback);
                break;
            case 'config':
                h2client.setConfig(args[2], args[3], callback);
                break;
        }
    },
    'getCompletions': createCompleter({
        'settings': {
            'HEADER_TABLE_SIZE': { '<0-4294967295>': {} },
            'ENABLE_PUSH': { '<0-1>': {}},
            'MAX_CONCURRENT_STREAMS': { '<0-4294967295>': {} },
            'INITIAL_WINDOW_SIZE': { '<0-4294967295>': {}},
        },
        'config': {
            '<name>': {},
            '*': {
                '<value>': {},
                '*': {}
            }
        }
    }),
    'help': {
        'summary': 'Set settings or statuses',
        'description': ''
    }
}

commands.table.show = {
    'exec': function (args, callback) {
        switch (args[1]) {
            case 'settings':
                if (h2client.connection) {
                    console.log('NAME                            | Local | Remote');
                    console.log('SETTINGS_HEADER_TABLE_SIZE      | %d | %d',
                            h2client.connection.getLocalSetting(1),
                            h2client.connection.getRemoteSetting(1));
                    console.log('SETTINGS_iENABLE_PUSH           | %d | %d',
                            h2client.connection.getLocalSetting(2),
                            h2client.connection.getRemoteSetting(2));
                    console.log('SETTINGS_MAX_CONCURRENT_STREAMS | %d | %d',
                            h2client.connection.getLocalSetting(3),
                            h2client.connection.getRemoteSetting(3));
                    console.log('SETTINGS_INITIAL_WINDOW_SIZE    | %d | %d',
                            h2client.connection.getLocalSetting(4),
                            h2client.connection.getRemoteSetting(4));
                } else {
                    console.log('no connection');
                }
                callback();
                break;
            case 'config':
                if (args[2]) {
                    console.log(args[2] + ': ' + h2client.config[args[2]]);
                } else {
                    console.log(h2client.config);
                }
                callback();
                break;
            case 'streams':
                if (h2client.connection) {
                    h2client.connection.streams.forEach(function (s) {
                        var str = 'Stream #' + s.id;
                        str += ', State: ' + s.state;
                        str += ', Bytes Sent: ' + s.stat.sent;
                        str += ', Bytes Received: ' + s.stat.received;
                        console.log(str);
                    });
                } else {
                    console.log('no connection');
                }
                callback();
                break;
            default:
                console.error();
                callback();
        }
    },
    'getCompletions': createCompleter({
        'settings': {
            '<ENTER>': {},
            'HEADER_TABLE_SIZE': {},
            'ENABLE_PUSH': {},
            'MAX_CONCURRENT_STREAMS': {},
            'INITIAL_WINDOW_SIZE': {},
        },
        'config': {
            '<ENTER>': {},
            '<name>': {}
        },
        'streams': {},
    }),
    'help': {
        'summary': 'Show current statuses',
        'description': ''
    }
};

commands.table.get = {
    'exec': function (args, callback) {
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
    },
    'getCompletions': createCompleter({
        '<url>': {}
    }),
    'help': {
        'summary': 'Send a HEAD request',
        'description': ''
    }
};

commands.table.head = {
    'exec': function (args, callback) {
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
    },
    'getCompletions': createCompleter({
        '<url>': {}
    }),
    'help': {
        'summary': 'Send a GET request',
        'description': ''
    }
};

commands.table.post = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: post URL data');
            callback();
            return;
        }
        var response = {};
        h2client.request(args[1], 'POST', args[2], {
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
    },
    'getCompletions': createCompleter({
        '<url>': {
            '<data>': {}
        }
    }),
    'help': {
        'summary': 'Send a POST request',
        'description': ''
    }
};

commands.table.close = {
    'exec': function (args, callback) {
        h2client.close(callback);
    },
    'getCompletions': function (line) {
        return [[], line];
    },
    'help': {
        'summary': 'Close current connection',
        'description': ''
    }
};

commands.table.help = {
    'exec': function (args, callback) {
        var cmd;
        for (cmd in commands.table) {
            console.log("%s\t\t", cmd, commands.table[cmd].help.summary);
        }
        callback();
    },
    'getCompletions': function (line) { return [[], line] },
    'help': {
        'summary': 'This command',
        'description': ''
    }
     
};

commands.getCompletions = function (line) {
    var args = line.split(' ', 2);
    if (args.length === 1) {
        var hits = Object.keys(commands.table).filter(function(c) { return c.indexOf(args[0]) == 0 });
        if (hits.length === 0) {
            return [Object.keys(commands.table), line];
        } else if (hits.length > 1) {
            return [hits, line];
        } else {
            return [[hits[0] + ' '], line];
        }
        return [, line];
    } else {
        if (commands.table[args[0]]) {
            return commands.table[args[0]].getCompletions(line);
        } else {
            return [[], line];
        }
    }
};

module.exports = commands;
