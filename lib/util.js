var fs = require('fs');
var h2frame  = require('./frame');
var h2map = require('./map');

module.exports.saveFrame = function (frame, filename) {
    fs.writeFileSync(filename, frame.getBuffer());
};
module.exports.loadFrame = function (filename) {
    return h2frame.Http2FrameFactory.createFrame(fs.readFileSync(filename));
};

module.exports.printFrame = function (frame, verbose) {
    var str = frame.toString();

    if (verbose) {
        var flags = [];
        if (h2map.flag2Name[frame.type]) {
            Object.keys(h2map.flag2Name[frame.type]).forEach(function (flag) {
                if (frame.flags & flag) {
                    flags.push(h2map.flag2Name[frame.type][flag]);
                }
            });
        }
        if (flags.length) {
            str += "\n";
            str += ' Flags: ' + flags.join(' | ');
        }
        if (flags.indexOf('PADDED') !== -1) {
            str += "\n";
            str += ' Padding: ' + frame.padLengh;
        }
        switch(frame.type) {
            case h2frame.Http2DataFrame.TYPE_CODE:
                break;
            case h2frame.Http2HeadersFrame.TYPE_CODE:
                break;
            case h2frame.Http2PriorityFrame.TYPE_CODE:
                str += "\n";
                str += ' Stream Dependency: ' + frame.streamDependency;
                str += "\n";
                str += ' Weight: ' + frame.weight;
                break;
            case h2frame.Http2RstStreamFrame.TYPE_CODE:
                str += "\n";
                str += ' Error Code: ' + h2map.errorCode2Name[frame.errorCode];
                break;
            case h2frame.Http2SettingsFrame.TYPE_CODE:
                var params = [], param, paramStr;
                if (frame.getParamCount()) {
                    str += "\n";
                    str += ' Params:\n';
                    for (var i = 0; i < frame.getParamCount(); i++) {
                        param = frame.getParamByIndex(i);
                        paramStr = h2map.settingsId2Name[param.id];
                        if (paramStr) {
                            params.push('  ' + paramStr + ': ' + param.value);
                        } else {
                            params.push('  ' + param.id + ': ' + param.value);
                        }
                    }
                    str += params.join('\n');
                }
                break;
            case h2frame.Http2PushPromiseFrame.TYPE_CODE:
                str += "\n";
                str += ' Promised Stream ID: ' + frame.promisedStreamId;
                break;
            case h2frame.Http2PingFrame.TYPE_CODE:
                str += "\n";
                str += 'Payload: '+ frame.payload.toString('hex');
                break;
            case h2frame.Http2GoawayFrame.TYPE_CODE:
                str += "\n";
                str += ' Last-Stream-ID: ' + frame.lastStreamId;
                str += "\n";
                str += ' Error Code: ' + h2map.errorCode2Name[frame.errorCode];
                if (frame.length > 8) {
                    str += "\n";
                    str += ' Additional Debug Data: ';
                    str += frame.additionalDebugData.toString();
                }
                break;
            case h2frame.Http2WindowUpdateFrame.TYPE_CODE:
                str += "\n";
                str += ' Window Size Increment: ' + frame.windowSizeIncrement;
                break;
            case h2frame.Http2ContinuationFrame.TYPE_CODE:
                break;
            default:
                break;
        }
    }

    return str;

};
