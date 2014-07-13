var cmd = require('../command');
module.exports = {
    'exec': function (args, callback) {
        this.client.close(callback);
    },
    'getCompletions': function (line) {
        return [[], line];
    },
    'help': {
        'summary': 'Close current connection',
        'description': ''
    }
};
