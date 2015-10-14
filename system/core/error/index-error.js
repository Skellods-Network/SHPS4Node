'use strict';

(function f_error() {

    var libs = require('node-mod-load').libs;
    
    GLOBAL.SHPS_ERROR_CODE_EXECUTION = 'An error occurred while executing the script! Activate debug mode to receive a more detailed error message!';
    GLOBAL.SHPS_ERROR_UNKNOWN = 'An unknown error occurred! Activate debug mode to receive a more detailed error message!';
    
    
    //TODO: analyze stack and try to stabilize the system
    //      if stabilization not possible, stabilize by closing down according service (e.g. content or request)
    process.on('uncaughtException', function ($err) {
        
        var str = 'Caught uncaught exception: ' + $err;
        
        try {
            
            libs.coml.writeError(str + '\n' + $err.stack, true);
        }
        catch ($e) {
            
            console.error(str + '\n' + $e, false);
            //process.exit();
        }
    });
})();
