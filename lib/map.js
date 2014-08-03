module.exports.frameType2Name = [
    'DATA',
    'HEADERS',
    'PRIORITY',
    'RST_STREAM',
    'SETTINGS',
    'PUSH_PROMISE',
    'PING',
    'GOAWAY',
    'WINDOW_UPDATE',
    'CONTINUATION',
];

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
