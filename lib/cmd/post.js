module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: post URL data');
            console.log('');
            console.log('You can specify authority by using format below.');
            console.log('post //<authority>/path/to/resource data');
            callback();
            return;
        }
        var response = {};
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
                console.log(' Header');
                response.header.forEach(function (h) {
                    console.log('  ' + h[0] + ': ' + h[1]);
                });
                console.log(' Body');
                console.log('  ' + response.body.toString());
                callback();
            },
            'error': function () {
                callback();
            }
        };
        var parsedUrl = require('url').parse(args[1], true, true);
        if (typeof args[2] === 'undefined') {
            data = '';
        } else {
            data = args[2];
        }
        if (parsedUrl.host) {
            this.client.request(parsedUrl.host, parsedUrl.path, 'POST', data, callbacks);
        } else {
            this.client.request(parsedUrl.path, 'POST', data, callbacks);
        }
    },
    'arguments': {
        '<url>': {
            '<data>': {}
        }
    },
    'help': {
        'summary': 'Send a POST request',
        'description': ''
    }
};
