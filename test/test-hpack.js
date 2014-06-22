var assert = require("assert")
var fs = require('fs');
var HPACK = require('../lib/hpack').HPACK;

function isSame(mine, reference) {
    var i, n = mine.length, name;

    if (mine.length !== reference.length) {
        return false;
    }
    for (i = 0; i < n; i++) {
        name = mine[i][0];
        if (mine[i][1] !== reference[name]) {
            return false;
        }
    }
    return true;
};


describe('HAPCK', function () {
    var nStory = 31;
    var reference = 'nghttp2';
    var testcaseDir = 'test/hpack-test-case/';

    describe('#decode()', function () {
        var i, j, impl, story, decoded, nCase;

        beforeEach(function () {
            impl = new HPACK();
        });

        for (i = 1; i <= nStory; i++) {
            (function () {
                var storyNumber = i;
                it('should decode wire data as same as reference implementation on the story ' + storyNumber, function () {
                    story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(storyNumber / 10) ? '' : '0') + '' + storyNumber + '.json'));
                    nCase = story.cases.length;
                    for (j = 0; j < nCase; j++) {
                        decoded = impl.decode(new Buffer(story.cases[j].wire, 'hex'));
                        assert(isSame(story.cases[j].headers, decoded), 'Story ' + storyNumber + ' seq ' + j);
                    }
                });
            })();
        }
    });

    describe('#encode()', function () {
        it('should encode raw-data, and the encoded data shoud be decodable.');
    });
});
