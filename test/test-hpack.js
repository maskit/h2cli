var fs = require('fs');
var HPACK = require('../lib/hpack').HPACK;

var testcaseDir = 'hpack-test-case/';
var story;

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

function testEncode() {
};

function testDecode(reference) {
    var lastStoryNumber = 31;
    var i, j, impl, decoded, nCase;

    for (i = 1; i <= lastStoryNumber; i++) {
        impl = new HPACK();
        console.log('story #' + i);
        story = JSON.parse(fs.readFileSync(testcaseDir + reference + '/story_' + (parseInt(i / 10) ? '' : '0') + '' + i + '.json'));
        nCase = story.cases.length;
        for (j = 0; j < nCase; j++) {
            decoded = impl.decode(new Buffer(story.cases[j].wire, 'hex'));
            if (isSame(story.cases[j].headers, decoded)) {
                console.log('Story #' + i + ' seq #' + j + ': OK');
            } else{
                console.log('Story #' + i + ' seq #' + j + ': NG');
                console.log('expected');
                console.log(story.cases[j].headers);
                console.log('actual');
                console.log(decoded);
            };

        }
    }
};

testDecode('nghttp2');
