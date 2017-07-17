'use strict';

const mixinBase = require('../interface/SHPSM_base.h');
const mixinInit = require('../interface/SHPSM_init.h');
const nml = require('node-mod-load');
const Result = require('rustify-js').Result;

const globalNML = nml('SHPS4Node');
const libs = nml('SHPS4Node-main').libs;
const unhandledRejections = new Map();

libs['main.h'].init = function mainInit() {

    console.log('Set up error management...');

    const errorHook = ($err, $print, $level = libs['main.h'].logLevels.error) => {
        if ($print !== false) {
            console.error($err.stack);
            console.error('\n');
        }

        globalNML.libs.main.writeLog($level, `{${$err.name}} ${$err.message} (${$err.stack.split('\n')[1].trim()})`);
    };

    process.on('rejectionHandled', $p => {
        clearTimeout(unhandledRejections.get($p));
        unhandledRejections.delete($p);
    });

    process.on('uncaughtException', errorHook);
    process.on('unhandledRejection', ($e, $p) => {
        unhandledRejections.set($p, setTimeout(() => errorHook($e), 100));
    });

    process.on('warning', $w => errorHook($w, false, libs['main.h'].logLevels.warning));

    console.log('Register mixins...');
    globalNML.addMeta('_mixins', {
        base: mixinBase,
        init: mixinInit,
    });

    // main must return the constructor, not the object!
    return Result.fromSuccess(libs['main.h']);
};
