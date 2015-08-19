'use strict';

var me = module.exports;

var colors = require('colors');
var util = require('util');
var cluster = require('cluster');
var readline = require('readline');

var schedule = require('./schedule.js');
var _config = null;
__defineGetter__('config', function () {
    
    if (!_config) {
        
        _config = require('./config.js');
    }
    
    return _config;
});

var _cl = null;
__defineGetter__('cl', function () {
    
    if (!_cl) {
        
        _cl = require('./commandline.js');
    }
    
    return _cl;
});

var _main = null;
__defineGetter__('main', function () {
    
    if (!_main) {
        
        _main = require('./main.js');
    }
    
    return _main;
});

var _sql = null;
__defineGetter__('sql', function () {
    
    if (!_sql) {
        
        _sql = require('./sql.js');
    }
    
    return _sql;
});

var helper = require('./helper.js');
var SFFM = require('./SFFM.js');

var mp = {
    self: this
};

/**
 * Sets if all log activity should automatically be rerouted to the DB instead of being displayed in the terminal
 * After initialization, SHPS automatically reroutes all log activity to the DB
 * 
 * @var boolean
 */
 var rerouteToDB = false;


GLOBAL.SHPS_LOG_LVL_INFO = 100;
GLOBAL.SHPS_LOG_LVL_TRACE = 10;
GLOBAL.SHPS_LOG_LVL_WARNING = 200;
GLOBAL.SHPS_LOG_LVL_ERROR = 300;
GLOBAL.SHPS_LOG_LVL_FATAL = 400;
GLOBAL.SHPS_LOG_LVL_AUDIT = 999;

schedule.addSlot('onMainInit', function () {
    
    rerouteToDB = true;
});


var _newLog 
= me.newLog = function f_log_newLog($requestState) {

    return new _Log($requestState);
};

var _Log 
= me.Log = function c_log_Log($requestState) {
    
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
    var trace = { first: null, last: null };
    
    var fixedCursorMemory = false;
    
    
    /**
     * Add entry to trace
     *
     * @param $level integer
     * @param string $message
     * @param boolean $toDB
     */
    var addToTrace = function ($level, $message, $toDB) {
        $toDB = typeof $toDB !== 'undefined' ? $toDB : rerouteToDB;
        
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
    = this.cls = function () {
        
        process.stdout.write('\u001Bc');
    };
    
    var _guardPositionMemory 
    = this.guardPositionMemory = function f_log_guardPositionMemory() {
        
        fixedCursorMemory = true;
    };
    
    var _dropGuardPositionMemory 
    = this.dropGuardPositionMemory = function f_log_dropGuardPositionMemory() {
        
        fixedCursorMemory = false;
    };
    
    /**
     * Write to log
     *
     * @param integer $level
     * @param string $str
     * @param boolean $toDB
     */
    var _log 
    = this.log = function ($level, $str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        $toDB = typeof $toDB !== 'undefined' ? $toDB : rerouteToDB;
        
        if ((level == 1 && $level > 300) || (level != 1 && level <= $level / 100)) {
            
            if (level == 1) {
                
                schedule.sendSignal('SHPSError', $level, $str, trace);
            }
            else {
                
                schedule.sendSignal('SHPSError', $level, $str);
            }
        }
        
        if ($toDB) {
            
            _dbLog($level, $str);
        }
        
        addToTrace($level, $str, $toDB);
    };
    
    /**
     * Write log entry directly to DB
     * 
     * @param $lvl string|integer
     * @param $str string
     */
    var _dbLog 
    = this.dbLog = function f_log_dbLog($lvl, $str) {
        
        if ($requestState === undefined) {
            
            return;
        }
        
        try {
            
            sql.newSQL('logging', $requestState).done(function ($sql) {
                
                $sql.openTable('log').insert({
                    
                    time: (new Date() / 1000) | 0,
                    type: $lvl,
                    content: $str,
                }).done($sql.free, $sql.free);
            }, _out);
        }
        catch ($e) {
            
            // Weeeeell. This might be serious. I should really implement a debug argument which prints out all dbLogs to the console.
            writeError('ERROR: Could not write dbLog to database: ' + $e.toString(), false);
        }
    };
    
    /**
     * Write info
     *
     * @param string $str
     */
    var _info 
    = this.info = function ($str) {
        
        _log(SHPS_LOG_LVL_INFO, $str, true);
    };
    
    /**
     * Write audit info
     *
     * @param string $str
     */
    var _audit 
    = this.audit = function ($str) {
        
        _log(SHPS_LOG_LVL_AUDIT, $str, true);
    };
    
    /**
     * Write warning
     *
     * @param string $str
     * @param boolean $toDB
     */
    var _warning 
    = this.warning = function f_log_warning($str, $toDB) {
        
        _log(SHPS_LOG_LVL_WARNING, $str, $toDB);
    };
    
    /**
     * Write error
     *
     * @param string $str
     * @param boolean $toDB
     */
    var error 
    = this.error = function ($str, $toDB) {
        
        _log(SHPS_LOG_LVL_ERROR, $str, $toDB);
    };
    
    /**
     * Write fatal
     *
     * @param string $str
     * @param boolean $toDB
     */
    var fatal 
    = this.fatal = function ($str, $toDB) {
        
        _log(SHPS_LOG_LVL_FATAL, $str, $toDB);
    };
    
    /**
     * Well.... guess what this one does :)
     * 
     * @param string $str
     * @result string
     */
    var _l337 
    = mp.l337 = function f_log_l337($str) {
        
        $str = SFFM.replaceAll($str, {
            'er ': 'or ',
            'ed ': 't ',
            and: '&',
            ant: '&',
            anned: '&',
            '!!': '!1'
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
        
        $str = $str.replace(/or\B/gi, 'r0');
        $str = SFFM.replaceAll($str, {
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
        
        return $str;
    };
    
    /**
     * STDOUT function with fork optimization
     * 
     * @param $str string
     */
    var _out 
    = mp.out = function ($str) {
        
        if (cluster.isMaster || $forceWrite) {
            
            if (config.getHPConfig('1337')) {
                
                $str = _l337($str);
            }
            
            if (cluster.isWorker) {
                
                process.send({ workerMSG: $str, toDB: $toDB });
            }
            
            if (cl.isInitialized()) {
                
                // Clear line so no prompt will be visible
                process.stdout.write('\u001B[2K');
                
                // Move cursor left 6 cols ("SHPS> " is 6 characters long)
                process.stdout.write('\u001B[6D');
            }
            
            if (!fixedCursorMemory) {
                
                // Save cursor position
                $str += '\u001B[s'
            }
            
            process.stdout.write($str + '\n');
            
            cl.prompt(true);
        }
    };
    
    /**
     * Appends a string to the previous line of the console
     * 
     * @param $str
     *   String to append
     */
    var _append 
    = this.append = function f_log_append($str) {
        
        // Load cursor position, write string, save new cursor position
        process.stdout.write('\u001B[u' + $str + '\u001B[s\n');
    };
    
    /**
     * Write string to console and to log
     *
     * @param string $str
     * @param $toDB boolean
     */
    var write 
    = this.write = function f_log_write($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out($str);
        _log(0, $str, $toDB);
    };
    
    /**
     * Write note to console and to log
     *
     * @param string $str
     * @param $toDB boolean
     */
    var writeNote 
    = this.writeNote = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out($str.bold);
        _log(SHPS_LOG_LVL_INFO, $str, $toDB);
    };
    
    /**
     * Write warning to console and to log
     *
     * @param string $str
     * @param $toDB boolean
     */
    var writeWarning 
    = this.writeWarning = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out(('WARNING: ' + $str).yellow.bold);
        _log(SHPS_LOG_LVL_WARNING, $str, $toDB);
    };
    
    /**
     * Write error to console and to log
     *
     * @param string $str
     * @param $toDB boolean
     */
    var writeError 
    = this.writeError = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out(('ERROR: ' + $str).red.bold);
        _log(SHPS_LOG_LVL_ERROR, $str, $toDB);
    };
    
    /**
     * Write fatal error to console and to log
     *
     * @param string $str
     * @param $toDB boolean
     */
    var writeFatal 
    = this.writeFatal = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out(('FATAL ERROR: ' + $str).red.bold);
        _log(SHPS_LOG_LVL_FATAL, $str, $toDB);
    };
    
    /**
     * Write welcome message
     */
    var writeWelcome 
    = this.writeWelcome = function () {
        
        write('\n WELCOME to a world of no worries.\n WELCOME to SHPS!\n'.underline.green.bold);
        
        main.printVersion();
    };
    
    /**
     * Write hint to console
     * 
     * @param string $str
     */
    var _outHint 
    = this.writeHint = function ($str) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
        _out(('HINT: ' + $str).grey, false);
    };
    
    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = this.hug = function f_log_hug($h) {
        
        return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };
    
    
    /**
     * CONSTRUCTOR
     */
};
