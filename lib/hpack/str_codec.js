var IntCodec = require('./int_codec');
var HuffmanCodec = require('./huffman_codec');

module.exports.encode = function (input, huffman) {
    // Never use huffman (because it's not implemented yet)
    var length = IntCodec.encode(input.length, 7);
    var data = new Buffer(input, 'ascii');
    return Buffer.concat([length, data], length.length + data.length);
};

module.exports.decode = function (input, offset) {
    var result = IntCodec.decode(input, offset, 7);
    var str;
    if (input[offset] & 0x80) {
        str = HuffmanCodec.decode(input, offset + result.len, result.value);
    } else {
        str = input.toString('ascii', offset + result.len, offset + result.len + result.value);
    }
    return {
        'value': str,
        'len': result.len + result.value
    };
};
