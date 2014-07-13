#!/usr/local/bin/node

// load extensions
require('./lib/ext/altsvc');
require('./lib/ext/blocked');

var cmd = require('./lib/command');

var completer = function (line) {
    return cmd.getCompletions(line);
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
    var callback = function() { rl.prompt(); };
    var args = line.trim().split(' ');
    var c = cmd.getCommand(args[0]);
    if (c) {
        c.exec(args, callback);
    } else {
        callback();
    }
}).on('close', function() {
    process.exit(0);
});

