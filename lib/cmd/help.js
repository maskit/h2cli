var cmd = require('../command.js');
module.exports = {
    'exec': function (args, callback) {
        var cmd;
        for (cmd in commands.table) {
            console.log("%s\t\t", cmd, commands.table[cmd].help.summary);
        }
        callback();
    },
    'getCompletions': function (line) { return [[], line] },
    'help': {
        'summary': 'This command',
        'description': ''
    }
};
