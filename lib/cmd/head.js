module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: head URL');
            console.log('');
            console.log('You can specify authority by using format below.');
            console.log('head //<authority>/path/to/resource');
            if (callback) {
                callback();
            }
            return;
        }
        var response;
        var callbacks = {
            'header': function (headers) {
                response = headers;
            },
            'data': function (data) {
            },
            'close': function () {
                if (response) {
                    console.log(response);
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
                self.client.request(parsedUrl.host, parsedUrl.path, 'HEAD', callbacks);
            } else {
                self.client.request(parsedUrl.path, 'HEAD', callbacks);
            }
        };
        if (!this.client.connection) {
            var secure = parsedUrl.protocol === 'https:';
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
        'summary': 'Send a GET request',
        'description': ''
    }
};
