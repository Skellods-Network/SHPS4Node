#!/usr/bin/env node

// SHPS bootstrap

'use strict';

const cp = require('child_process');

const commander = require('commander');
const nml = require('node-mod-load');
const init = require('SHPS4Node-init');
const prettyError = require('pretty-error');
const semver = require('semver');

const packageConfig = require('./package.json');

const SHPS = nml('SHPS4Node');
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
        .option('-p, --prod', 'start SHPS without asking maintenance-related questions')
        .parse(process.argv);

    debug = !!commander.debug;
    SHPS.addMeta('_options', {});
    SHPS.libs._options.debug = !!commander.debug;
    SHPS.libs._options.prod = !!commander.prod;
}

// Secondly, check NodeJS features and compare them against the script arguments:
if (!debug && !global.gc) {
    console.log('Reconfigure NodeJS start parameters...');

    const params = [
        '--expose-gc',
        '--log-colour',
        '--preserve-symlinks',
        '--use-strict',
    ];

    if (semver.gte(process.version, '8.0.0')) {
        params.push('--pending-deprecation');
    }

    params.push('--');
    params.push(process.argv.slice(1));
    const nodePath = process.argv[0];

    console.log(`${nodePath} ${params.join(' ')}`);
    cp.spawn(nodePath, params, { stdio: 'inherit' });
} else {
    // Thirdly, start SHPS:
    const boot = init.boot;
    const nmlGlobal = nml('SHPS4Node');
    const nmlMain = nml('SHPS4Node-main');

    prettyError.start();
    nmlGlobal.addMeta('_config', packageConfig);

    // Display all the errors which happen during boot
    // For now, recovering from fatal system errors is not supported
    nmlMain
        .addPath('./system/core')
        .then(
            () => boot(debug)
                .then(() => {
                    nmlGlobal.libs.coml.writeLn('Start system...');
                    nmlGlobal.libs.main.startSystem();
                })
                .catch($e => {
                    console.error($e);
                // eslint-disable-next-line comma-dangle
                })
        )
        .catch($e => {
            console.error($e);
        })
    ;
}
