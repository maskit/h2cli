module.exports = {
    'exec': function (args, callback) {
        if (this.client) {
            this.client.close(callback);
        } else {
            callback();
        }
    },
    'arguments': {},
    'help': {
        'summary': 'Close current connection',
        'description': ''
    }
};
