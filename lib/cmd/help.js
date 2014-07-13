var cmd = require('../command.js');
module.exports = {
    'exec': function (args, callback) {
        var c;
        cmd.getCommandNames().forEach(function (name) {
            console.log("%s\t\t", name, cmd.getCommand(name).help.summary);
        });
        callback();
    },
    'getCompletions': function (line) { return [[], line] },
    'help': {
        'summary': 'This command',
        'description': ''
    }
};
