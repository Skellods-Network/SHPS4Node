'use strict';

var me = module.exports;

var fs = require('fs');
var q = require('q');
var async = require('vasync');

var libs = require('./perf.js').commonLibs;

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
var _loadPlugins 
= me.loadPlugins = function f_plugin_loadPlugins() {
    
    var defer = q.defer();
    var dir = libs.main.getDir(SHPS_DIR_PLUGINS);
    fs.readdir(dir, function ($err, $files) {
        
        libs.gLog.write('\nDetecting plugins...');
        
        if ($err) {

            defer.reject(new Error($err));
            return;
        }

        var i = 0;
        while (i < $files.length) {
            
            var file = $files[i];
            if (fs.statSync(dir + file).isFile()) {
                
                if (file.substring(file.length - 3) != '.js') {
                    
                    i++;
                    libs.schedule.sendSignal('onFilePollution', dir, 'plugin', file);
                    continue;
                }

                var pname = file.substring(0, file.length - 3);
                
                libs.gLog.write('Plugin found: ' + pname);
                _plugins[pname] = require(dir + file);
                
                var loadOK = true;
                if (typeof _plugins[pname].onLoad !== 'undefined') {
                    
                    loadOK = _plugins[pname].onLoad();
                }
                
                if (loadOK) {
                    
                    var piname = _plugins[pname].info.name;
                    libs.gLog.write('Plugin `' + piname + '` was ' + 'loaded successfully'.green);
                }
                else {
                    
                    libs.gLog.write('Plugin `' + pname + '` ' + 'encountered problems'.red);
                }
                
                libs.schedule.sendSignal('onPluginLoaded', pname, loadOK);
            }
            
            i++;
        }
        
        defer.resolve();
    });

    return defer.promise;
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
            
            var tmp = q.defer();
            $requestState.responseBody = JSON.stringify({
                
                status: 'error',
                message: 'Plugin is not active!'
            });

            tmp.resolve($requestState.responseBody);
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
