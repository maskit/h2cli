#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var h2 = require('./lib/h2');
var cmd = require('./lib/command');

var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// Load configurations
var config, configData, pref;
try {
    configData = fs.readFileSync(homeDir + '/.h2cli/config', 'utf-8');
} catch (e) {
    console.log(e);
}
config = JSON.parse(configData);

var h2client = h2.createClient(config); 

// Load commands
cmd.loadCommands(h2client, __dirname + '/lib/cmd');
if (fs.existsSync(homeDir + '/.h2cli/cmd')) {
    cmd.loadCommands(h2client, homeDir + '/.h2cli/cmd');
}

// Load extensions
require('./lib/ext/altsvc');
require('./lib/ext/blocked');


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

