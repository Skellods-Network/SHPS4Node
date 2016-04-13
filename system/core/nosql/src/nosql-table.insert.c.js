'use strict';

var defer = require('promise-defer');
var q = require('q');


require('../interface/nosql-table.h.js').prototype.insert = function ($vals) {

    var d = q.defer();

    if (typeof $vals === 'array') {

        async.forEachParallel({

            inputs: $vals,
            func: ($val, $cb) => {

                this.insert($val).done($cb.bind(null, null), $cb);
            },
        }, ($err, $res) => {

            if ($err) {

                d.reject($err);
            }
            else {

                d.resolve($res);
            }
        });
    }
    else {

        $vals.ID = this._nosql._db[this._name].createNewId();
        //TODO: Fix create a new "tables" Object on every insert, when "upsert" is set to true
        this._nosql._db[this._name].update({

            schema: this._name,
        }, {
            $push: {
                [this._name]: $vals,
            }
        }, {
                
            upsert: true,
        }, ($err, $doc) => {

            if ($err) {

                d.reject($err);
            }
            else {

                d.resolve($doc);
            }
        });
    }

    return d.promise;
};
