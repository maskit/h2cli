module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: get URL');
            console.log('');
            console.log('You can specify authority by using format below.');
            console.log('get //<authority>/path/to/resource');
            if (callback) {
                callback();
            }
            return;
        }
        var response = {
            header: null,
            body: null
        };
        var callbacks = {
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
                if (response.header !== null) {
                    console.log(' Header');
                    response.header.forEach(function (h) {
                        console.log('  ' + h[0] + ': ' + h[1]);
                    });
                    console.log(' Body');
                    if (response.body !== null) {
                        console.log('  ' + response.body.toString());
                    }
                } else {
                    console.log(' Couldn\'t get a response.');
                }
                if (callback) {
                    callback();
                }
            },
            'error': function () {
                if (callback) {
                    callback();
                }
            }
        };
        var self = this;
        var parsedUrl = require('url').parse(args[1], true, true);
        var request = function () {
            if (parsedUrl.host) {
                self.client.request(parsedUrl.host, parsedUrl.path, 'GET', callbacks);
            } else {
                self.client.request(parsedUrl.path, 'GET', callbacks);
            }
        };
        if (!this.client.connection) {
            var secure = parsedUrl.scheme === 'https';
            var port = parsedUrl.port ? parsedUrl.port : (secure ? 443 : 80);
            this.client.connect(parsedUrl.hostname, port, {
                secure: secure,
                useNpn: true
            }, function (stream, error) {
                if (!error) {
                    request();
                }
            });
        } else {
            request();
        }
    },
    'arguments': {
        '<url>': {}
    },
    'help': {
        'summary': 'Send a HEAD request',
        'description': ''
    }
};
