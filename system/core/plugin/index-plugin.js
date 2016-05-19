'use strict';

var me = module.exports;

var fs = require('fs');
var path = require('path');
var q = require('q');
var async = require('vasync');

var nml = require('node-mod-load');
var libs = nml.libs;
var promDef = require('promise-defer');

var _loadable = {};
var _plugins = {};
var mp = {
    self: this
};


GLOBAL.SHPS_PLUGIN_UNINSTALLED = 1;
GLOBAL.SHPS_PLUGIN_INACTIVE = 2;
GLOBAL.SHPS_PLUGIN_ACTIVE = 3;


/**
 * Load all plugins
 * 
 * @return Promise()
 */
var _loadPluginList 
= me.loadPluginList = function f_plugin_loadPlugins() {
    
    var task = libs.coml.newTask('Detecting Plugins');
    var taskResult = TASK_RESULT_OK;

    var defer = promDef();
    var dir = libs.main.getDir(SHPS_DIR_PLUGINS);
    fs.readdir(dir, function ($err, $files) {
        
        if ($err) {
            
            task.end(TASK_RESULT_ERROR);
            defer.reject(new Error($err));
            return;
        }

        var i = 0;
        var l = $files.length;
        var proms = [];
        while (i < l) {
            
            let file = $files[i];
            let lp = promDef();
            proms.push(lp.promise);
            fs.stat(dir + file, function ($err, $stat) {
    
                if ($err) {
                    
                    task.end(TASK_RESULT_ERROR);
                    lp.reject(new Error($err));
                    return;
                }

                if ($stat.isFile()) {

                    libs.schedule.sendSignal('onFilePollution', dir, 'plugin', file);
                    lp.resolve();
                    return;
                }

                nml.getPackageInfo(dir + file)
                .then(function ($config) {
                                
                    task.interim(TASK_RESULT_OK, 'Plugin found: ' + $config.name);
                    _loadable[$config.name] = dir + file;
                    
                    // TEMPORARY
                    // This section is to keep plugins working as they did before. It has to be removed as soon as the rest of the plugin manager is implemented
                    try {

                        _plugins[$config.name] = require(dir + file);
                        task.interim(TASK_RESULT_OK, 'Plugin loaded: ' + $config.name);
                        if (_plugins[$config.name].onLoad) {

                            _plugins[$config.name].onLoad();
                        }
                    }
                    catch ($e) {

                        task.interim(TASK_RESULT_ERROR, 'Plugin could not be loaded: ' + $config.name);
                        libs.coml.writeError($e);
                        taskResult = TASK_RESULT_WARNING;
                    }
                    //\\ TEMPORARY
                    finally {

                        lp.resolve();
                    }
                })
                .catch(function ($err) {
                                
                    libs.schedule.sendSignal('onPollution', dir, 'plugin', file);
                    lp.resolve();
                });
            });
            
            i++;
        }

        Promise.all(proms).then(function ($v) {
            
            defer.resolve();
            task.end(taskResult);
        }, function ($v) {
            
            defer.reject($v);
            task.end(TASK_RESULT_ERROR);
        });
        
    });

    return defer.promise;
};

var _getLoadablePlugins 
= me.getLoadablePlugins = function f_plugin_getLoadablePlugins() {
    
    return Object.keys(_loadable);
};

var _getLoadedPlugins 
= me.getLoadedPlugins = function f_plugin_getLoadedPlugins() {
    
    return Object.keys(_plugins);
};

/**
 * Returns if plugin is active or not
 * 
 * @param $requestState Object
 * @param $plugin string
 * @result Promise({isActive: boolean, name: string})
 */
var _isActive 
= me.isActive = function f_plugin_isActive($requestState, $plugin) {
    
    var defer = q.defer();
    if (typeof $requestState === 'undefined' || $requestState.dummy) {

        defer.resolve({
        
            isActive: true,
            name: $plugin,
        });
    }
    else {

        libs.sql.newSQL('default', $requestState).done(function ($sql) {
            
            var tblPln = $sql.openTable('plugin');
            
            $sql.query()
            .get([tblPln.col('status')])
            .fulfilling()
            .eq(tblPln.col('name'), $plugin)
            .execute()
            .done(function ($rows) {
                
                $sql.free();
                if ($rows.length <= 0) {
                    
                    defer.resolve({
                        
                        isActive: false,
                        name: $plugin,
                    });

                    return;
                }
                
                defer.resolve({
                    
                    isActive: $rows[0].status === SHPS_PLUGIN_ACTIVE,
                    name: $plugin,
                });
            }, defer.reject);
        }, defer.reject);
    }

    return defer.promise;
};

var _pluginExists 
= me.pluginExists = function f_plugin_pluginExists($plugin) {
    
    return typeof _plugins[$plugin] !== 'undefined';
};

/**
 * DUPLEX EVENT
 * -> Get sth back :D
 */
var _callPluginEvent 
= me.callPluginEvent = function ($requestState, $event, $plugin /*, ...*/) {
    
    var args = arguments
    return _isActive($requestState, $plugin).then(function ($pInfo) {
        
        if (!$pInfo.isActive || typeof _plugins[$plugin] === 'undefined') {
            /*
            var tmp = q.defer();
            $requestState.responseBody = JSON.stringify({
                
                status: 'error',
                message: 'Plugin is not active!'
            });

            tmp.resolve($requestState.responseBody);
            return tmp.promise;
             */
            var tmp = q.defer();
            tmp.reject('Plugin is not active!');
            return tmp.promise;
        }
        
        var argList = [];
        var i = 3;
        var l = args.length;
        while (i < l) {

            argList.push(args[i]);
            i++;
        }
        
        if (!_plugins[$plugin][$event]) {

            return;
        }

        return _plugins[$plugin][$event].apply(_plugins[$plugin], argList);
    });
};

var _callEvent 
= me.callEvent = function ($requestState, $event /*, ...*/) {
    
    var i = 2;
    var l = arguments.length;
    var keys = Object.keys(_plugins);
    var defer = q.defer();
    var args = [];
    while (i < l) {
    
        args.push(arguments[i]);
        i++;
    }

    async.forEachParallel({
    
        inputs: keys,
        func: function ($arg, $cb) {

            _isActive($requestState, $arg).done(function ($pInfo) {
                
                var needCB = true;
                if ($pInfo.isActive) {
                    
                    if (_plugins[$pInfo.name][$event]) {
                        
                        var res = _plugins[$pInfo.name][$event].apply(_plugins[$pInfo.name], args);
                        if (q.isPromise(res)) {
                            
                            needCB = false;
                            res.done($cb, $cb);
                        }
                    }
                }
                
                if (needCB) {

                    $cb();
                }
            });
        }

    }, function ($err, $res) {
        
        if ($err) {

            defer.reject(new Error($err));
        }
        else {

            defer.resolve();
        }
    });

    return defer.promise;
};

var _callCommand 
= me.callCommand = function ($comm) {

    //TODO
    return false;
};
