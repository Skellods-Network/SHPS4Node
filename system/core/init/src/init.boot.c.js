'use strict';

var libs = require('node-mod-load').libs;
var q = require('q');
var async = require('vasync');

require('../interface/init.h.js').prototype.boot = function () {

    var d = q.defer();

    process.title = 'SHPS Terminal';
    console.log('Please wait while I boot SHPS... it won\'t take long ;)');

    var keys = Object.keys(libs);
    var i = 0;
    var l = keys.length;
    var proms = [];
    while (i < l) {

        if (libs[keys[i]].init) {

            proms.push(libs[keys[i]].init());
        }

        i++;
    }

    Promise.all(proms).then($res => {

        async.pipeline({

            'funcs': [

                function f_init_terminal($_p1, $_p2) {

                    // resolver will receive list of loaded modules
                    libs.coml.init('SHPS'.cyan + '> '.bold).then(function () {

                        $_p2();
                    }, $_p2);
                }
                , function f_init_checkUpdate($_p1, $_p2) { libs.main.checkUpdate().done($_p2, $_p2); }
                , function f_init_checkFS($_p1, $_p2) { libs.main.checkFS().done($_p2, $_p2); }
                , function f_init_readConfig($_p1, $_p2) { libs.config.readConfig().done($_p2, $_p2); }
                , function f_init_loadPlugins($_p1, $_p2) { libs.plugin.loadPluginList().then($_p2, $_p2); }
                , function f_init_parallelize($_p1, $_p2) {

                    var wc = libs.config.getHPConfig('config', 'workers');
                    if (wc > 0 || wc === -1) {

                        libs.parallel.handle().done($_p2, $_p2);
                    }
                    else {

                        $_p2();
                    }
                }
                , function f_init_listen($_p1, $_p2) {

                    if (libs.parallel.work()) {

                        libs.main.listen();
                    }

                    process.nextTick($_p2);
                }
                , function f_init_event($_p1, $_p2) {

                    libs.coml.write('');
                    process.on('exit', function ($code) {

                        libs.main.killAllServers();
                    });

                    libs.schedule.sendSignal('onMainInit', $_p1);
                    process.nextTick($_p2);
                }
            ]
        }, function f_init_done($err, $res) {

            if ($err) {

                console.error('\nCould not fully initialize SHPS!\nError: ' + $err);
                d.reject($err);
            }
            else {

                libs.coml.write('\nI\'m done here! SHPS at your service - what can I do for you?\n'.bold);
                d.resolve();
            }
        });
    }, d.reject);
    
    return d.promise;
};
