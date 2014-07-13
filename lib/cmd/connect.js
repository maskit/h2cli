module.exports = {
    'exec': function (args, callback) {
        if (!args[1]) {
            args[1] = 'http://localhost:8080/';
            //args[1] = 'https://nghttp2.org/';
            //args[1] = 'http://nghttp2.org/';
        }
        var url = require('url').parse(args[1]);
        var hostname, port, secure;
        if (url.protocol === 'http:') {
            secure = false;
        } else if (url.protocol === 'https:') {
            secure = true;
        } else {
            console.error('Unknown scheme `' + url.protocol + '`');
            callback();
            return 1;
        }
        if (url.hostname) {
            hostname = url.hostname;
        } else {
            console.error('Hostname is empty');
            callback();
            return 1;
        }
        if (url.port) {
            port = url.port;
        } else if (secure) {
            port = 443;
        } else {
            port = 80;
        }
        console.log('Connecting to ' + hostname + ':' + port);
        this.client.connect(hostname, port, {
            'secure': secure,
            'useNpn': true,
            'useUpgrade': false,
        }, function(stream, error) {
            if (stream && stream.authorizationError) {
                console.log(stream.authorizationError);
            }
            if (stream && stream.npnProtocol) {
                console.log('NPN Protocol: ' + stream.npnProtocol);
            }
            callback();
        });
    },
    'arguments': {
        '<url>': {}
    },
    'help': {
        'summary': 'Connect to server',
        'description': ''
    }
};
