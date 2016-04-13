'use strict';

var q = require('q');


require('../interface/nosql-table.h.js').prototype.init = function () {

    var d = q.defer();
    if (typeof this._nosql._db[this._name] === 'undefined') {

        d.reject(new Error('No such collection available: ' + this._name));
    }
    else {

        d.resolve();
    }

    return d.promise;
};
