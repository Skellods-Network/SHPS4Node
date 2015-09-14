'use strict';

/**
 * SHPS Performance and Stability Module
 * Lazy-caches all SHPS modules
 * Needs ES6-Proxy to work
 * //TODO: Just load all libs non-lazy if ES6-Proxy is not available
 * 
 * Remark: I am getting way too many require-loops
 * __defineGetter__ will define a GLOBAL GETTER! This is bad. Variables will be fetched from a random module in any other module.
 * So let's clean this mess up with a nice and generic loader module (see below)
 */
(function f_perf() {
    
    var me = module.exports;
    
    var fs = require('fs');
    var path = require('path');
    
    var _commonLibs = {};
    var _libs = {};
    
    var _excludeFiles = [
    
        'perf.js'
    ];
    
    // Add some often needed stuff
    var _alias = {

        gLog: function () {

            return _libs.log.newLog();
        },
        dep: 'dependency',
        coml: 'commandline',
        cl: 'componentLibrary',
    };
    
    var corePath = path.dirname(require.main.filename) + path.sep + 'system' + path.sep + 'core' + path.sep;
    
    // Lazy loader
    var libGetter = function (target, name, receiver) {
        
        // Don't give away private properties
        if (name.substr(0, 1) === '_' && name.length > 1) {
            
            return;
        }
        
        if (!_commonLibs[name]) {
            
            if (!_commonLibs['_' + name]) {
                
                if (!_alias[name]) {

                    return;
                }
                else {
                    
                    if (typeof _alias[name] === 'function') {

                        _commonLibs[name] = _alias[name]();
                    }
                    else {

                        _commonLibs[name] = me.commonLibs[_alias[name]];
                    }

                    return _commonLibs[name];
                }
            }

            _commonLibs[name] = require(corePath + _commonLibs['_' + name]);
        }
        
        return _commonLibs[name];
    };
    
    if (!Proxy.create) {
        
        me.commonLibs = new Proxy(_commonLibs, {
            
            get: libGetter,
        });
    }
    else {
        
        me.commonLibs = Proxy.create({
            
            get: libGetter,
        });
    }
    
    _libs = me.commonLibs;
    
    // Add all SHPS modules dynamically
    var coreModules = fs.readdirSync(corePath);
    var i = 0;
    var l = coreModules.length;
    var j = 0;
    var efL = _excludeFiles.length;
    var foundExclude = false;
    while (i < l) {
        
        if (path.extname(coreModules[i]) !== '.js') {
            
            i++;
            continue;
        }
        
        j = 0;
        foundExclude = false;
        while (j < efL) {
            
            if (coreModules[i] === _excludeFiles[j]) {
                
                foundExclude = true;
                break;
            }
            
            j++;
        }
        
        if (!foundExclude) {
            
            _commonLibs['_' + path.basename(coreModules[i], '.js')] = coreModules[i];
        }
        
        i++;
    }
})();
