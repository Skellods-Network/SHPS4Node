'use strict';

var me = module.exports;

var fs = require('fs');
var async = require('vasync');
var q = require('q');

var libs = require('./perf.js').commonLibs;

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
    
    return libs.helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
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
 * Read JSON config file
 * 
 * @param string $file
 * @result
 *   Promise({})
 */
var _readFile 
= me.readFile = function f_config_readFile($file) {

    var defer = q.defer();

    fs.readFile($file, 'utf8', function ($err, $data) {
        
        if ($err) {
            
            defer.reject($err);
        }
        else {
            
            try {

                var config = JSON.parse($data);
                defer.resolve(config);
            }
            catch ($e) {

                defer.reject($e);
            }
        }
    });

    return defer.promise;
};

/**
 * Read all config files and store them
 *
 * @todo: if no config available: ask user to input config step-by-step and write config file
 * @return
 *  Promise()
 */
var _readConfig 
= me.readConfig = function f_config_readConfig() {
    
    libs.gLog.write('\nDetecting configurations...');
    
    var defer = q.defer();
    var dir;
    if (!(dir = libs.main.getDir(SHPS_DIR_CONFIGS))) {
        
        defer.reject(new Error("Could not retrive config directory!"));

        return defer.promise;
    }
    
    var masterFound = false;
    fs.readdir(dir, function ($err, $files) {
        
        if ($err) {
            
            libs.gLog.error($err);
        }
        
        async.forEachParallel({
            
            'inputs': $files,
            'func': function ($file, $callback) {
                
                fs.stat(dir + $file, function ($err, $stat) {
                    
                    if ($file.substring($file.length - 5) != '.json') {
                            
                        libs.schedule.sendSignal('onFilePollution', dir, 'config', $file);
                        $callback();
                    }
                    else if ($stat && !$stat.isDirectory()) {
                        
                        libs.gLog.write('Config file found: ' + $file);
                        _readFile(dir + $file).done(function ($config) {
                            
                            if (!$config.configHeader) {

                                $config.configHeader = {};
                            }
                            
                            if (!$config.configHeader.type) {

                                $config.configHeader.type = 'unknown';
                            }
                            
                            var status = true;
                            switch ($config.configHeader.type) {

                                case 'master': {
                                    
                                    libs.gLog.write('Master file was ' + 'loaded successfully'.green);
                                    master = $config;
                                    masterFound = true;
                                    break;
                                }

                                case 'hp': {
                                    
                                    //TODO: join result with default config (template)
                                    var cName = libs.helper.SHPS_domain($config.generalConfig.URL.value, true).host;
                                    config[cName] = $config;
                                    libs.gLog.write('Config file `' + $file + '` was ' + ('loaded successfully (' + cName + ')').green);
                                    break;
                                }

                                default: {

                                    libs.gLog.write('Config file `' + $file + '` is of ' + ('UNKNOWN TYPE').yellow);
                                    status = false;
                                }
                            }

                            libs.schedule.sendSignal('onConfigLoaded', $file, status, $config);

                            $callback();
                        }, function ($err) {
                                                
                            libs.gLog.write('Config file `' + $file + '` was ' + 'invalid'.red.bold + '! ' + 'SKIPPED'.red.bold);
                            libs.gLog.write($err.toString().red.bold);
                            
                            libs.schedule.sendSignal('onConfigLoaded', $file, false, null);

                            $callback($err);     
                        });
                    }
                    else {

                        $callback();
                    }
                });
            }
        }, function ($err) {
            
            if (!masterFound) {
                
                master = libs.default.master;
                libs.schedule.sendSignal('onFileNotFound', 'master.json', dir, 'Default configuration loaded!');
            }
            
            if (Object.keys(config).length == 0) {
                
                libs.schedule.sendSignal('onFileNotFound', '*.config.json', dir, 'Nothing will be served without configuration files!');
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
