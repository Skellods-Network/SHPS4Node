'use strict';

var sqlite = require('sql.js');


require('../interface/s-h.h.js').prototype.query = function ($str, $bindVals, $cb) {

    var stmt;
    try {

        if (arguments.length < 3) {

            $cb = $bindVals;
            $bindVals = {};
        }

        stmt = this.db.prepare($str);
        $cb(null, stmt.getAsObject($bindVals));
        //$cb(null, this.db.run($str));
        //$cb(null, this.db.exec($str));
    }
    catch ($e) {

        $cb($e);
    }
    finally {

        if (stmt && stmt.free) {

            stmt.free();
        }
    }
};
