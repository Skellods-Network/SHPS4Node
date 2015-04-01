'use strict';

setTimeout(function () {

    /** SHPS modules */
    var main = require('./system/core/main');
    var log = require('./system/core/log.js');
    
    
    /** START */
    if (global.gc) {
        
        log.cls();
        log.writeWelcome();
        
        main.init();
    }
    else {
        
        // TODO: automatically call SHPS with GC
        log.cls();
        log.writeWelcome();
        
        main.init();
    }

}, 1000);

