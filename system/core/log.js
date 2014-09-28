//"use strict";  Not possible, see cls()

var colors = require('colors');
var util = require('util');

var me = module.exports;


/**
 * Clear screen
 *
 * @return module
 */
var cls 
= me.cls = function () {
    
    process.stdout.write('\033c');
    return me;
}

/**
 * Write error and try to handle it (restabilize SHPS)
 *
 * @param string $str
 */
var error 
= me.error = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    console.error($str.red.bold);
    throw $str;
};

/**
 * Write string top log without outputting it
 *
 * @param string $str
 * @return module
 */
var log 
= me.log = function ($str) {
    
    return me;
}

/**
 * Write string to console and to log
 *
 * @param string $str
 * @return module
 */
var write
= me.write = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';

    console.log($str);
    return me;
};

/**
 * Write welcome message
 *
 * @return module
 */
var writeWelcome
= me.writeWelcome = function () {
    
    write('\n WELCOME to a world of no worries.\n WELCOME to SHPS!\n'.underline.green.bold);
    write('You are currently running SHPS v' + SHPS_VERSION.cyan.bold + ', but you may call it ' + SHPS_INTERNAL_NAME.cyan.bold + '!');

    return me;
};

/**
 * Write info test
 *
 * @return module
 */
var writeInfo 
= me.writeInfo = function () {
    
    write('For help, please input `help` (or just `h` and press [TAB]) and hit [ENTER].\n');
    
    return me;
};
