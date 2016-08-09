'use strict';


require('../interface/s-h.h.js').prototype.query = function ($str, $bindVals, $cb) {

    var stmt;
    try {

        if (arguments.length < 3) {

            $cb = $bindVals;
            $bindVals = undefined;
        }

        stmt = this.db.prepare($str);

        if (!!$bindVals) {

            var tmp;
            for (var key in $bindVals) {

                if ($bindVals.hasOwnProperty(key)) {

                    tmp = $bindVals[key];
                    delete $bindVals[key];
                }

                // I do not really like the hardcoded `:`,
                // but since this module is specifically for SQLite it might be acceptable
                $bindVals[':' + key] = tmp;
            }
        }


        var arr = [];
        var firstRow = stmt.getAsObject($bindVals);
        if (!!firstRow) {

            arr.push(firstRow);
        }

        // If we step() on INSERT, data will be duplicated :/
        if (/SELECT.+?FROM/i.test($str)) {

            while (stmt.step()) {

                arr.push(stmt.getAsObject($bindVals));
            }
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
