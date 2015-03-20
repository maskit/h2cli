module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: get URL');
            console.log('');
            console.log('You can specify authority by using format below.');
            console.log('get //<authority>/path/to/resource');
            callback();
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
                console.log(' Header');
                response.header.forEach(function (h) {
                    console.log('  ' + h[0] + ': ' + h[1]);
                });
                console.log(' Body');
                console.log('  ' + response.body.toString());
                callback();
            },
        };
        var parsedUrl = require('url').parse(args[1], true, true);
        if (parsedUrl.host) {
            this.client.request(parsedUrl.host, parsedUrl.path, 'GET', callbacks);
        } else {
            this.client.request(parsedUrl.path, 'GET', callbacks);
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
