var IntCodec = require('./int_codec');
var HuffmanCodec = require('./huffman_codec');

module.exports.encode = function (input, huffman) {
    // Never use huffman (because it's not implemented yet)
    var length = IntCodec.encode(input.length, 7);
    var data = new Buffer(input, 'ascii');
    return Buffer.concat([length, data], length.length + data.length);
};

module.exports.decode = function (input) {
    var result = IntCodec.decode(input, 7);
    var str;
    if (input[0] & 0x80) {
        str = HuffmanCodec.decode(input.slice(result.len, result.len + result.value));
    } else {
        str = input.toString('ascii', result.len, result.len + result.value);
    }
    return {
        'value': str,
        'len': result.len + result.value
    };
};
