'use strict';

(function f_SHPS() {
    
    var cluster = require('cluster');

    var libs = require('./system/core/perf.js').commonLibs;
    

    ////// ONLY FOR DEVELOPMENT PURPOSES \\\\\\
    // This will start SHPS as if it was starting without debug - but it will not reconfigure the start parameters
    // This is important for debugging purposes as I cannot use breakpoints in a child process...
    GLOBAL.__debug__ = false;
    ////// ONLY FOR DEVELOPMENT PURPOSES \\\\\\
    
    
    /**
     * Will start SHPS with exposed garbage collector
     */
    var app = function f_app($debug) {// I'm so childish for laughing about this  :D
        $debug = typeof $debug !== 'undefined' ? $debug : false;
        
        if (global.gc || $debug || __debug__) {// Running the script in a child process destroys the possibility to debug

            if (cluster.isMaster) {
                
                libs.gLog.cls();
            }
            
            libs.gLog.writeWelcome();
            
            if ($debug) {
                
                libs.main.setDebug($debug);
            }
            
            libs.main.init();
        }
        else {
            
            var cp = require('child_process');
            var SFFM = require('./system/core/SFFM.js');
            var param = ['--expose-gc', '--harmony_proxies'];
            if (SFFM.isHarmonyActivated()) {
                
                param.push('--harmony');
            }
            
            param.push('./SHPS.js');
            var bin = SFFM.isIOJS() ? 'iojs'
                                    : 'node';
            
            var x = cp.spawn(bin, param, { stdio: 'inherit' });
            libs.gLog.write('Reconfiguring start parameters...');
        }
    };
    
    if (process.argv.length > 1) {
        
        var i = 1;
        var l = process.argv.length;
        var debug = false;
        while (i < l) {
            
            if (process.argv[i] === '-debug') {
                
                debug = true;
                break;
            }
            
            i++;
        }
        
        if (debug || __debug__) {
            
            // Timeout needed because VS2013 is too slow.
            // It won 't connect to the debugger in time for all of the startup-action otherwise :/
            libs.gLog.write('Starting wait for debugger...');
            setTimeout(function () {
                
                app(debug);
            }, 1000);
        }
        else {
            
            process.nextTick(app);
        }
    }
})();
