'use strict';

var libs = require('node-mod-load').libs;
var q = require('q');

var h = require('../interface/init.h.js');

// Reference implementation
h.init = function () {

    if (!libs.init.o) {

        if (this) {

            libs.init.o = this;
        }
        else {

            libs.init.o = new libs.init();
        }
    }

    libs.init._state = SHPS_MODULE_STATE_RUNNING;

    return q.Promise($res => {

        $res();
    });
};
