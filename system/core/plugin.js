'use strict';

var me = module.exports;

var log = require('./log.js');
var main = require('./main.js');
var schedule = require('./schedule.js');

var fs = require('fs');


var _plugins = {};


var _loadPlugins 
= me.loadPlugins = function ($cb) {
    
    var dir = main.getDir('plugins');
    fs.readdir(dir, function ($err, $files) {
        
        log.write('\nDetecting plugins...');
        var i = 0;
        while (i < $files.length) {
            
            var file = $files[i];
            if (fs.statSync(dir + file).isFile()) {
                
                var pname = file.substring(0, file.length - 3);
                
                log.write('Plugin found: ' + pname);
                _plugins[pname] = require(dir + file);
                
                var loadOK = true;
                if (typeof _plugins[pname].onLoad !== 'undefined') {
                    
                    loadOK = _plugins[pname].onLoad();
                }
                
                if (loadOK) {
                    
                    log.write('Plugin `' + pname + '` was ' + 'loaded successfully'.green);
                }
                else {
                    
                    log.write('Plugin `' + pname + '` ' + 'encountered problems'.red);
                }
                
                schedule.sendSignal('onPluginLoaded', pname, loadOK);
            }
            
            i++;
        }
        
        if (typeof $cb !== 'undefined') {
            
            $cb();
        }
    });
};

var _callPluginEvent
= me.callPluginEvent = function ($event, $plugin /*, ...*/) {

    // only if active!
    var params = [];
    var i = 2;
    while (i < arguments.length) {

        params.push(arguments[i]);
        i++;
    }

    return _plugins[$plugin][$event].apply(_plugins[$plugin], params);
}

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
}