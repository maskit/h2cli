var cmd = require('../command.js');
module.exports = {
    'exec': function (args, callback) {
        var c;
        cmd.getCommandNames().forEach(function (name) {
            console.log("%s\t\t", name, cmd.getCommand(name).help.summary);
        });
        callback();
    },
    'arguments': {},
    'help': {
        'summary': 'This command',
        'description': ''
    }
};
