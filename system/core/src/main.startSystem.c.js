'use strict';

const libs = require('node-mod-load')('SHPS4Node').libs;

const H = require('../interface/main.h');

H.prototype.startSystem = function mainStartSystem() {
    // libs.coml.writeLn('Check filesystem...');
    // todo: check FS (r+w on necessary folders, r-only on certain folders)

    // libs.coml.writeLn('Load plugins...');
    // todo: load plugins

    // libs.coml.writeLn('Load configs...');
    // todo: load configs

    // libs.coml.writeLn('Check environment...');
    // todo: check env (SQL)

    // libs.coml.writeLn('Load pipelines...');
    // libs.coml.writeLn('Build pipelines...');
    // libs.coml.writeLn('Start pipelines...');
    // todo: build pipelines and start them

    libs.coml.writeLn('Start terminal...');
    // todo: improve shutdown procedure
    libs.coml.registerCommand('exit', 'exit', 'Shutdown SHPS', () => process.exit());
    libs.coml.startInputMode();
};
