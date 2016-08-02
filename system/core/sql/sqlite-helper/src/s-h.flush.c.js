'use strict';

var fs = require('fs');

var defer = require('promise-defer');
var sqlite = require('sql.js');


require('../interface/s-h.h.js').prototype.flush = function () {

    var d = defer();
    var buffer = new Buffer(this.db.export());
    fs.writeFile(this.dbPath, buffer, $err => {

        if ($err) {

            d.reject($err);
        }
        else {

            d.resolve();
        }
    });

    return d.promise;
};
