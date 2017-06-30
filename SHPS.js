#!/usr/bin/env node

// SHPS bootstrap

'use strict';

const cp = require('child_process');

const commander = require('commander');
const nml = require('node-mod-load');
const init = require('SHPS4Node-init');


let debug = false;


// Firstly, check the script arguments:
if (process.argv.length > 2) {
    commander
        .allowUnknownOption(false)
        .description(`
  SHPS Application Framework

  SHPS exposes a foundation which should be used as base for any kind of server application.
  The main concerns include security, performance and ease-of-use.\n`)
        .option('-d, --debug', 'start in debug mode, which disables certain run-time optimizations')
        .parse(process.argv);

    debug = !!commander.debug;
}

// Secondly, check NodeJS features and compare them against the script arguments:
if (!debug && !global.gc) {
    console.log('Reconfigure NodeJS start parameters...');

    const params = ['--expose-gc'];

    params.push(process.argv.slice(1));
    cp.spawn(process.argv[0], params, { stdio: 'inherit' });
} else {
    // Thirdly, start SHPS:
    const boot = init.boot;

    const nmlMain = nml('SHPS4Node-main');

    // Display all the errors which happen during boot
    // For now, recovering from fatal system errors is not supported
    nmlMain
        .addPath('./system/core')
        .then(
            () => boot(debug)
                .then(() => {
                    const nmlGlobal = nml('SHPS4Node');

                    nmlGlobal.libs.coml.writeLn('Start System...');
                    nmlGlobal.libs.main.startSystem();
                    // nlm('SHPS4Node').coml.startTerminal();
                })
                .catch($e => {
                    console.error($e);
                // eslint-disable-next-line comma-dangle
                })
        )
        .catch($e => {
            console.error($e);
        });
}
