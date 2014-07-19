module.exports.encode = function (input, n) {
    var output = [];
    var x = Math.pow(2, n) - 1;
    if (input < x) {
        output.push(input);
    } else {
        output.push(x);
        input = input - x;
        while (input >= 128) {
            output.push(input % 128 + 128);
            input = parseInt(input / 128, 10);
        }
        output.push(input);
    }
    return new Buffer(output);
};
module.exports.decode = function (input, n) {
    var i, j = 0, m = 0;
    i = input[0] & Math.pow(2, n) - 1;
    if (i === Math.pow(2, n) - 1) {
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
