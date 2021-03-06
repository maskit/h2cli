module.exports.settingsId2Name = [
    '', // index 0 is not used
    'SETTINGS_HEADER_TABLE_SIZE',
    'SETTINGS_ENABLE_PUSH',
    'SETTINGS_MAX_CONCURRENT_STREAMS',
    'SETTINGS_INITIAL_WINDOW_SIZE',
    'SETTINGS_MAX_FRAME_SIZE',
    'SETTINGS_MAX_HEADER_LIST_SIZE',
];

module.exports.errorCode2Name = [
    'NO_ERROR',
    'PROTOCOL_ERROR',
    'INTERNAL_ERROR',
    'FLOW_CONTROL_ERROR',
    'SETTINGS_TIMEOUT',
    'STREAM_CLOSED',
    'FRAME_SIZE_ERROR',
    'REFUSED_STREAM',
    'CANCEL',
    'COMPRESSION_ERROR',
    'CONNECT_ERROR',
    'ENHANCE_YOUR_CALM',
    'INADEQUATE_SECURITY',
];

module.exports.flag2Name = {
    0: { // DATA
        0x01: 'END_STREAM',
        0x08: 'PADDED'
    },
    1: { // HEADERS
        0x01: 'END_STREAM',
        0x04: 'END_HEADERS',
        0x08: 'PADDED',
        0x20: 'PRIORITY'
    },
    4: { // SETTINGS
        0x01: 'ACK'
    },
    5: { // PUSH_PROMISE
        0x04: 'END_HEADERS',
        0x08: 'PADDED'
    },
    6: { // PING
        0x01: 'ACK'
    },
    9: {
        0x04: 'END_HEADERS'
    }
};
