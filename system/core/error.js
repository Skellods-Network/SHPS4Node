'use strict';

(function f_error() {

    var libs = require('./perf.js').commonLibs;
    
    GLOBAL.SHPS_ERROR_CODE_EXECUTION = 'An error occurred while executing the script! Activate debug mode to receive a more detailed error message!';
    GLOBAL.SHPS_ERROR_UNKNOWN = 'An unknown error occurred! Activate debug mode to receive a more detailed error message!';
    
    
    process.on('uncaughtException', function ($err) {
        
        var str = 'Caught uncaught exception: ' + $err;
        
        try {
            
            libs.gLog.writeError(str, true);
        }
        catch ($e) {
            
            console.error(str + '\n' + $e, false);
            //process.exit();
        }
    });
})();
