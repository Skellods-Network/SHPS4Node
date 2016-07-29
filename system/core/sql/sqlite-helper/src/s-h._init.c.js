'use strict';

var fs = require('fs');
var sqlite = require('sql.js');


require('../interface/s-h.h.js').prototype._init = function ($db) {

    this.dbPath = $db;

    var filebuffer = fs.readFileSync($db);
    this.db = new sqlite.Database(filebuffer);

    this.qHead = null;
};
