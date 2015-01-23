'use strict';

/** SHPS modules */
var main = require('./system/core/main');
var log = require('./system/core/log.js');


/** START */
log.cls();
log.writeWelcome();
main.init();
