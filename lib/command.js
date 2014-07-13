var h2client = require('./h2').createClient(); 

module.exports = commands = {};
commands.table = {};

commands.createCompleter = function (hints) {
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


// Load commands
[
    'connect',
    'send',
    'set',
    'show',
    'get',
    'head',
    'post',
    'close',
    'help',
].forEach(function (name) {
    commands.table[name] = require('./cmd/' + name);
    commands.table[name].client = h2client;
});

commands.getCompletions = function (line) {
    var args = line.split(' ', 2);
    if (args.length === 1) {
        var hits = Object.keys(commands.table).filter(function(c) { return c.indexOf(args[0]) == 0 });
        if (hits.length === 0) {
            return [Object.keys(commands.table), line];
        } else if (hits.length > 1) {
            return [hits, line];
        } else {
            return [[hits[0] + ' '], line];
        }
        return [, line];
    } else {
        if (commands.table[args[0]]) {
            return commands.table[args[0]].getCompletions(line);
        } else {
            return [[], line];
        }
    }
};

