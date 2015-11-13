'use strict';

(function f_log() {

    var me = module.exports;
    
    var colors = require('colors');
    var util = require('util');
    var cluster = require('cluster');
    var readline = require('readline');
    var log = require('log');
    
    var libs = require('node-mod-load').libs;
    
    var mp = {
        self: this
    };
    

    GLOBAL.SHPS_LOG_LVL_DEBUG = 7;
    GLOBAL.SHPS_LOG_LVL_INFO = 6;
    GLOBAL.SHPS_LOG_LVL_NOTICE = 5;
    GLOBAL.SHPS_LOG_LVL_WARNING = 4;
    GLOBAL.SHPS_LOG_LVL_ERROR = 3;
    GLOBAL.SHPS_LOG_LVL_CRITICAL = 2;
    GLOBAL.SHPS_LOG_LVL_ALERT = 1;
    GLOBAL.SHPS_LOG_LVL_EMERGENCY = 0;
    
    var _newLog 
    = me.newLog = function f_log_newLog($requestState) {
        
        if ($requestState) {

            if (!$requestState.cache.log) {
                
                $requestState.cache.log = new _Log($requestState);
            }

            return $requestState.cache.log;
        }
        else {

            return new _Log();
        }
    };
    
    var _Log 
    = me.Log = function c_log_Log($requestState) {
        
        /**
         * Write log entry directly to DB
         * 
         * @param $lvl string|integer
         * @param $str string
         */
        var _dbLog = function f_log_dbLog($lvl, $str) {
            
            if (!$requestState) {
                
                return;
            }
            
            try {
                
                libs.sql.newSQL('logging', $requestState).done(function ($sql) {
                    
                    $sql.openTable('log').insert({
                        
                        time: (new Date() / 1000) | 0,
                        type: $lvl,
                        content: $str,
                    }).done($sql.free, $sql.free);
                }, $e => {
                    libs.coml.writeError('Could not write dbLog to database: ' + $e);
                });
            }
            catch ($e) {
                
                // Weeeeell. This might be serious. I should really implement a debug argument which prints out all dbLogs to the console.
                libs.coml.writeError('Could not write dbLog to database: ' + $e.toString(), false);
            }
        };
        
        /**
         * Write debug
         * 
         * @param string $str
         */
        var _debug =
        this.debug = function ($str) {

            libs.coml.writeDebug($str);
            _dbLog(SHPS_LOG_LVL_DEBUG, $str);
        };

        /**
         * Write info
         *
         * @param string $str
         */
        var _info 
        = this.info = function ($str) {
            
            libs.coml.writeNote($str);
            _dbLog(SHPS_LOG_LVL_INFO, $str);
        };
        
        /**
         * Write notice
         *
         * @param string $str
         */
        var _notice
        = this.notice = function ($str) {
            
            libs.coml.writeNote($str);
            _dbLog(SHPS_LOG_LVL_NOTICE, $str);
        };
        
        /**
         * Write emergency
         *
         * @param string $str
         */
        var _emergency 
        = this.emergency = function ($str) {
            
            libs.coml.writeEmergency($str);
            _dbLog(SHPS_LOG_LVL_EMERGENCY, $str);
        };
        
        /**
         * Write audit info
         *
         * @param string $str
         */
        var _alert 
        = this.alert = function ($str) {
            
            libs.coml.writeAlert($str);
            _dbLog(SHPS_LOG_LVL_ALERT, $str);
        };
        
        /**
         * Write warning
         *
         * @param string $str
         */
        var _warning 
        = this.warning = function f_log_warning($str) {
            
            libs.coml.writeWarning($str);
            _dbLog(SHPS_LOG_LVL_WARNING, $str);
        };
        
        /**
         * Write error
         *
         * @param string $str
         */
        var _error 
        = this.error = function ($str) {
            
            libs.coml.writeError($str);
            _dbLog(SHPS_LOG_LVL_ERROR, $str);
        };
        
        /**
         * Write fatal
         *
         * @param string $str
         */
        var _critical 
        = this.critical = function ($str) {
            
            libs.coml.writeCritical($str);
            _dbLog(SHPS_LOG_LVL_CRITICAL, $str);
        };
    };
})();
