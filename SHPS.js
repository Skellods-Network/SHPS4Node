"use strict";

/** 3rd party modules */
var colors = require('colors');

/** SHPS modules */
var main = require('./system/core/main');
var log = require('./system/core/log.js');


/** START */
log
    .cls()
    .writeWelcome();
main.init();
