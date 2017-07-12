'use strict';

const mixinBase = require('../interface/SHPSM_base.h');
const mixinInit = require('../interface/SHPSM_init.h');
const nml = require('node-mod-load');
const Result = require('rustify-js').Result;

const globalNML = nml('SHPS4Node');
const libs = nml('SHPS4Node-main').libs;

libs['main.h'].init = function mainInit() {

    console.log('Set up error management...');

    process.on('uncaughtException', $err => {

        console.error($err);
        console.error($err.stack);
        console.error('\n');
    });

    process.on('unhandledRejection', $err => {

        console.error(`${$err};;; Unhandled promise rejection!`);
        console.error($err.stack || (new Error()).stack);
        console.error('\n');
    });

    console.log('Register mixins...');
    globalNML.addMeta('_mixins', {
        base: mixinBase,
        init: mixinInit,
    });

    // main must return the constructor, not the object!
    return Result.fromSuccess(libs['main.h']);
};
