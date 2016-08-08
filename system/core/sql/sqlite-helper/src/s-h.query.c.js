'use strict';

var sqlite = require('sql.js');


require('../interface/s-h.h.js').prototype.query = function ($str, $bindVals, $cb) {

    var stmt;
    try {

        if (arguments.length < 3) {

            $cb = $bindVals;
            $bindVals = undefined;
        }

        stmt = this.db.prepare($str);

        var arr = [];
        while (stmt.step()) {

            arr.push(stmt.getAsObject($bindVals));
        }

        stmt.free();
        $cb(null, arr);
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
