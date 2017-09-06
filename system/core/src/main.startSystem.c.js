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
        libs.coml.writeLn(' I am the Master!');
    }

    {
        libs.coml.writeLn('Check filesystem...');
        // todo: check FS (r+w on necessary folders, r-only on certain folders)
        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: implement FS check!' });
    }

    {
        // todo: decouple module by moving dependency on coml here
        await libs.plugin.loadPlugins(libs.main.directories.plugins);
    }

    {
        const task = libs.coml.startTask('Load templates');
        let ok = true;

        await libs.config.loadTemplates(libs.main.directories.templates, {
            fileFoundHandler: $fileName => task.interim(task.result.ok, `Found file "${$fileName}"`),
            fileLoadedHandler: $templateName => task.interim(task.result.ok, `Loaded template "${$templateName}"`),
            errorHandler: ($fileName, $err) => {
                task.interim(task.result.error, `${$fileName}: ${$err.message}`);
                ok = false;
            },
        });

        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check if master-config template is available, else download it!' });
        task.end(ok ? task.result.ok : task.result.error);
    }

    {
        const task = libs.coml.startTask('Load settings');
        let ok = true;

        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: load configs!' });
        ok = false;

        //await libs.config.loadConfigs(libs.main.directories.configs);
        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check if master-config is available, else create it!' });
        task.end(ok ? task.result.ok : task.result.error);
    }

    {
        const task = libs.coml.startTask('Check environment');
        let ok = true;

        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: check environment, e.g. SQL!' });
        ok = false;

        // todo: check env (SQL)

        task.end(ok ? task.result.ok : task.result.error);
    }

    {
        const task = libs.coml.startTask('Start sub-processes');
        let ok = true;

        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: start sub-processes!' });
        ok = false;

        // todo: start sub-processes, establish IPC, distribute tasks, etc.

        task.end(ok ? task.result.ok : task.result.error);
    }

    {
        const task = libs.coml.startTask('Prepare pipeline');
        let ok = true;

        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: Master should not serve, only build pipeline on slaves!' });
        ok = false;

        // todo: build pipelines and start them
        this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: build pipeline!' });
        task.interim(task.result.error, `Loaded pipelines`);
        task.interim(task.result.error, `Built pipelines`);

        task.end(ok ? task.result.ok : task.result.error);
    }

    libs.coml.writeLn('\nStart terminal...');
    libs.coml.registerCommand('exit', 'exit', 'Shutdown SHPS', () => libs.init.halt());
    libs.coml.startInputMode();

    libs.coml.writeLn('\nI am done starting the system!');
    libs.coml.writeLn('If you need help, type `help` and press enter.\n');
};
