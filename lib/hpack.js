var huffman = require('./huffman');

var HeaderTable = function () {
    this.table = [[void(0), void(0), void(0)]];
    this._seq = 0;
};
HeaderTable.prototype.get = function (index) {
    return this.table[index];
};
HeaderTable.prototype.insert = function (name, value) {
    var ref = 'r' + ++this._seq;
    this.table.splice(1, 0, [name, value, ref]);
    return ref;
};
HeaderTable.prototype.refer = function (ref) {
    var i, n = this.table.length;
    for (i = 0; i < n; i++) {
        if (this.table[i][2] == ref) {
            return this.table[i];
        }
    }
};
HeaderTable.prototype.find = function (name, value) {
    var i, n = this.table.length;
    for (i = 0; i< n; i++) {
        if (this.table[i][0] === name && this.table[i][1] === value) {
            return i;
        }
    }
    return void(0);
};
Object.defineProperty(HeaderTable.prototype, 'length', {
    get: function () {
             return this.table.length;
         }
});

var HPACK = function () {
    this.lHeaderTable = new HeaderTable();
    this.rHeaderTable = new HeaderTable();
    this.refSet = {};
};

HPACK.prototype.encode = function (input) {
    var i, j;
    var output = [];
    var bufPos = 0;
    var name, value, block;

    // Clear Reference Set (to simplify encoding logic)
    output.push(new Buffer([0x30]));

    for (i = 0; i < input.length; i++) {
        name = input[i][0];
        value = input[i][1];
        block = encodeField.call(this, name, value);
        if (block) {
            output.push(block);
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
            if (index < this.lHeaderTable.length) {
                field = this.lHeaderTable.get(index);
                if (this.refSet[field[2]]) {
                    delete this.refSet[field[2]];
                } else {
                    // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                    output.push([field[0], field[1]]);
                    this.refSet[field[2]] = true;
                }
            } else {
                field = staticTable[index - (this.lHeaderTable.length - 1)];
                // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                ref = this.lHeaderTable.insert(field[0], field[1]);
                this.refSet[ref] = true;
                output.push([field[0], field[1]]);
            }
        } else if (input[pos] & 0x40 || (!(input[pos] & 0x20) && input[pos] & 0x10)) {
            var doIndex = input[pos] & 0x40;

            // console.log('HPACK-DEBUG: Literal Header Field');
            result = decodeInteger(input.slice(pos), 6);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index === 0) {
                result = decodeString(input.slice(pos));
                pos += result.len;
                field = result.value;
            } else {
                if (index < this.lHeaderTable.length) {
                    field = this.lHeaderTable.get(index)[0];
                } else {
                    field = staticTable[index - (this.lHeaderTable.length - 1)][0];
                }
            }
            result = decodeString(input.slice(pos));
            pos += result.len;
            // console.log('HPACK-DEBUG: Emit: ' + [field, result.value]);
            if (doIndex) {
                ref = this.lHeaderTable.insert(field, result.value);
                this.refSet[ref] = true;
            }
            output.push([field, result.value]);
        } else if (input[pos] & 0x20) {
            // console.log('HPACK-DEBUG: Encoding Context Update');
            if (input[pos] & 0x10) {
                // console.log('HPACK-DEBUG: Reference Set Emptying');
                Object.keys(this.refSet).forEach(function (elm) {
                    delete this.refSet[elm];
                }, this);
                pos += 1;
            } else {
                // console.log('HPACK-DEBUG: Maximum Header Table Size Change is not implemented yet');
                result = decodeInteger(input.slice(pos), 4);
                pos += result.len;
            }
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
                if (index < this.lHeaderTable.length) {
                    field = this.lHeaderTable.get(index)[0];
                } else {
                    field = staticTable[index - (this.lHeaderTable.length - 1)][0];
                }
            }
            result = decodeString(input.slice(pos));
            pos += result.len;
            // console.log('HPACK-DEBUG: Emit: ' + [field, result.value]);
            output.push([field, result.value]);
        }
    }
    var output2 = [];
    for (ref in this.refSet) {
        field = this.lHeaderTable.refer(ref);
        for (i = 0; i < output.length; i++) {
            if (output[i][0] === field[0]) {
                break;
            }
        }
        if (i === output.length) {
            // console.log('HPACK-DEBUG: Append ' + field[0] + ': ' + field[1] + ' from RefSet');
            output2.push([field[0], field[1]]);
        }
    }
    // console.log('-- HPACK decode --');
    // console.log(input);
    // console.log('------------------');
    // console.log(output);
    // console.log('------------------');
    return output2.concat(output);
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
    // Never use huffman (because it's not implemented yet)
    var length = encodeInteger(input.length, 7);
    var data = new Buffer(input, 'ascii');
    return Buffer.concat([length, data], length.length + data.length);
};

var decodeString = function (input) {
    var result = decodeInteger(input, 7);
    var str;
    if (input[0] & 0x80) {
        str = huffman.decode(input.slice(result.len, result.len + result.value));
    } else {
        str = input.toString('ascii', result.len, result.len + result.value);
    }
    return {
        'value': str,
        'len': result.len + result.value
    };
};

var encodeField = function (name, value) {
    var i, j, index;

    index = this.rHeaderTable.find(name, value);
    if (index) {
        output = encodeInteger(index, 7);
        output[0] |= 0x80;
        return output;
    }

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
            output = encodeInteger(this.rHeaderTable.length - 1 + j, 7);
            output[0] |= 0x80;
            this.rHeaderTable.insert(name, value);
        } else {
            output = Buffer.concat([
                        encodeInteger(this.rHeaderTable.length - 1 + i, 6),
                        encodeString(value)]);
            output[0] |= 0x40;
            this.rHeaderTable.insert(name, value);
        }
        return output;
    }

    output = Buffer.concat([
                encodeInteger(0, 6),
                encodeString(name),
                encodeString(value)]);
    output[0] |= 0x40;
    this.rHeaderTable.insert(name, value);
    return output;
};

var staticTable = HPACK.prototype.staticTable = [
    [void(0), void(0)],
    [':authority', ''],
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
    ['accept-charset', ''],
    ['accept-encoding', 'gzip, deflate'],
    ['accept-language', ''],
    ['accept-ranges', ''],
    ['accept', ''],
    ['access-control-allow-origin', ''],
    ['age', ''],
    ['allow', ''],
    ['authorization', ''],
    ['cache-control', ''],
    ['content-disposition', ''],
    ['content-encoding', ''],
    ['content-language', ''],
    ['content-length', ''],
    ['content-location', ''],
    ['content-range', ''],
    ['content-type', ''],
    ['cookie', ''],
    ['date', ''],
    ['etag', ''],
    ['expect', ''],
    ['expires', ''],
    ['from', ''],
    ['host', ''],
    ['if-match', ''],
    ['if-modified-since', ''],
    ['if-none-match', ''],
    ['if-range', ''],
    ['if-unmodified-since', ''],
    ['last-modified', ''],
    ['link', ''],
    ['location', ''],
    ['max-forwards', ''],
    ['proxy-authenticate', ''],
    ['proxy-authorization', ''],
    ['range', ''],
    ['referer', ''],
    ['refresh', ''],
    ['retry-after', ''],
    ['server', ''],
    ['set-cookie', ''],
    ['strict-transport-security', ''],
    ['transfer-encoding', ''],
    ['user-agent', ''],
    ['vary', ''],
    ['via', ''],
    ['www-authenticate', ''],
];

module.exports = {
    'HPACK': HPACK,
};
