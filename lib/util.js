var fs = require('fs');
var h2frame  = require('./frame');

module.exports.saveFrame = function (frame, filename) {
    fs.writeFileSync(filename, frame.getBuffer());
};
module.exports.loadFrame = function (filename) {
    return h2frame.Http2FrameFactory.createFrame(fs.readFileSync(filename));
}
