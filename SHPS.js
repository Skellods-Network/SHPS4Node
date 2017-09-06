#!/usr/bin/env node

// SHPS bootstrap

'use strict';

const cp = require('child_process');

const commander = require('commander');
const nml = require('node-mod-load');
const init = require('SHPS4Node-init');
const prettyError = require('pretty-error');
const rustify = require('rustify-js');
const semver = require('semver');

const packageConfig = require('./package.json');

const SHPS = nml('SHPS4Node');
let debug = false;


// Firstly, check the script arguments:
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

    // todo: there seems to be a bug in rustify and the registerAllGlobals() static method is not available. fix it!
    rustify.Option.registerGlobals();
    rustify.Result.registerGlobals();

    // Display all the errors which happen during boot
    // For now, recovering from fatal system errors is not supported
    nmlMain
        .addPath('./system/core')
        .then(
            () => boot(debug)
                // Set timeout to flush warning queue
                .then(() => setTimeout(() => {
                    nmlGlobal.libs.coml.writeLn('Start system...');
                    nmlGlobal
                        .libs
                        .main
                        .startSystem()
                        .then(() => {
                            process.title =
                                `${packageConfig.name} v${packageConfig.version} ${packageConfig.cycle} Terminal`;
                        })
                        .catch($e => {
                            nmlGlobal.libs.coml.error('Could not start SHPS!');
                            throw $e;
                        });
                }, 0))
                .catch($e => {
                    throw $e;
                // eslint-disable-next-line comma-dangle
                })
        )
        .catch($e => {
            throw $e;
        })
    ;
}
