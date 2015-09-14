'use strict';

var me = module.exports;

var q = require('q');
var vm = require('vm');

var libs = require('./perf.js').commonLibs;

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
    
    return libs.helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newSandbox 
= me.newSandbox = function f_sandbox_newSandbox($requestState) {
    
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
            
            all: function f_sandbox_newSandbox_addFeature_all() {
                
                this.allBase();
                this.allSHPS();
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
            
            allSHPS: function f_sandbox_newSandbox_addFeature_allSHPS() {
                
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
                
                sb.require = require;//TODO: PROXY!!! And check on e.g. fp so that files cannot be read unautherized
                rebuildContext = true;
            },
            
            baseProcess: function f_sandbox_newSandbox_addFeature_baseProcess() {
                
                sb.process = process;
                rebuildContext = true;
            },
            
            shpsAuth: function f_sandbox_newSandbox_addFeature_shpsAuth() {
                
                sb.auth = new libs.auth.focus($requestState);
                rebuildContext = true;
            },
            
            shpsComponentLibrary: function f_sandbox_newSandbox_addFeature_shpsComponentLibrary() {

                sb.cl = libs.cl.newCL($requestState);
                rebuildContext = true;
            },
            
            shpsLanguage: function f_sandbox_newSandbox_addFeature_shpsLanguage() {

                sb.lang = libs.language.newLang($requestState);
                rebuildContext = true;
            },

            shpsLog: function f_sandbox_newSandbox_addFeature_shpsLog() {
                
                sb.log = libs.log.newLog($requestState);
                rebuildContext = true;
            },
            
            shpsParameters: function f_sandbox_newSandbox_addFeature_shpsParameters() {

                sb.GET = $requestState.GET;
                sb.POST = $requestState.POST;
                sb.SESSION = $requestState.SESSION;

                // PHP compat
                sb._GET = sb.GET;
                sb._POST = sb.POST;
                sb._SESSION = sb.SESSION;

                sb.$_GET = sb.GET;
                sb.$_POST = sb.POST;
                sb.$_SESSION = sb.SESSION;
            },
            
            shpsRequest: function f_sandbox_newSandbox_addFeature_shpsRequest() {
                
                sb.request = $requestState.request;
                rebuildContext = true;
            },
            
            shpsResponse: function f_sandbox_newSandbox_addFeature_shpsResponse() {
                
                sb.response = $requestState.response;
                rebuildContext = true;
            },

            shpsSFFM: function f_sandbox_newSandbox_addFeature_shpsSFFM() {
                
                sb.SFFM = libs.SFFM;
                rebuildContext = true;
            },

            shpsSQL: function f_sandbox_newSandbox_addFeature_shpsSQL() {
                
                sb.sql = new libs.sql.focus($requestState);
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
        
        /**
         * @result
         *   Promise()
         */
        var _flushContext =
        this.flushContext = function f_sandbox_newSandbox_flushContext() {
            
            var defer = q.defer();
            if (rebuildContext) {
                
                libs.plugin.callEvent($requestState, 'onRebuildSandbox', $requestState, sb).done(function () {
                    
                    context = vm.createContext(sb);
                    rebuildContext = false;
                    defer.resolve();
                }, defer.reject);
            }
            else {
                
                defer.resolve();
            }

            return defer.promise;
        };
        
        /**
         * @result
         *   Promise(mixed)
         */
        var _run =
        this.run = function f_sandbox_newSandbox_run($script, $timeout) {
            
            var defer = q.defer();
            var options = {

                displayErrors: true
            };

            if (typeof $timeout !== 'undefined') {
                
                options.timeout = $timeout;
            }
            
            _flushContext().done(function () {
                
                defer.resolve($script.script.runInContext(context, options));
            }, defer.reject);

            return defer.promise;
        };
    });
};

var _newScript 
= me.newScript = function f_sandbox_newScript($code) {

    return {

        script: new vm.Script($code, { displayErrors: false })
    };
};
