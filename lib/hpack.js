var IntCodec = require('./hpack/int_codec');
var FieldCodec = require('./hpack/field_codec');
var HeaderTable = require('./hpack/header_table');
var StaticTable = require('./hpack/static_table');

var lookupTables = function (index) {
    var fieldSet;
    if (index <= this.lHeaderTable.length) {
        fieldSet = this.lHeaderTable.get(index);
    } else {
        fieldSet = StaticTable.get(index - this.lHeaderTable.length);
    }
    return fieldSet;
};

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
    this.huffmanStrategy = 1;
};

HPACK.prototype.encode = function (input) {
    var i, ref, buf;
    var output = [];
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
    var ref, result, field;
    var pos = 0;
    // console.log('HPACK-DEBUG: ====Header Table====');
    // console.log(this.lHeaderTable);
    // console.log('HPACK-DEBUG: ====Ref Set====');
    // console.log(this.lReferenceSet);
    while (pos < input.length) {
        if ((input[pos] & 0xE0) === 0x20) {
            // console.log('HPACK-DEBUG: Encoding Context Update');
            if (input[pos] & 0x10) {
                // console.log('HPACK-DEBUG: Reference Set Emptying');
                Object.keys(this.lReferenceSet).forEach(function (elm) {
                    delete this.lReferenceSet[elm];
                }, this);
                pos += 1;
            } else {
                // console.log('HPACK-DEBUG: Maximum Header Table Size Change');
                result = IntCodec.decode(input, pos, 4);
                this.lHeaderTable.setTableSize(result.value);
                pos += result.len;
            }
            continue;
        }
        result = FieldCodec.decode(input, pos);
        pos += result.len;
        if (result.type === 0) {
            // console.log('HPACK-DEBUG: Indexed Header Field Representation');
            // console.log('HPACK-DEBUG: Index: ' + result.index);
            if (result.index <= this.lHeaderTable.length) {
                field = this.lHeaderTable.get(result.index);
                if (this.lReferenceSet[field[2]]) {
                    // console.log('HAPCK-DEBUG: Remove: ' + field);
                    delete this.lReferenceSet[field[2]];
                } else {
                    this.lReferenceSet[field[2]] = true;
                    // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                    output.push([field[0], field[1]]);
                }
            } else {
                field = StaticTable.get(result.index - this.lHeaderTable.length);
                ref = this.lHeaderTable.insert(field[0], field[1]);
                if (ref) {
                    this.lReferenceSet[ref] = true;
                }
                // console.log('HPACK-DEBUG: Emit: ' + [field[0], field[1]]);
                output.push([field[0], field[1]]);
            }
        } else {
            if (result.type === 1) {
                // console.log('HPACK-DEBUG: Literal Header Field with Incremental Indexing');
            } else if (result.type === 2) {
                // console.log('HPACK-DEBUG: Literal Header Field without Indexing');
            } else {
                // console.log('HPACK-DEBUG: Literal Header Field Never Indexed');
            }
            // console.log('HPACK-DEBUG: Index: ' + result.index);
            if (result.index) {
                field = lookupTables.call(this, result.index)[0];
            } else {
                field = result.name;
            }
            if (result.type === 1) {
                ref = this.lHeaderTable.insert(field, result.value);
                if (ref) {
                    this.lReferenceSet[ref] = true;
                }
            }
            // console.log('HPACK-DEBUG: Emit: ' + [field, result.value]);
            output.push([field, result.value]);
        }
    }
    var output2 = [];
    for (ref in this.lReferenceSet) {
        field = this.lHeaderTable.refer(ref);
        var i;
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

HPACK.prototype.useHuffman= function (strategy) {
    this.huffmanStrategy = strategy;
};

var encodeField = function (name, value) {
    var i, j, index, ref, output;

    index = this.rHeaderTable.find(name, value);
    if (index) {
        output = FieldCodec.encode(index);
        if(this.rReferenceSet[this.rHeaderTable.get(index)[2]]) {
            return Buffer.concat([output, output]);
        } else {
            this.rReferenceSet[this.rHeaderTable.get(index)[2]] = true;
            return output;
        }
    }

    i = StaticTable.indexOf(name, null, 0);
    if (i !== -1) {
        j = StaticTable.indexOf(name, value, i);
        if (j !== -1) {
            output = FieldCodec.encode(this.rHeaderTable.length + j);
            ref = this.rHeaderTable.insert(name, value);
            if (ref) {
                this.rReferenceSet[ref] = true;
            }
        } else {
            output = FieldCodec.encode(
                    this.rHeaderTable.length + i,
                    value,
                    0,
                    this.huffmanStrategy);
            ref = this.rHeaderTable.insert(name, value);
            if (ref) {
                this.rReferenceSet[ref] = true;
            }
        }
        return output;
    }

    output = FieldCodec.encode(name, value, 0, this.huffmanStrategy);
    ref = this.rHeaderTable.insert(name, value);
    if (ref) {
        this.rReferenceSet[ref] = true;
    }
    return output;
};

module.exports = {
    'HPACK': HPACK,
};
