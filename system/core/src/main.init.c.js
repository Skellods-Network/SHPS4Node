'use strict';

const libs = require('node-mod-load')('SHPS4Node-main').libs;
const Result = require('rustify-js').Result;


libs['main.h'].init = function() {

    console.log('Set up error management...');

    process.on('uncaughtException', $err => {

        console.error($err);
        console.error($err.stack);
        console.error('\n');
    });

    process.on('unhandledRejection', $err => {

        console.error($err + ';;; Unhandled promise rejection!');
        console.error((new Error()).stack);
        console.error('\n');
    });

    // main must return the constructor, not the object!
    return Result.fromSuccess(libs['main.h']);
};
