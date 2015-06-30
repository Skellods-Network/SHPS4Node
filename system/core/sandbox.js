'use strict';

var me = module.exports;

var vm = require('vm');

var _auth = null;
__defineGetter__('auth', function () {
    
    if (!_auth) {
        
        _auth = require('./auth.js');
    }
    
    return _auth
});

var _helper = null;
__defineGetter__('helper', function () {
    
    if (!_helper) {
        
        _helper = require('./helper.js');
    }
    
    return _helper
});

var _lang = null;
__defineGetter__('lang', function () {
    
    if (!_lang) {
        
        _lang = require('./language.js');
    }
    
    return _lang
});

var _log = null;
__defineGetter__('log', function () {
    
    if (!_log) {
        
        _log = require('./log.js');
    }
    
    return _log;
});

var _cl = null;
__defineGetter__('complib', function () {
    
    if (!_cl) {
        
        _cl = require('./componentLibrary.js');
    }
    
    return _cl;
});

var SFFM = require('./SFFM.js');
var _sql = null;
__defineGetter__('sql', function () {
    
    if (!_sql) {
        
        _sql = require('./sql.js');
    }
    
    return _sql;
});

var mp = {
    self: this
};


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_sandbox_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newSandbox 
= me.newSandbox = function f_sandbox_newSandbox() {
    
    return new (function () {
        
        var sb = {};
        var context;
        var rebuildContext = true;
        
        var _getGlobals =
        this.getGlobals = function f_sandbox_getGlobals() {

            return sb;
        };

        var _addFeature =
        this.addFeature = {
            
            all: function f_sandbox_newSandbox_addFeature_all($requestState) {
                
                this.allBase();
                this.allSHPS($requestState);
            },
            
            allBase: function f_sandbox_newSandbox_addFeature_allBase() {
                
                var keys = Object.keys(this);
                var i = 0;
                var l = keys.length;
                while (i < l) {
                    
                    if (keys[i].substr(0, 4) === 'base') {
                        
                        this[keys[i]]();
                    }
                    
                    i++;
                }
            },
            
            allSHPS: function f_sandbox_newSandbox_addFeature_allSHPS($requestState) {
                
                var keys = Object.keys(this);
                var i = 0;
                var l = keys.length;
                while (i < l) {
                    
                    if (keys[i].substr(0, 4) === 'shps') {
                        
                        this[keys[i]]($requestState);
                    }
                    
                    i++;
                }
            },

            baseAsync: function f_sandbox_newSandbox_addFeature_baseAsync() {
                
                sb.setTimeout = setTimeout;
                sb.setInterval = setInterval;
                sb.setImmediate = setImmediate;
                sb.clearTimeout = clearTimeout;
                sb.clearInterval = clearInterval;
                sb.clearImmediate = clearImmediate;
                rebuildContext = true;
            },

            baseConsole: function f_sandbox_newSandbox_addFeature_baseConsole() {

                sb.console = console;
                rebuildContext = true;
            },
            
            baseGlobalConstants: function f_sandbox_newSandbox_addFeature_baseGlobalConstants() {
                
                var keys = Object.keys(GLOBAL);
                var i = 0;
                var l = keys.length;
                while (i < l) {
                    
                    if (keys[i].substr(0, 4) === 'SHPS') {
                        
                        sb[keys[i]] = GLOBAL[keys[i]];
                    }
                    
                    i++;
                }

                rebuildContext = true;
            },
            
            baseJS: function f_sandbox_newSandbox_addFeature_baseJS() {
                
                sb.Buffer = Buffer;
                sb.JSON = JSON;
                rebuildContext = true;
            },

            baseRequire: function f_sandbox_newSandbox_addFeature_baseRequire() {
                
                sb.require = require;
                rebuildContext = true;
            },
            
            baseProcess: function f_sandbox_newSandbox_addFeature_baseProcess() {
                
                sb.process = process;
                rebuildContext = true;
            },
            
            shpsAuth: function f_sandbox_newSandbox_addFeature_shpsAuth($requestState) {
                
                sb.auth = new auth.focus($requestState);
                rebuildContext = true;
            },
            
            shpsComponentLibrary: function f_sandbox_newSandbox_addFeature_shpsComponentLibrary($requestState) {

                sb.cl = complib.newCL($requestState);
                rebuildContext = true;
            },
            
            shpsLanguage: function f_sandbox_newSandbox_addFeature_shpsLanguage($requestState) {

                sb.lang = lang.focus($requestState);
                rebuildContext = true;
            },

            shpsLog: function f_sandbox_newSandbox_addFeature_shpsLog() {
                
                sb.log = log;
                rebuildContext = true;
            },
            
            shpsParameters: function f_sandbox_newSandbox_addFeature_shpsParameters($requestState) {

                sb.GET = $requestState.GET;
                sb.POST = $requestState.POST;
                sb.SESSION = $requestState.SESSION;
            },

            shpsSFFM: function f_sandbox_newSandbox_addFeature_shpsSFFM() {
                
                sb.SFFM = SFFM;
                rebuildContext = true;
            },

            shpsSQL: function f_sandbox_newSandbox_addFeature_shpsSQL($requestState) {
                
                sb.sql = new sql.focus($requestState);
                rebuildContext = true;
            },

            /* template:
            : function f_sandbox_newSandbox_addFeature_() {
                
                sb.process = process;
                rebuildContext = true;
            },
            */
        };
        
        var _reset =
        this.reset = function f_sandbox_newSandbox_reset() {
            
            sb = {};
            rebuildContext = true;
        };

        var _run =
        this.run = function f_sandbox_newSandbox_run($script, $timeout) {
            
            var options = {

                displayErrors: false
            };

            if (typeof $timeout !== 'undefined') {
                
                options.timeout = $timeout;
            }

            if (rebuildContext) {

                context = vm.createContext(sb);
            }

            return $script.script.runInContext(context, options);
        };
    });
};

var _newScript 
= me.newScript = function f_sandbox_newScript($code) {

    return {

        script: new vm.Script($code, { displayErrors: false })
    };
};
