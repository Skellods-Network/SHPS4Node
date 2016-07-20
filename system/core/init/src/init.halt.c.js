'use strict';

var libs = require('node-mod-load').libs;
var q = require('q');

var h = require('../interface/init.h.js');


// Reference implementation
h.halt = function () {

    if (libs.init.o) {

        delete libs.init.o;
    }

    libs.init._state = SHPS_MODULE_STATE_HALT;

    return q.Promise($res => {

        $res();
    });
};
