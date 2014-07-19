var util = require('util');
var events = require('events');
var IntCodec = require('./hpack/int_codec');
var StrCodec = require('./hpack/str_codec');
var HeaderTable = require('./hpack/header_table');

var HPACK = function () {
    var self = this;
    this.lHeaderTable = new HeaderTable();
    this.lHeaderTable.on('evict', function (ref) {
        delete self.lReferenceSet[ref];
    });
    this.rHeaderTable = new HeaderTable();
    this.rHeaderTable.on('evict', function (ref) {
        delete self.rReferenceSet[ref];
    });
    this.lReferenceSet = {};
    this.rReferenceSet = {};
};

HPACK.prototype.encode = function (input) {
    var i, j, ref, buf;
    var output = [];
    var bufPos = 0;
    var name, value, block;

    // Clear Reference Set (to simplify encoding logic)
    output.push(new Buffer([0x30]));
    for (ref in this.rReferenceSet) {
        delete this.rReferenceSet[ref];
    }

    // Change header table size if needed
    if (this._needTableSizeChange) {
        buf = IntCodec.encode(this._newTableSize, 4);
        buf[0] |= 0x20;
        output.push(buf);
        this.rHeaderTable.setTableSize(this._newTableSize);
        this._needTableSizeChange = false;
    }

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
    // console.log('HPACK-DEBUG: ====Header Table====');
    // console.log(this.lHeaderTable);
    // console.log('HPACK-DEBUG: ====Ref Set====');
    // console.log(this.lReferenceSet);
    while (pos < input.length) {
        if (input[pos] & 0x80) {
            // console.log('HPACK-DEBUG: Indexed Header Field Representation');
            result = IntCodec.decode(input.slice(pos), 7);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index <= this.lHeaderTable.length) {
                field = this.lHeaderTable.get(index);
                if (this.lReferenceSet[field[2]]) {
                    // console.log('HAPCK-DEBUG: Remove: ' + field);
                    delete this.lReferenceSet[field[2]];
                } else {
                    // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                    output.push([field[0], field[1]]);
                    this.lReferenceSet[field[2]] = true;
                }
            } else {
                field = staticTable[index - (this.lHeaderTable.length - 1)];
                // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                ref = this.lHeaderTable.insert(field[0], field[1]);
                if (ref) {
                    this.lReferenceSet[ref] = true;
                }
                output.push([field[0], field[1]]);
            }
        } else if (input[pos] & 0x40) {
            // console.log('HPACK-DEBUG: Literal Header Field with Incremental Indexing');
            result = IntCodec.decode(input.slice(pos), 6);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index === 0) {
                result = StrCodec.decode(input.slice(pos));
                pos += result.len;
                field = result.value;
            } else {
                if (index <= this.lHeaderTable.length) {
                    field = this.lHeaderTable.get(index)[0];
                } else {
                    field = staticTable[index - (this.lHeaderTable.length - 1)][0];
                }
            }
            result = StrCodec.decode(input.slice(pos));
            pos += result.len;
            // console.log('HPACK-DEBUG: Emit: ' + [field, result.value]);
            ref = this.lHeaderTable.insert(field, result.value);
            if (ref) {
                this.lReferenceSet[ref] = true;
            }
            output.push([field, result.value]);
        } else if (input[pos] & 0x20) {
            // console.log('HPACK-DEBUG: Encoding Context Update');
            if (input[pos] & 0x10) {
                // console.log('HPACK-DEBUG: Reference Set Emptying');
                Object.keys(this.lReferenceSet).forEach(function (elm) {
                    delete this.lReferenceSet[elm];
                }, this);
                pos += 1;
            } else {
                // console.log('HPACK-DEBUG: Maximum Header Table Size Change');
                result = IntCodec.decode(input.slice(pos), 4);
                this.lHeaderTable.setTableSize(result.value);
                pos += result.len;
            }
        } else {
            var never;
            if (input[pos] & 0x10) {
                never = false;
                // console.log('HPACK-DEBUG: Literal Header Field without Indexing');
            } else {
                never = true;
                // console.log('HPACK-DEBUG: Literal Header Field Never Indexed');
            }
            result = IntCodec.decode(input.slice(pos), 4);
            index = result.value;
            pos += result.len;
            // console.log('HPACK-DEBUG: Index: ' + index);
            if (index === 0) {
                result = StrCodec.decode(input.slice(pos));
                pos += result.len;
                field = result.value;
            } else {
                if (index <= this.lHeaderTable.length) {
                    field = this.lHeaderTable.get(index)[0];
                } else {
                    field = staticTable[index - (this.lHeaderTable.length - 1)][0];
                }
            }
            result = StrCodec.decode(input.slice(pos));
            pos += result.len;
            // console.log('HPACK-DEBUG: Emit: ' + [field, result.value]);
            output.push([field, result.value]);
        }
    }
    var output2 = [];
    for (ref in this.lReferenceSet) {
        field = this.lHeaderTable.refer(ref);
        for (i = 0; i < output.length; i++) {
            if (output[i][0] === field[0] && output[i][1] === field[1]) {
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
HPACK.prototype.setTableSize = function (size) {
    this._needTableSizeChange = true;
    this._newTableSize = size;
};

var encodeField = function (name, value) {
    var i, j, index, ref;

    index = this.rHeaderTable.find(name, value);
    if (index) {
        output = IntCodec.encode(index, 7);
        output[0] |= 0x80;
        if(this.rReferenceSet[this.rHeaderTable.get(index)[2]]) {
            return Buffer.concat([output, output]);
        } else {
            this.rReferenceSet[this.rHeaderTable.get(index)[2]] = true;
            return output;
        }
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
            output = IntCodec.encode(this.rHeaderTable.length - 1 + j, 7);
            output[0] |= 0x80;
            ref = this.rHeaderTable.insert(name, value);
            if (ref) {
                this.rReferenceSet[ref] = true;
            }
        } else {
            output = Buffer.concat([
                        IntCodec.encode(this.rHeaderTable.length + i, 6),
                        StrCodec.encode(value)]);
            output[0] |= 0x40;
            ref = this.rHeaderTable.insert(name, value);
            if (ref) {
                this.rReferenceSet[ref] = true;
            }
        }
        return output;
    }

    output = Buffer.concat([
                IntCodec.encode(0, 6),
                StrCodec.encode(name),
                StrCodec.encode(value)]);
    output[0] |= 0x40;
    ref = this.rHeaderTable.insert(name, value);
    if (ref) {
        this.rReferenceSet[ref] = true;
    }
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
