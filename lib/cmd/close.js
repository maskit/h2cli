module.exports = {
    'exec': function (args, callback) {
        if (this.client) {
            this.client.close(function () {
                console.log('Connection closed.');
                if (callback) {
                    callback();
                }
            });
        } else {
            if (callback) {
                callback();
            }
        }
    },
    'arguments': {},
    'help': {
        'summary': 'Close current connection',
        'description': ''
    }
};
