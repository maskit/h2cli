var assert = require("assert")
var fs = require('fs');
var HPACK = require('../lib/hpack').HPACK;

function convertForTest(headers) {
    var i, n, entry, converted = {};
    for (i = 0; i < headers.length; i++) {
        if (headers[i] instanceof Array) {
            converted[headers[i][0]] = headers[i][1];
        } else {
            converted[Object.keys(headers[i])[0]] = headers[i][Object.keys(headers[i])[0]];
        }
    }
    return converted;
};


describe('HPACK', function () {
    var nStory = 31;
    var reference = 'nghttp2';
    var testcaseDir = 'test/hpack-test-case/';

    describe('#decode()', function () {
        var i, j, impl, story, decoded, nCase;

        beforeEach(function () {
            impl = new HPACK();
        });

        for (i = 0; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                it('should decode wire data as same as reference implementation on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        decoded = impl.decode(new Buffer(story.cases[j].wire, 'hex'));
                        assert.deepEqual(convertForTest(decoded), convertForTest(story.cases[j].headers), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }
    });

    describe('#encode()', function () {
        it('should encode raw-data, and the encoded data shoud be decodable.');
    });
});
