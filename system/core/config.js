'use strict';

var me = module.exports;

var fs = require('fs');

var async = require('vasync');
var q = require('q');

var helper = require('./helper.js');
var SFFM = require('./SFFM.js');
var dInit = require('./default.js');
var _log = null;
__defineGetter__('log', function () {
    
    if (!_log) {
        
        _log = require('./log.js');
    }
    
    return _log;
});

var _main = null;
__defineGetter__('main', function () {
    
    if (!_main) {
        
        _main = require('./main.js');
    }
    
    return _main;
});

var _scheduler = null;
__defineGetter__('scheduler', function () {
    
    if (!_scheduler) {
        
        _scheduler = require('./schedule.js');
    }
    
    return _scheduler
});

var mp = {
    self: this
};


var config = mp.config = {};
var master = mp.master = {};
var domain = mp.domain = [];


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_log_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * Get setting from config file
 *
 * @param $group
 * @param $key
 * @param $domain
 * @return void|string|int|boolean
 */
var _getHPConfig 
= me.getHPConfig = function ($group, $key, $domain) {
    
    if (typeof $domain !== 'undefined' &&
        typeof domain[$domain] !== 'undefined' &&
        typeof domain[$domain][$group] !== 'undefined' &&
        typeof domain[$domain][$group][$key] !== 'undefined') {
        
        return domain[$domain][$group][$key].value;
    }
    
    if (typeof master[$group] !== 'undefined') {
        
        if (typeof $key !== 'undefined' &&
            (typeof master[$group] !== 'undefined' && typeof master[$group][$key] !== 'undefined')) {

            return master[$group][$key].value;
        }
    }
    else {
        
        if (typeof master['config'] !== 'undefined' && typeof master['config'][$group] !== 'undefined') {

            return master['config'][$group].value;
        }
    }
    
    return;
};

/**
 * Read all config files and store them
 *
 * @todo: if no config available: ask user to input config step-by-step and write config file
 * @return
 *  Promise()
 */
var _readConfig 
= me.readConfig = function f_main_readConfig() {
    
    log.write('\nDetecting configurations...');
    
    var defer = q.defer();
    var dir;
    if (!(dir = main.getDir(SHPS_DIR_CONFIGS))) {
        
        defer.reject(new Error("Could not retrive config directory!"));

        return defer.promise;
    }
    
    var masterFound = false;
    fs.readdir(dir, function ($err, $files) {
        
        if ($err) {
            
            log.error($err);
        }
        
        async.forEachParallel({
            
            'inputs': $files,
            'func': function ($file, $callback) {
                
                var validFile = true;
                async.pipeline({
                    funcs: [
                        function ($_p1, $cb) {
                            
                            fs.stat(dir + $file, function ($err, $stat) {
                                
                                if ($stat && $stat.isDirectory()) {
                                    
                                    scheduler.sendSignal('onPollution', dir, 'config', $file);
                                    validFile = false;
                                }
                                else {
                                    
                                    if ($file.substring($file.length - 5) != '.json') {
                                        
                                        scheduler.sendSignal('onFilePollution', dir, 'config', $file);
                                        validFile = false;
                                    }
                                }
                                
                                $cb();
                            });
                        },

                        function ($_p1, $cb) {
                            
                            if (validFile === false) {
                                
                                process.nextTick($cb);
                                return;
                            }
                            
                            fs.readFile(dir + $file, 'utf8', function ($err, $data) {
                                
                                if ($err) {
                                    
                                    log.error($err);
                                }
                                
                                log.write('Config file found: ' + $file);
                                
                                var c = '';
                                var status = false;
                                try {
                                    
                                    c = JSON.parse($data);
                                    switch (c.configHeader.type) {

                                        case 'master': {
                                            
                                            log.write('Master file was ' + 'loaded successfully'.green);
                                            master = c;
                                            masterFound = true;
                                            break;
                                        }

                                        case 'hp': {
                                            
                                            var cName = helper.SHPS_domain(c.generalConfig.URL.value, true).host;
                                            config[cName] = c;
                                            log.write('Config file `' + $file + '` was ' + ('loaded successfully (' + cName + ')').green);
                                            break;
                                        }
                                    }
                                    
                                    status = true;
                                }
                                catch ($e) {
                                    
                                    log.write('Config file `' + $file + '` was ' + 'invalid'.red.bold + '! ' + 'SKIPPED'.red.bold);
                                    log.write($e.toString().red.bold);
                                }
                                finally {
                                    
                                    scheduler.sendSignal('onConfigLoaded', $file, status, c);
                                    $cb();
                                }
                            });
                        }
                    ]
                }, $callback);
            }
        }, function ($err) {
            
            if (!masterFound) {
                
                master = dInit.master;
                scheduler.sendSignal('onFileNotFound', 'master.json', dir, 'Default configuration loaded!');
            }
            
            if (Object.keys(config).length == 0) {
                
                scheduler.sendSignal('onFileNotFound', '*.config.json', dir, 'Nothing will be served without configuration files!');
            }
            
            defer.resolve();
        });
    });
    
    return defer.promise;
};

/**
 * Get whole configuration of certain homepage
 * 
 * @param string $uri
 * @return array|null
 */
var _getConfig 
= me.getConfig = function ($uri) {
    
    return config[$uri];
};
