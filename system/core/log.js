//"use strict";  Not possible, see cls()

var me = module.exports;

var colors = require('colors');
var util = require('util');
var cluster = require('cluster');
var readline = require('readline');

var schedule = require('./schedule.js');
var cl = require('./commandline.js');
var main = require('./main.js');
var helper = require('./helper.js');
var SFFM = require('./SFFM.js');

var mp = {
    self: this
};


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
 */
var _cls 
= me.cls = function () {
    
    process.stdout.write('\033c');
};

/**
 * Write to log
 *
 * @param integer $level
 * @param string $str
 */
var _log
= me.log = function ($level, $str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    if ((level == 1 && $level > 3) || (level != 1 && level <= $level)) {
        
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
 */
var error 
= me.error = function ($str) {

    _log(4, $str);
};

/**
 * Write fatal
 *
 * @param string $str
 */
var fatal
= me.fatal = function ($str) {

    _log(5, $str);
};

/**
 * STDOUT function with fork optimization
 * 
 * @param $str string
 * @param $forceWrite boolean Force output even from worker
 */
var _out 
= mp.out = function ($str, $forceWrite) {
    $forceWrite = typeof $forceWrite !== 'undefined' ? $forceWrite : false;
    
    if (cluster.isMaster || $forceWrite) {
        
        if (main.getHPConfig('1337')) {
            
            $str = SFFM.replaceAll($str, {
                'er ': 'or ',
                'ed ': 't ',
                and: '&',
                ant: '&',
                anned: '&',
                '!!': '!1',
                '-': '~'
            });

            var i = 0;
            var l = $str.length;
            var tick = false;
            while (i < l) {
                
                if (/[A-Z]/.test($str[i])) {
                    
                    if (tick) {

                        $str = $str.substr(0, i) + $str[i].toLowerCase() + $str.substr(i + 1);
                        tick = false;
                    }
                    else {
                        
                        tick = true;
                    }
                }
                else if (/[a-ln-z]/.test($str[i])) {
                    
                    if (tick) {
                        
                        $str = $str.substr(0, i) + $str[i].toUpperCase() + $str.substr(i + 1);
                        tick = false;
                    }
                    else {
                        
                        tick = true;
                    }
                }

                i++;
            }
            
            $str = SFFM.replaceAll($str, {
                or: 'r0',
                ck: 'X',
                ex: 'X',
                en: 'N'
            }); 

            $str = SFFM.replaceAll($str, {
                a: '4',
                b: '8',
                e: '3',
                g: 'q',
                i: '!',
                l: '1',
                o: '0',
                s: '5',
                t: '7'
            });
        }

        console.log($str);
        cl.prompt();
    }
};

/**
 * Write string to console and to log
 *
 * @param string $str
 */
var write
= me.write = function ($str) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    _out($str);
    _log($str);
};

/**
 * Write ntoe to console and to log
 *
 * @param string $str
 * @param $forceWrite boolean Force output even from worker
 */
var writeNote
= me.writeNote = function ($str, $forceWrite) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    _out($str.bold, $forceWrite);
    _log(3, $str);
};

/**
 * Write warning to console and to log
 *
 * @param string $str
 * @param $forceWrite boolean Force output even from worker
 */
var writeWarning 
= me.writeWarning = function ($str, $forceWrite) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    _out(('WARNING: ' + $str).yellow.bold, $forceWrite);
    _log(3, $str);
};

/**
 * Write error to console and to log
 *
 * @param string $str
 * @param $forceWrite boolean Force output even from worker
 */
var writeError
= me.writeError = function ($str, $forceWrite) {
    $str = typeof $str !== 'undefined' ? $str : '';

    _out(('ERROR: ' + $str).red.bold, $forceWrite);
    _log(4, $str);
};

/**
 * Write fatal error to console and to log
 *
 * @param string $str
 * @param $forceWrite boolean Force output even from worker
 */
var writeFatal
= me.writeFatal = function ($str, $forceWrite) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    _out(('FATAL ERROR: ' + $str).red.bold, $forceWrite);
    _log(5, $str);
};

/**
 * Write welcome message
 */
var writeWelcome
= me.writeWelcome = function () {
    
    write('\n WELCOME to a world of no worries.\n WELCOME to SHPS!\n'.underline.green.bold);
    
    var build = SHPS_BUILD;
    if (build != '') {

        build = ' ' + build;
    }
    
    main.printVersion();
};

/**
 * Write hint to console
 * 
 * @param string $str
 * @param $forceWrite boolean Force output even from worker
 */
var _outHint 
= me.writeHint = function ($str, $forceWrite) {
    $str = typeof $str !== 'undefined' ? $str : '';
    
    _out(('HINT: ' + $str).grey, $forceWrite);
};

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_log_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
