var cmd = require('../command.js');
module.exports = {
    'exec': function (args, callback) {
        var c;
        for (c in cmd.table) {
            console.log("%s\t\t", c, cmd.table[c].help.summary);
        }
        callback();
    },
    'getCompletions': function (line) { return [[], line] },
    'help': {
        'summary': 'This command',
        'description': ''
    }
};
