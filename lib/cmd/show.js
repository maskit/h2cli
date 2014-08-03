module.exports = {
    'exec': function (args, callback) {
        switch (args[1]) {
            case 'settings':
                if (this.client.connection) {
                    console.log('NAME                            | Local | Remote');
                    console.log('SETTINGS_HEADER_TABLE_SIZE      | %d | %d',
                            this.client.connection.getLocalSetting(1),
                            this.client.connection.getRemoteSetting(1));
                    console.log('SETTINGS_iENABLE_PUSH           | %d | %d',
                            this.client.connection.getLocalSetting(2),
                            this.client.connection.getRemoteSetting(2));
                    console.log('SETTINGS_MAX_CONCURRENT_STREAMS | %d | %d',
                            this.client.connection.getLocalSetting(3),
                            this.client.connection.getRemoteSetting(3));
                    console.log('SETTINGS_INITIAL_WINDOW_SIZE    | %d | %d',
                            this.client.connection.getLocalSetting(4),
                            this.client.connection.getRemoteSetting(4));
                    console.log('SETTINGS_MAX_FRAME_SIZE         | %d | %d',
                            this.client.connection.getLocalSetting(5),
                            this.client.connection.getRemoteSetting(5));
                    console.log('SETTINGS_MAX_HEADER_LIST_SIZE   | %d | %d',
                            this.client.connection.getLocalSetting(6),
                            this.client.connection.getRemoteSetting(6));
                } else {
                    console.log('no connection');
                }
                callback();
                break;
            case 'config':
                if (args[2]) {
                    console.log(args[2] + ': ' + this.client.config[args[2]]);
                } else {
                    console.log(this.client.config);
                }
                callback();
                break;
            case 'streams':
                if (this.client.connection) {
                    this.client.connection.streams.forEach(function (s) {
                        var str = 'Stream #' + s.id;
                        str += ', State: ' + s.state;
                        str += ', Bytes Sent: ' + s.stat.sent;
                        str += ', Bytes Received: ' + s.stat.received;
                        console.log(str);
                    });
                } else {
                    console.log('no connection');
                }
                callback();
                break;
            default:
                console.error();
                callback();
        }
    },
    'arguments': {
        'settings': {
            '<ENTER>': {},
            'HEADER_TABLE_SIZE': {},
            'ENABLE_PUSH': {},
            'MAX_CONCURRENT_STREAMS': {},
            'INITIAL_WINDOW_SIZE': {},
        },
        'config': {
            '<ENTER>': {},
            '<name>': {}
        },
        'streams': {},
    },
    'help': {
        'summary': 'Show current statuses',
        'description': ''
    }
};
