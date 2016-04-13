'use strict';

var doc = require('../interface/nosql-table.h.js');


require('../interface/nosql.h.js').prototype.openTable = function ($name) {

    return new doc(this, $name);
};
