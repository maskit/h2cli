var fs = require('fs');
var path = require('path');
var h2client = require('./h2').createClient(); 

var cmdTable = {};

module.exports.createCompleter = function (hints) {
    return function (line) {
        var args = line.split(' ');
        var i, candidates, hits;
        candidates = hints;
        for (i = 1; i < args.length - 1; i++) {
            if (candidates[args[i]]) {
                candidates = candidates[args[i]];
            } else if (candidates['*']) {
                candidates = candidates['*'];
            } else {
                break;
            }
        }

        hits = Object.keys(candidates).filter(function(c) { return c.indexOf(args[i]) === 0 && args[i][0] !== '<'  && args[i][0] !== '*'});
        if (hits.length === 0) {
            return [Object.keys(candidates).filter(function(c) { return c !== '*'; }).concat(['']), line];
        } else if (hits.length === 1) {
            if (hits[0][0] === '<') {
                return [[hits[0], ''], line];
            } else {
                return [[args.slice(0, i).join(' ') + ' ' + hits[0] + ' '], line];
            }
        } else if (hits.length > 1) {
            return [hits.filter(function(c) { return c !== '*'; }).concat(['']), line];
        }

    };
};

module.exports.loadCommands = function (cmdDirPath) {
    var files = fs.readdirSync(cmdDirPath);
    console.log(files);
    files.forEach(function (filename) {
        var name = path.basename(filename, '.js');
        cmdTable[name] = require(cmdDirPath + path.sep + name);
        cmdTable[name].client = h2client;
    });
};

module.exports.getCommand = function (name) {
    return cmdTable[name];
};

module.exports.getCommandNames = function () {
    return Object.keys(cmdTable);
};

module.exports.getCompletions = function (line) {
    var args = line.split(' ', 2);
    if (args.length === 1) {
        var hits = Object.keys(cmdTable).filter(function(c) { return c.indexOf(args[0]) == 0 });
        if (hits.length === 0) {
            return [Object.keys(cmdTable), line];
        } else if (hits.length > 1) {
            return [hits, line];
        } else {
            return [[hits[0] + ' '], line];
        }
        return [, line];
    } else {
        if (cmdTable[args[0]]) {
            return cmdTable[args[0]].getCompletions(line);
        } else {
            return [[], line];
        }
    }
};

// Load commands
module.exports.loadCommands(path.dirname(module.filename) + '/cmd');

