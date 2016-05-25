'use strict';

var libs = require('node-mod-load').libs;
var q = require('q');

require('../interface/init.h.js').prototype.shutdown = function () {

    var d = q.defer();

    var keys = Object.keys(libs);
    var i = 0;
    var l = keys.lenth;
    var proms = [];
    while (i < l) {

        if (libs[keys[i]].halt) {

            proms.push(libs[keys[i]].halt());
        }

        i++;
    }

    Promise.all(proms).then(d.resolve, d.reject);
    
    return d.promise;
};
