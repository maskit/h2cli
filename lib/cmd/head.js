module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: head URL');
            console.log('');
            console.log('You can specify authority by using format below.');
            console.log('head //<authority>/path/to/resource');
            callback();
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
                callback();
            },
            'error': function () {
                callback();
            }
        };
        var parsedUrl = require('url').parse(args[1], true, true);
        if (parsedUrl.host) {
            this.client.request(parsedUrl.host, parsedUrl.path, 'HEAD', callbacks);
        } else {
            this.client.request(parsedUrl.path, 'HEAD', callbacks);
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
