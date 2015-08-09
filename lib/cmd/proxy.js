module.exports = {
    'exec': function (args, callback) {
        if (!args[2]) {
            console.log('usage: proxy SERVER:PORT');
            callback();
            return;
        }
        var callbacks = {
            'data': function (data) {
            },
            'close': function () {
            },
            'error': function () {
            }
        };
        this.client.proxy(args[1], callbacks);
    },
    'arguments': {
        '<server:port>': {}
    },
    'help': {
        'summary': 'Send a CONNECT request',
        'description': ''
    }
};

