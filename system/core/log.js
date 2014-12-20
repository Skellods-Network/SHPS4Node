//"use strict";  Not possible, see cls()

var me = module.exports;

var colors = require('colors');
var util = require('util');

var schedule = require('./schedule.js');


/**
 * Level of logging
 * Possible values are:
 * 0 - everything
 * 1 - smart (only log errors and fatals, but include last X info/trace/warning entries)
 * 2 - trace (and up)
 * 3 - warning (and up)
 * 4 - error (and up)
 * 5 - fatal
 *
 * @var integer
 */
var level = 1;

/**
 * Max number of info/trace/error entries to include with smart logging
 *
 * @var integer
 */
var smartTraceLimit = 10;

/**
 * Length of smart trace list
 *
 * @var integer
 */
var traceLength = 0;

/**
 * Last X info/trace/error entries
 *
 * @var array of object(level/message)
 */
var trace = {first:null, last:null};


/**
 * Add entry to trace
 *
 * @param string $level
 * @param string $message
 */
var addToTrace = function ($level, $message) {
    return; //NOT IMPLEMENTED YET
    var nextEntry = { next: null, level: $level, message: $message };
    if (first == null) {
        
        first = nextEntry;
        last = first;
        traceLength = 1;
    }
    else {
        
        last.next = nextEntry;
        last = last.next;
        
        if (traceLength >= smartTraceLimit) {
            
            first = first.next;
        }
        else {
            
            traceLength++;
        }
    }
};

/**
 * Serialize the complete trace to JSON format
 *
 * @return string
 */
var traceToJSON = function () {
    
    var elem = first;
    var result = []
    var i = traceLength - 1;
    while (elem != null) {
        
        result[i] = { level: elem.level, message: elem.message };
        elem = elem.next;
        i--;
    }
    
    return result;
};

/**
 * Clear screen
 *
 * @return module
 */
var _cls 
= me.cls = function () {
    
    process.stdout.write('\033c');
    return me;
};

/**
 * Write to log
 *
 * @param integer $level
 * @param string $str
 */
var _log = function ($level, $str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    if ((level == 1 && $level > 3) || (level != 1 && level <= $level)) {
        
        console.error(colors.red(colors.bold($str)));
        if (level == 1) {
            
            schedule.sendSignal('SHPSError', $level, $str, trace);
        }
        else {
            
            schedule.sendSignal('SHPSError', $level, $str);
        }
    }
    
    var strLevel = 'UNKNOWN';
    switch ($level) {

        case 0: strLevel = 'INFO'; break;
        case 2: strLevel = 'TRACE'; break;
        case 3: strLevel = 'WARNING'; break;
        case 4: strLevel = 'ERROR'; break;
        case 5: strLevel = 'FATAL'; break;
    }
    
    addToTrace(strLevel, $str);
};

/**
 * Write error
 *
 * @param string $str
 * @return module
 */
var error 
= me.error = function ($str) {

    _log(4, $str);
    return me;
};

/**
 * Write fatal
 *
 * @param string $str
 * @return module
 */
var fatal
= me.fatal = function ($str) {

    _log(5, $str);
    return me;
};


/**
 * Write string top log without outputting it
 *
 * @param string $str
 * @return module
 */
var log 
= me.log = function ($str) {
    
    _log(2, $str);
    return me;
};

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
    log($str);

    return me;
};

/**
 * Write warning to console and to log
 *
 * @param string $str
 * @return module
 */
var writeWarning 
= me.writeWarning = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    console.log(('WARNING: ' + $str).yellow.bold);
    _log(3, $str);

    return me;
};

/**
 * Write error to console and to log
 *
 * @param string $str
 * @return module
 */
var writeError
= me.writeError = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    console.log(('ERROR: ' + $str).red.bold);
    _log(4, $str);
    
    return me;
};

/**
 * Write fatal error to console and to log
 *
 * @param string $str
 * @return module
 */
var writeFatal
= me.writeFatal = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    console.log(('FATAL ERROR: ' + $str).red.bold);
    _log(5, $str);
    
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
    
    var build = SHPS_BUILD;
    if (build != '') {

        build = ' ' + build;
    }

    write('You are currently running SHPS v' + SHPS_VERSION.cyan.bold + build.yellow + ', but please call her ' + SHPS_INTERNAL_NAME.cyan.bold + '!');

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
