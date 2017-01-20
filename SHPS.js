// SHPS bootstrap

'use strict';


let debug = false;


// Firstly, check the script arguments:
if (process.argv.length > 1) {

    let i = 2;
    const l = process.argv.length;

    // search for switches
    while (i < l) {

        let arg = process.argv[i];
        if (arg === '-d' || arg === '--debug') {

            debug = true;
        }

        i++;
    }
}

// Secondly, check NodeJS features and compare them against the script arguments:
if (!debug && !global.gc) {

    console.log('Reconfigure NodeJS start parameters...');

    const cp = require('child_process');
    const params = ['--expose-gc'];

    params.push('./SHPS.js');
    cp.spawn('node', params, { stdio: 'inherit' });
}
else {

    // Thirdly, start SHPS:
    const nml = require('node-mod-load');
    const boot = require('SHPS4Node-init').boot;

    const nmlMain = nml('SHPS4Node-main');

    // Display all the errors which happen during boot
    // For now, recovering from fatal system errors is not supported
    nmlMain.addPath('./system/core').then(
        () => boot(debug).then(
            () => {},
            $e => { console.error($e); }
        ),
        $e => { console.error($e); }
    );
}
