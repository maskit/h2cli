module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            console.log('usage: head URL');
            callback();
            return;
        }
        var response;
        this.client.request(args[1], 'HEAD', {
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
    'arguments': {
        '<url>': {}
    },
    'help': {
        'summary': 'Send a GET request',
        'description': ''
    }
};
