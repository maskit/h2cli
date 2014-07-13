module.exports = {
    'exec': function (args, callback) {
        this.client.close(callback);
    },
    'arguments': {},
    'help': {
        'summary': 'Close current connection',
        'description': ''
    }
};
