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
    config = JSON.parse(configData);
} catch (e) {
    config = {};
}

var h2client = h2.createClient(config); 

// Load commands
cmd.loadCommands(h2client, __dirname + '/lib/cmd');
if (fs.existsSync(homeDir + '/.h2cli/cmd')) {
    cmd.loadCommands(h2client, homeDir + '/.h2cli/cmd');
}

// Load extensions
require('./lib/ext/altsvc');
require('./lib/ext/blocked');

if (process.argv.length === 2) {
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
    var callback = function() { rl.prompt(); };
    rl.prompt();
    rl.on('line', function(line) {
        rl.pause();
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
} else {
    var args = process.argv;
    args.shift();
    args.shift();
    var c = cmd.getCommand(args[0]);
    if (c) {
        c.exec(args, function () {
            cmd.getCommand('close').exec();
        });
    }
}
