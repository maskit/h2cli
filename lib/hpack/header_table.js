var util = require('util');
var HeaderTable = module.exports = function () {
    this.table = [[void(0), void(0), void(0)]];
    this.maxTableSize = 4096;
    this._size = 0;
    this._seq = 0;
};
HeaderTable.prototype.get = function (index) {
    return this.table[index];
};
HeaderTable.prototype.insert = function (name, value) {
    var entrySize = name.length + value.length + 32;
    var evicted;
    while (this.table.length > 1 && this.size + entrySize > this.maxTableSize) {
        evicted = this.table.pop();
        this._size -= evicted[0].length + evicted[1].length + 32;
    }
    if (this.size + entrySize <= this.maxTableSize) {
        this.table.splice(1, 0, [name, value]);
        this._size += entrySize;
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
HeaderTable.prototype.setTableSize = function (size) {
    var evicted;
    this.maxTableSize = size;
    while (this.table.length > 1 && this.size > this.maxTableSize) {
        evicted = this.table.pop();
        this._size -= evicted[0].length + evicted[1].length + 32;
    }
};

Object.defineProperty(HeaderTable.prototype, 'size', {
    get: function () {
             return this._size;
         }
});
Object.defineProperty(HeaderTable.prototype, 'length', {
    get: function () {
             return this.table.length - 1;
         }
});

