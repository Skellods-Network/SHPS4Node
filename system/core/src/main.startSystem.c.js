'use strict';

const pc = require('cluster');

const libs = require('node-mod-load')('SHPS4Node').libs;

const H = require('../interface/main.h');

H.prototype.startSystem = function mainStartSystem() {
    this.writeLog(this.logLevels.trace, {
        mod: 'MAIN',
        msg: 'main.startSystem()',
    });

    libs.coml.writeLn('Establish process objective in cluster...');
    if (pc.isWorker) {
        // todo: get cluster info and register to get functionality. Do other stuff dependeing on that!
        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: implement clustering!' });
        return;
    }

    libs.coml.writeLn('Check filesystem...');
    // todo: check FS (r+w on necessary folders, r-only on certain folders)
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: implement FS check!' });

    libs.coml.writeLn('Load plugins...');
    //libs.plugin.loadPlugins();

    libs.coml.writeLn('Load configs...');
    // todo: load configs
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: load configs!' });

    libs.coml.writeLn('Check environment...');
    // todo: check env (SQL)
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check environment!' });

    libs.coml.writeLn('Load pipelines...');
    libs.coml.writeLn('Build pipelines...');
    libs.coml.writeLn('Start pipelines...');
    // todo: build pipelines and start them
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: build pipeline!' });

    libs.coml.writeLn('Start sub-processes...');
    // todo: start sub-processes, establish IPC, distribute tasks, etc.

    libs.coml.writeLn('Start terminal...');
    libs.coml.registerCommand('exit', 'exit', 'Shutdown SHPS', () => libs.init.halt());
    libs.coml.startInputMode();

    libs.coml.writeLn('\nI am done starting the system!');
    libs.coml.writeLn('If you need help, type `help` and press enter.\n');

    this.writeLog(this.logLevels.trace, {
        mod: 'MAIN',
        msg: '\\\\ main.startSystem()',
    });
};
