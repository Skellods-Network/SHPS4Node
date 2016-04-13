'use strict';

var fs = require('fs');
var nedb = require('nedb');
var libs = require('node-mod-load').libs;
var path = require('path');
var defer = require('promise-defer');
var q = require('q');


require('../interface/nosql.h.js').prototype.init = function () {

    //TODO: prepare pools (only one process can use a DB at one time)
    //TODO: switch DB type
    //TODO: in DB abstraction interface, use nedb if db is not specified in config (as default)

    var d = defer();
    var r = q.defer();
    var dir = libs.main.getDir(SHPS_DIR_DB) + this._config.generalConfig.URL.value + path.sep;
    fs.access(dir, fs.F_OK, $err => {

        if ($err) {

            fs.mkdir(dir, fs.F_OK | fs.R_OK | fs.W_OK, $err => {

                if ($err) {

                    d.reject($err);
                }
                else {

                    d.resolve();
                }
            });
        }
        else {

            d.resolve();
        }
    });

    d.promise.then(() => {

        //TODO: get collections from template, scan folder for additional collections
        //TODO: check document header
        this._db = {};
        this._db.accesskey = new nedb({

            filename: dir + this._alias + '.accesskey.nedb',
            autoload: true,
        });

        r.resolve();
    }, r.reject);

    return r.promise;
};
