'use strict';

var me = module.exports;

var fs = require('fs');
var q = require('q');

var log = require('./log.js');
var main = require('./main.js');
var schedule = require('./schedule.js');
var helper = require('./helper.js');

var _plugins = {};
var self = this;


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
                    
                    log.write('Plugin ' + pname + ' ' + 'encountered problems'.red);
                }
                
                schedule.sendSignal('onPluginLoaded', pname, loadOK);
            }
            
            i++;
        }
        
        defer.resolve();
    });

    return defer.promise;
};

var _pluginExists 
= me.pluginExists = function f_plugin_pluginExists($plugin) {
    
    // only if active!
    return typeof _plugins[$plugin] !== 'undefined';
};

var _callPluginEvent 
= me.callPluginEvent = function ($event, $plugin /*, ...*/) {
    
    // only if active!
    if (typeof _plugins[$plugin] === 'undefined') {
        
        var defer = q.defer();
        defer.resolve();
        return defer.promise;
    }
    
    var params = [];
    var i = 2;
    while (i < arguments.length) {
        
        params.push(arguments[i]);
        i++;
    }
    
    return _plugins[$plugin][$event].apply(_plugins[$plugin], params);
};

var _callEvent 
= me.callEvent = function ($event /*, ...*/) {
    
    var params = [];
    var i = 2;
    while (i < arguments.length) {
        
        params.push(arguments[i]);
        i++;
    }
    
    i = 0;
    var keys = Object.keys(_plugins);
    while (i < keys.length) {
        
        // only if active!
        _plugins[keys[i]][$event].apply(_plugins[keys[i]], params);
        i++;
    }
};
