module.exports = {
    'exec': function (args, callback) {
        if (args.length != 4) {
            console.log('usage: set settings <name> <value>');
            console.log('       set config <name> <value>');
            callback();
            return;
        }
        switch (args[1]) {
            case 'settings':
                this.client.setSetting(args[2], args[3], callback);
                break;
            case 'config':
                this.client.setConfig(args[2], args[3], callback);
                break;
        }
        callback();
    },
    'arguments': {
        'settings': {
            'HEADER_TABLE_SIZE': { '<0-4294967295>': {} },
            'ENABLE_PUSH': { '<0-1>': {}},
            'MAX_CONCURRENT_STREAMS': { '<0-4294967295>': {} },
            'INITIAL_WINDOW_SIZE': { '<0-4294967295>': {}},
            'MAX_FRAME_SIZE': { '<0-16777215>': {}},
            'MAX_HEADER_LIST_SIZE': { '<0-4294967295>': {}},

        },
        'config': {
            '<name>': {},
            '*': {
                '<value>': {},
                '*': {}
            }
        }
    },
    'help': {
        'summary': 'Set settings or statuses',
        'description': ''
    }
};
