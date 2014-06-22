var huffman = require('./huffman');
var HPACK = function () {
    this.localHtable = [[void(0), void(0)]];
    this.remoteHtable = [[void(0), void(0)]];
    this.remoteRefSet = {};
};

HPACK.prototype.encode = function (input) {
    var i, j;
    var output = [];
    var bufPos = 0;
    var name, value;

    for (i = 0; i < input.length; i++) {
        name = input[i][0];
        value = input[i][1];
        if (!this.remoteRefSet[name] || this.remoteRefSet[name] !== value) {
            output.push(encodeField.call(this, name, value));
            this.remoteRefSet[name] = value;
        }
    }
    // console.log('-- HPACK encode --');
    // console.log(input);
    // console.log('------------------');
    // console.log(output);
    // console.log('------------------');
    return Buffer.concat(output);
};

HPACK.prototype.decode = function (input) {
    var output = [];
    var index, result, field;
    var pos = 0;
    while (pos < input.length) {
        if (input[pos] & 0x80) {
            // console.log('HPACK-DEBUG: Indexed Header Field Representation');
            result = decodeInteger(input.slice(pos), 7);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index < this.localHtable.length) {
                field = this.localHtable[index];
            } else {
                field = staticTable[index - (this.localHtable.length - 1)];
            }
            output.push([field[0], field[1]]);
            this.localHtable.splice(1, 0, [field[0], field[1]])
        } else if (input[pos] & 0x40) {
            // console.log('HPACK-DEBUG: Literal Header Field with Incremental Indexing');
            result = decodeInteger(input.slice(pos), 6);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index === 0) {
                result = decodeString(input.slice(pos));
                pos += result.len;
                field = result.value;
            } else {
                if (index < this.localHtable.length) {
                    field = this.localHtable[index][0];
                } else {
                    field = staticTable[index - (this.localHtable.length - 1)][0];
                }
            }
            result = decodeString(input.slice(pos));
            pos += result.len;
            output.push([field, result.value]);
            this.localHtable.splice(1, 0, [field, result.value])
        } else if (input[pos] & 0x20) {
            // console.log('HPACK-DEBUG: Encoding Context Update is not implemented yet.');
            pos += 10;
        } else if (input[pos] & 0x10) {
            // console.log('HPACK-DEBUG: Literal Header Field Never Indexed is not implemented yet.');
            pos += 10;
        } else {
            // console.log('HPACK-DEBUG: Literal Header Field without Indexing');
            result = decodeInteger(input.slice(pos), 4);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index === 0) {
                result = decodeString(input.slice(pos));
                pos += result.len;
                field = result.value;
            } else {
                if (index < this.localHtable.length) {
                    field = this.localHtable[index][0];
                } else {
                    field = staticTable[index - (this.localHtable.length - 1)][0];
                }
            }
            result = decodeString(input.slice(pos));
            pos += result.len;
            output.push([field, result.value]);
        }
    }
    // console.log('-- HPACK decode --');
    // console.log(input);
    // console.log('------------------');
    // console.log(output);
    // console.log('------------------');
    return output;
};

var encodeInteger = function (input, n) {
    var output = [];
    var x = Math.pow(2, n) - 1;
    if (input < x) {
        output.push(input);
    } else {
        output.push(x);
        input = input - x;
        while (input >= 128) {
            output.push(input % 128 + 128);
            input = parseInt(input / 128);
        }
        output.push(input);
    }
    return new Buffer(output);
};

var decodeInteger = function (input, n) {
    var i, j = 0, m = 0;
    i = input[0] & Math.pow(2, n) - 1;
    if (i == Math.pow(2, n) - 1) {
        do {
            j++;
            i += (input[j] & 0x7F) * Math.pow(2, m);
            m += 7;
        } while (input[j] & 0x80);
    }
    return {
        'value': i,
        'len': j + 1
    };
};

var encodeString = function (input, huffman) {
    // never use huffman
    var length = encodeInteger(input.length, 7);
    var data = new Buffer(input, 'ascii');
    return Buffer.concat([length, data], length.length + data.length);
};

var decodeString = function (input) {
    var result = decodeInteger(input, 7);
    var str;
    if (input[0] & 0x80) {
        str = huffman.decode(input.slice(result.len, result.value + 1));
    } else {
        str = input.toString('ascii', result.len, result.value + 1);
    }
    return {
        'value': str,
        'len': result.len + result.value
    };
};

var encodeField = function (name, value) {
    var i, j;
    for (i = 0; i < staticTable.length; i++) {
        if (staticTable[i][0] === name) {
            break;
        }
    }
    if (i !== staticTable.length) {
        for (j = i; j < staticTable.length; j++) {
            if (staticTable[j][0] !== name) {
                j = -1;
                break;
            }
            if (staticTable[j][1] === value) {
                break;
            }
        }
        if (j !== -1 && j !== staticTable.length) {
            output = encodeInteger(this.remoteHtable.length - 1 + j, 7);
            output[0] |= 0x80;
            this.remoteHtable.splice(1, 0, [name, value]);
        } else {
            output = Buffer.concat([
                        encodeInteger(this.remoteHtable.length - 1 + i, 6),
                        encodeString(value)]);
            output[0] |= 0x40;
            this.remoteHtable.splice(1, 0, [name, value]);
        }
    } else {
            output = Buffer.concat([
                        encodeInteger(0, 6),
                        encodeString(name),
                        encodeString(value)]);
            output[0] |= 0x40;
    }
    return output;
};

var staticTable = HPACK.prototype.staticTable = [
    [void(0), void(0)],
    [':authority', void(0)],
    [':method',    'GET'],
    [':method',    'POST'],
    [':path',      '/'],
    [':path',      '/index.html'],
    [':scheme',    'http'],
    [':scheme',    'https'],
    [':status',    '200'],
    [':status',    '204'],
    [':status',    '206'],
    [':status',    '304'],
    [':status',    '400'],
    [':status',    '404'],
    [':status',    '500'],
    ['accept-charset', void(0)],
    ['accept-encoding', 'gzip, deflate'],
    ['accept-language', void(0)],
    ['accept-ranges', void(0)],
    ['accept', void(0)],
    ['access-control-allow-origin', void(0)],
    ['age', void(0)],
    ['allow', void(0)],
    ['authorization', void(0)],
    ['cache-control', void(0)],
    ['content-disposition', void(0)],
    ['content-encoding', void(0)],
    ['content-language', void(0)],
    ['content-length', void(0)],
    ['content-location', void(0)],
    ['content-range', void(0)],
    ['content-type', void(0)],
    ['cookie', void(0)],
    ['date', void(0)],
    ['etag', void(0)],
    ['expect', void(0)],
    ['expires', void(0)],
    ['from', void(0)],
    ['host', void(0)],
    ['if-match', void(0)],
    ['if-modified-since', void(0)],
    ['if-none-match', void(0)],
    ['if-range', void(0)],
    ['if-unmodified-since', void(0)],
    ['last-modified', void(0)],
    ['link', void(0)],
    ['location', void(0)],
    ['max-forwards', void(0)],
    ['proxy-authenticate', void(0)],
    ['proxy-authorization', void(0)],
    ['range', void(0)],
    ['referer', void(0)],
    ['refresh', void(0)],
    ['retry-after', void(0)],
    ['server', void(0)],
    ['set-cookie', void(0)],
    ['strict-transport-security', void(0)],
    ['transfer-encoding', void(0)],
    ['user-agent', void(0)],
    ['vary', void(0)],
    ['via ', void(0)],
    ['www-authenticate', void(0)],
];

module.exports = {
    'HPACK': HPACK,
};
