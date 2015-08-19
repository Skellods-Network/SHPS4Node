'use strict';

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

GLOBAL.SHPS_ERROR_CODE_EXECUTION = 'An error occurred while executing the script! Activate debug mode to receive a more detailed error message!';
GLOBAL.SHPS_ERROR_UNKNOWN = 'An unknown error occurred! Activate debug mode to receive a more detailed error message!';


process.on('uncaughtException', function ($err) {
        
    var str = 'Caught uncaught exception: ' + $err;
    try {
            
        log.writeError(str, true);
    }
    catch ($e) {
            
        log.writeError(str + '\n' + $e, false);
    }
});
