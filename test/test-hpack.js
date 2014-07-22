var assert = require("assert")
var fs = require('fs');
var HPACK = require('../lib/hpack').HPACK;

function convertForInput(headers) {
    var i, n, keys, converted = [];
    for (i = 0; i < headers.length; i++) {
        keys = Object.keys(headers[i]);
        converted.push([keys[0], headers[i][keys[0]]]);
    }
    return converted;
};

function isSame (actual, expected) {
    var i, j, n;
    if (actual.length !== expected.length) {
        return false;
    }
    n = expected.length;
    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            if (actual[i][0] === expected[j][0] && actual[i][1] === expected[j][1]) {
                break;
            }
        }
        if (j === n) {
            return false;
        }
    }
    // TODO: should check field order
    return true;
};

function convertForCompare(headers) {
    var i, n, keys, converted = {};
    for (i = 0; i < headers.length; i++) {
        if (headers[i] instanceof Array) {
            converted[headers[i][0]] = headers[i][1];
        } else {
            keys = Object.keys(headers[i]);
            converted[keys[0]] = headers[i][keys[0]];
        }
    }
    return converted;
};


describe('HPACK', function () {
    var nStory, testcaseDir = 'test/hpack-test-case/';

    describe('#decode()', function () {
        var i, j, impl, story, decoded, nCase;

        beforeEach(function () {
            impl = new HPACK();
        });

        nStory = 31;
        for (i = 0; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                var reference = 'nghttp2';
                it('should decode wire data as same as reference implementation on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        decoded = impl.decode(new Buffer(story.cases[j].wire, 'hex'));
                        assert(isSame(decoded, convertForInput(story.cases[j].headers)), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }

        nStory = 30;
        for (i = 0; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                var reference = 'nghttp2-change-table-size';
                it('should decode wire data including table size change as same as reference implementation, on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        decoded = impl.decode(new Buffer(story.cases[j].wire, 'hex'));
                        assert(isSame(decoded, convertForInput(story.cases[j].headers)), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }
    });

    describe('#encode()', function () {
        var i, j, impl, story, decoded, nCase, wire;

        beforeEach(function () {
            impl = new HPACK();
        });

        for (i = 0; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                it('should encode raw-data, and the encoded data shoud be decodable, on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + 'raw-data/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        wire = impl.encode(convertForInput(story.cases[j].headers));
                        decoded = impl.decode(wire);
                        assert(isSame(decoded, convertForInput(story.cases[j].headers)), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }
    });

    describe('#setTableSize()', function () {
        var i, j, impl, story, decoded, nCase, wire;
        var reference = 'nghttp2-change-table-size';

        beforeEach(function () {
            encoder = new HPACK();
            decoder = new HPACK();
        });

        for (i = 0; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                it('should change the header table size, and it should not affect the decoded data, on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        if (story.cases[j].header_table_size) {
                            encoder.setTableSize(story.cases[j].header_table_size);
                        }
                        wire = encoder.encode(convertForInput(story.cases[j].headers));
                        decoded = decoder.decode(wire);
                        assert(isSame(decoded, convertForInput(story.cases[j].headers)), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }
    });
});
