module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: post URL data');
            callback();
            return;
        }
        var response = {};
        this.client.request(args[1], 'POST', args[2], {
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
