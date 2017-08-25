'use strict';

const pc = require('cluster');

const libs = require('node-mod-load')('SHPS4Node').libs;

const H = require('../interface/main.h');

H.prototype.startSystem = async function mainStartSystem() {
    libs.coml.write('Establish process objective in cluster...');
    if (pc.isWorker) {
        // todo: get cluster info and register to get functionality. Do other stuff dependeing on that!
        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: implement clustering!' });
        return;
    }
    else {
        libs.coml.writeLn(' I am Master!');
    }

    libs.coml.writeLn('Check filesystem...');
    // todo: check FS (r+w on necessary folders, r-only on certain folders)
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: implement FS check!' });

    this.writeLog(this.logLevels.debug, { mod: 'MAIN', msg: `load plugins from "${libs.main.directories.plugins}"` });
    await libs.plugin.loadPlugins(libs.main.directories.plugins);

    await libs.config.loadTemplates(libs.main.directories.templates);
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check if master-config template is available, else download it!' });
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: load configs!' });
    //await libs.config.loadConfigs(libs.main.directories.configs);
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check if master-config is available, else create it!' });

    libs.coml.writeLn('Check environment...');
    // todo: check env (SQL)
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check environment, e.g. SQL!' });

    libs.coml.writeLn('Start sub-processes...');
    // todo: start sub-processes, establish IPC, distribute tasks, etc.

    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: Master should not serve, only build pipeline on slaves!' });
    libs.coml.writeLn('Load pipelines...');
    libs.coml.writeLn('Build pipelines...');
    libs.coml.writeLn('Start pipelines...');
    // todo: build pipelines and start them
    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: build pipeline!' });

    libs.coml.writeLn('Start terminal...');
    libs.coml.registerCommand('exit', 'exit', 'Shutdown SHPS', () => libs.init.halt());
    libs.coml.startInputMode();

    libs.coml.writeLn('\nI am done starting the system!');
    libs.coml.writeLn('If you need help, type `help` and press enter.\n');
};
