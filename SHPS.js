'use strict';

////// ONLY FOR DEVELOPMENT PURPOSES \\\\\\
// This will start SHPS as if it was starting without debug - but it will not reconfigure the start parameters
// This is important for debugging purposes as I cannot use breakpoints in a child process...
GLOBAL.__debug__ = false;
////// ONLY FOR DEVELOPMENT PURPOSES \\\\\\


(function f_SHPS() {
    
    var cluster = require('cluster');
    var path = require('path');
    
    var modLoad = require('node-mod-load');
    var libs = modLoad.libs;
    
    var _errFun = function ($err) {

        process.stdout.write('[ERROR] ' + $err + '\n' + $err.stack);
        throw $err;
    };

    /**
     * Add all modules to load-path
     */
    modLoad.addDir(__dirname + path.sep + 'system' + path.sep + 'core').then(function ($res) {

        //TODO: compare list of loaded modules ($res) with modules which are at least necessary to run SHPS
        var i = 0;
        var l = $res.length;
        var foundErr = false;
        while (i < l) {

            if (typeof $res[i] !== 'string') {

                if ($res[i].code === 'ENOENT') {

                    //send pollution event later
                }
                else {

                    process.stderr.write($res[i].what + ': ' + $res[i] + '\n');
                    process.stderr.write($res[i].stack + '\n');
                    foundErr = true;
                }
            }

            i++;
        }

        if (foundErr) {

            return Promise.reject('Not all SHPS modules could be loaded successfully!');
        }
        else {

            // For compatibility
            modLoad.addMeta('auth', require('SHPS4Node-auth'));
            modLoad.addMeta('cache', require('SHPS4Node-cache'));
            modLoad.addMeta('commandline', require('SHPS4Node-commandline'));
            modLoad.addMeta('cookie', require('SHPS4Node-cookie'));
            modLoad.addMeta('css', require('SHPS4Node-CSS'));
            modLoad.addMeta('dependency', require('SHPS4Node-dependency'));
            modLoad.addMeta('error', require('SHPS4Node-error'));
            modLoad.addMeta('file', require('SHPS4Node-file'));
            modLoad.addMeta('componentLibrary', require('SHPS4Node-frontend'));
            modLoad.addMeta('init', require('SHPS4Node-init'));
            modLoad.addMeta('language', require('SHPS4Node-language'));
            modLoad.addMeta('log', require('SHPS4Node-log'));
            modLoad.addMeta('make', require('SHPS4Node-make'));
            modLoad.addMeta('optimize', require('SHPS4Node-optimize'));
            modLoad.addMeta('parallel', require('SHPS4Node-parallel'));
            modLoad.addMeta('plugin', require('SHPS4Node-plugin'));
            modLoad.addMeta('sandbox', require('SHPS4Node-sandbox'));
            modLoad.addMeta('schedule', require('SHPS4Node-schedule'));
            modLoad.addMeta('session', require('SHPS4Node-session'));
            modLoad.addMeta('sql', require('SHPS4Node-SQL'));
            modLoad.addMeta('config', new (require('SHPS4Node-config'))(libs));

            modLoad.addMeta('dep', libs.dependency);
            modLoad.addMeta('coml', libs.commandline);
            modLoad.addMeta('cl', libs.componentLibrary);
            modLoad.addMeta('lang', libs.language);

            return Promise.resolve();
        }
    }, _errFun).then(function () {

        /**
         * Will start SHPS with exposed garbage collector
         */
        var app = function f_app($debug) {// I'm so childish for laughing about this  :D
            $debug = typeof $debug !== 'undefined' ? $debug : false;

            if (global.gc || $debug || __debug__) {// Running the script in a child process destroys the possibility to debug
                
                if (cluster.isMaster) {

                    libs.coml.cls();
                }

                libs.coml.writeWelcome();

                if ($debug) {

                    libs.main.setDebug($debug);
                }

                libs.main.init();
            }
            else {

                var cp = require('child_process');
                var param = ['--expose-gc'];

                param.push('./SHPS.js');
                var x = cp.spawn('node', param, { stdio: 'inherit' });
                libs.coml.write('Reconfiguring start parameters...');
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
                libs.coml.write('Starting wait for debugger...');
                setTimeout(function () {

                    app(debug);
                }, 1000);
            }
            else {

                process.nextTick(app);
            }
        }
    }, _errFun);
})();
