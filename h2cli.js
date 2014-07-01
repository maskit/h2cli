#!/usr/local/bin/node

// load extensions
require('./lib/ext/altsvc');
require('./lib/ext/blocked');

var commands = require('./lib/command');

var completer = function (line) {
    return commands.getCompletions(line);
};

var rl = require('readline').createInterface(process.stdin, process.stdout, completer);
rl.setPrompt('h2> ');
rl.setColor = function (colorAttr) {
    this.write("\033[" + colorAttr + "m");
};
rl.clearColor = function () {
    this.write("\033[m");
};
rl.prompt();
rl.on('line', function(line) {
    var args = line.trim().split(' ');
    var cmd = commands.table[args[0]]
    var callback = function() { rl.prompt(); };
    if (cmd) {
        cmd.exec(args, callback);
    } else if (typeof cmd === 'undefined') {
        callback();
    } else {
        console.error('Unknown command `' + args[0] + '`');
        callback();
    }
}).on('close', function() {
    process.exit(0);
});

