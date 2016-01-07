#!/usr/bin/env node

var fs = require('fs');
var url = require('url');
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

var rl = require('readline').createInterface(process.stdin, process.stdout, completer);
if (process.argv.length === 2) {
    var completer = function (line) {
        return cmd.getCompletions(line);
    };

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
    var parsedUrl = url.parse(args[0]);
    var execute = function () {
        var c = cmd.getCommand(args[0]);
        if (c) {
            c.exec(args, function () {
                rl.on('line', function () {
                    rl.close();
                    cmd.getCommand('close').exec();
                });
                rl.prompt();
            });
        }
    };
    if (parsedUrl.protocol && parsedUrl.protocol.substr(0, 4) === 'http') {
        args.shift();
        var secure = parsedUrl.protocol === 'https:';
        var port = parsedUrl.port ? parsedUrl.port : (secure ? 443 : 80);
        h2client.connect(parsedUrl.hostname, port, {
            secure: secure,
            useNpn: true
        }, function (stream, error) {
            if (!error) {
                execute();
            }
        });
    } else {
        execute();
    }
}
