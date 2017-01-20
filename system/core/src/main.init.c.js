'use strict';

const libs = require('node-mod-load')('SHPS4Node-main').libs;
const Result = require('result-js');


libs['main.h'].init = function () {

    console.log('Set up error management...');

    process.on('uncaughtException', $err => {

        const str = 'Caught uncaught exception: ' + $err;
        console.error(str);
    });

    // main must return the constructor, not the object!
    return Result.fromSuccess(libs['main.h']);
};
