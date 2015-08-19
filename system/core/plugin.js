'use strict';

var me = module.exports;

var fs = require('fs');
var q = require('q');

var __log = null;
__defineGetter__('_log', function () {
    
    if (!__log) {
        
        __log = require('./log.js');
    }
    
    return __log;
});

var __nLog = null;
__defineGetter__('log', function () {
    
    if (!__nLog) {
        
        __nLog = _log.newLog();
    }
    
    return __nLog;
});

var main = require('./main.js');
var schedule = require('./schedule.js');
var helper = require('./helper.js');
var sql = require('./sql.js');

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
    var dir = main.getDir(SHPS_DIR_PLUGINS);
    fs.readdir(dir, function ($err, $files) {
        
        log.write('\nDetecting plugins...');
        
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
                    schedule.sendSignal('onFilePollution', dir, 'plugin', file);
                    continue;
                }

                var pname = file.substring(0, file.length - 3);
                
                log.write('Plugin found: ' + pname);
                _plugins[pname] = require(dir + file);
                
                var loadOK = true;
                if (typeof _plugins[pname].onLoad !== 'undefined') {
                    
                    loadOK = _plugins[pname].onLoad();
                }
                
                if (loadOK) {
                    
                    var piname = _plugins[pname].info.name;
                    log.write('Plugin `' + piname + '` was ' + 'loaded successfully'.green);
                }
                else {
                    
                    log.write('Plugin `' + pname + '` ' + 'encountered problems'.red);
                }
                
                schedule.sendSignal('onPluginLoaded', pname, loadOK);
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
 * @result Promise(boolean)
 */
var _isActive 
= me.isActive = function f_plugin_isActive($requestState, $plugin) {
    
    var defer = q.defer();
    sql.newSQL('default', $requestState).done(function ($sql) {
        
        var tblPln = $sql.openTable('plugin');

        $sql.query()
            .get([tblPln.col('status')])
            .fulfilling()
            .eq(tblPln.col('name'), $plugin)
            .execute()
            .done(function ($rows) {
            
            $sql.free();
            if ($rows.length <= 0) {

                defer.resolve(false);
                return;
            }

            defer.resolve($rows[0].status === SHPS_PLUGIN_ACTIVE);
        }, defer.reject);
    }, defer.reject);

    return defer.promise;
};

var _pluginExists 
= me.pluginExists = function f_plugin_pluginExists($plugin) {
    
    return typeof _plugins[$plugin] !== 'undefined';
};

var _callPluginEvent 
= me.callPluginEvent = function ($requestState, $event, $plugin /*, ...*/) {
    
    var defer = q.defer();
    var args = arguments
    return _isActive($requestState, $plugin).then(function ($isActive) {
        
        if (!$isActive || typeof _plugins[$plugin] === 'undefined') {
            
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

        return _plugins[$plugin][$event].apply(_plugins[$plugin], argList);
    });
};

var _callEvent 
= me.callEvent = function ($requestState, $event /*, ...*/) {
    
    var i = 0;
    var keys = Object.keys(_plugins);
    while (i < keys.length) {
        
        _isActive($requestState, keys[i]).done(function ($isActive) {
        
            if ($isActive) {

                _plugins[keys[i]][$event].apply(_plugins[keys[i]], arguments.slice(2));
            }
        });
        
        i++;
    }
};

var _callCommand 
= me.callCommand = function ($comm) {

    //TODO
    return false;
};
