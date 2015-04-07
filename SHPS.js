'use strict';

/**
 * Will start SHPS with exposed garbage collector
 */
var app = function f_app() {// I'm so childish for laughing about this  :D
    
    if (global.gc) {
        
        var main = require('./system/core/main');
        var log = require('./system/core/log.js');
        
        log.cls();
        log.writeWelcome();
        
        main.init();
    }
    else {
        
        var cp = require('child_process');
        var SFFM = require('./system/core/SFFM.js');
        
        cp.spawn(SFFM.isIOJS() ? 'iojs' : 'node', ['--expose-gc', './SHPS.js'], { stdio: 'inherit' });
    }
};

if (process.argv.length > 1) {

    var i = 1;
    var l = process.argv.length;
    var found = false;
    while (i < l) {

        if (process.argv[i] === '-debug') {

            found = true;
            break;
        }

        i++;
    }

    if (found) {

        // Timeout needed because VS2013 is too slow.
        // It won 't connect to the debugger in time for all of the startup-action otherwise :/
        setTimeout(app, 1000);
    }
    else {

        app();
    }
}
