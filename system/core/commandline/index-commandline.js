'use strict';

(function f_commandline() {

    var me = module.exports;
    
    var readline = require('readline');
    var cluster = require('cluster');
    var u = require('util');
    var libs = require('node-mod-load').libs;
    
    var task = require('./task.js');
    
    var rl = {};
    var _isInitialized = false;
    var mp = {
        self: this
    };
    
    var sb = null;
    var fixedCursorMemory = false;
    var lastMark = null;
    
    // Expose submodule methods
    me.newTask = task.newTask;

    
    /**
     * Clear screen
     */
    var _cls =
    me.cls = 
    me.clear = function () {
        
        process.stdout.write('\u001Bc');
    };

    var _guardPositionMemory 
    = me.guardPositionMemory = function f_log_guardPositionMemory() {
        
        fixedCursorMemory = true;
    };

    var _dropGuardPositionMemory 
    = me.dropGuardPositionMemory = function f_log_dropGuardPositionMemory() {
        
        fixedCursorMemory = false;
    };
    
    var completer = function ($line, $callback) {
        
        var completions = 'exit;help;version;!(will eval statement)'.split(';');
        
        // IDEA
        // get last command -> complete.
        // If parameter of command, queue parameters of command and try to complete parameter.
        // If parameter fully complete, try next parameter which matched the initial short form.
        // Else put the initial short form.
        // Also add piping and breakets
        
        var hits = completions.filter(function (c) {
            
            return c.indexOf($line) == 0
        });
        
        // show all completions if none found
        $callback(null, [hits, $line]); //.length ? hits : completions
    };
    
    var _prompt 
    = me.prompt = function () {
        
        if (_isInitialized) {
            
            rl.prompt(true);
        }
    };
    
    var __isInitialized 
    = me.isInitialized = function f_commandline_isInitialized() {
        
        return _isInitialized;
    };
    
    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = me.hug = function f_commandline_hug($h) {
        
        return libs.helper.genericHug($h, mp, function f_commandline_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };
    
    var _init 
    = me.init = function f_commandline_init() {
        
        if (_isInitialized) {
            
            return rl;
        }
        
        rl = readline.createInterface({
            
            input: process.stdin,
            output: process.stdout,
            completer: completer
        });
        
        if (process.stdin.isTTY) {
            
            libs.cui.init();
        }
        
        rl.setPrompt('SHPS> ');
        
        var internalRS = new libs.helper.requestState();
        internalRS.request = {
            
            headers: {},
            connection: { remoteAddress: 'localhost' },
        };
        
        internalRS.COOKIE = libs.cookie.newCookieJar(internalRS);
        internalRS.config = libs.default.config;
        internalRS._domain = new libs.helper.SHPS_domain('localhost');
        internalRS.dummy = true;
        sb = libs.sandbox.newSandbox(internalRS);
        sb.addFeature.allBase();
        
        _isInitialized = true;
        
        rl.prompt(false);
        
        return rl;
    };
    
    var _stillCurrent 
    = me.stillCurrent = function f_commandline_stillCurrent($mark) {

        return $mark === lastMark;
    };

    var _write 
    = me.write = function f_commandline_write($str, $mark) {
        
        lastMark = $mark;
        if (cluster.isWorker) {
            
            process.send({
                
                module: 'coml',
                command: 'write',
                payload: $str
            });
        }
        else {
            
            //if (libs.config.getHPConfig('1337')) {
            //    
            //    $str = _l337($str);
            //}
            
            if (_isInitialized) {
                
                // Clear line so no prompt will be visible
                process.stdout.write('\u001B[2K');
                
                // Move cursor left 6 cols ("SHPS> " is 6 characters long)
                process.stdout.write('\u001B[6D');
            }
            
            if (!fixedCursorMemory) {
                
                // Save cursor position
                $str += '\u001B[s';
            }
            
            process.stdout.write($str + '\n');
            
            _prompt(true);
        }
    };
    
        /**
         * Appends a string to the previous line of the console
         * 
         * @param $str
         *   String to append
         */
        var _append 
        = me.append = function f_log_append($str) {
        
            // Load cursor position, write string, save new cursor position
            process.stdout.write('\u001B[u' + $str + '\u001B[s\n');
        };
    
        /**
         * Write note to console and to log
         *
         * @param string $str
         */
        var writeNote 
        = me.writeNote = function ($str) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
            _write($str.bold);
        };
    
        /**
         * Write warning to console and to log
         *
         * @param string $str
         * @param $toDB boolean
         */
        var writeWarning 
        = me.writeWarning = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
            _write(('WARNING: ' + $str).yellow.bold);
        };
    
        /**
         * Write error to console and to log
         *
         * @param string $str
         * @param $toDB boolean
         */
        var writeError 
        = me.writeError = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
            _write(('ERROR: ' + $str).red.bold);
        };
    
        /**
         * Write fatal error to console and to log
         *
         * @param string $str
         * @param $toDB boolean
         */
        var writeCritical 
        = me.writeCritical = function ($str, $toDB) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
            _write(('FATAL ERROR: ' + $str).red.bold);
        };
    
        /**
         * Write welcome message
         */
        var writeWelcome 
        = me.writeWelcome = function () {
        
            _write('\n ' + 'WELCOME to a world of no worries.'.underline.green.bold + '\n ' + 'WELCOME to SHPS!'.underline.green.bold + '\n');
        
            libs.main.printVersion();
        };
    
        /**
         * Write hint to console
         * 
         * @param string $str
         */
        var _writeHint 
        = me.writeHint = function ($str) {
        $str = typeof $str !== 'undefined' ? $str : '';
        
            _write(('HINT: ' + $str).grey);
        };
    
        /**
         * Well.... guess what this one does :)
         * 
         * @param string $str
         * @result string
         */
        var _l337 
        = mp.l337 = function f_log_l337($str) {
        
        $str = libs.SFFM.replaceAll($str, {
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
        $str = libs.SFFM.replaceAll($str, {
            ck: 'X',
            ex: 'X',
            en: 'N'
        });
        
        $str = libs.SFFM.replaceAll($str, {
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
    
    var _handleRequest 
    = me.handleRequest = function () {
        
        _write('For help, please input `help` (or just `h` and press [TAB]) and hit [ENTER].\n'.bold);
        _init();
        
        //TODO: improve command parser
        rl.on('line', function ($line) {
            
            $line = $line.trim();
            switch ($line) {

                case 'clear':
                case 'clr':
                case 'cls': {
                    
                    _cls();
                    _writeWelcome();
                    break;
                }

                case 'exit': {
                    
                    _isInitialized = false;
                    rl.close();
                    libs.parallel.killAll();
                    libs.main.killAllServers();
                    process.exit(0); //todo: nice shutdown
                    break;
                }

                case 'help': {
                    
                    _write('We are truely sorry, but help has not been implemented, yet  :/\n');
                    break;
                }

                case 'lick': {
                    
                    // I'm sorry, but I had to put this here...
                    /*let*/var buf = new Buffer('DQpCaWcgYm94DQpTbWFsbCBib3gNCkNyeXN0YWwgYmFsbA0KU2luZ2xlIGRvb3JiZWxsDQpEb3VibGUgZG9vcmJlbGwNCkljZSBjcmVhbSBjb25lDQpGZWVkIHRoZSBwaWdlb25zDQpGb3J3YXJkIHN3aW0NCkJlYXQgdGhlIGhvcnNlDQpCdXRjaGVyIHRoZSBoaXBwbw0KR3JvcGUgdGhlIG9yYW5ndXRhbg0KU3BhbmsgdGhlIG1vbmV5DQoNCkFuZCBmaW5hbGx5DQpMaWNrIHRoZSBsaXphcmQ===', 'base64');
                    _write(buf.toString('utf-8') + '\n');
                    break;
                }

                case 'version': {
                    
                    var v = process.versions;
                    var r = libs.main.getVersionText() + '\n';
                    for (var lib in v) {
                        
                        r += ' LIB: ' + lib + ' - ' + v[lib] + '\n';
                    }
                    
                    v = libs.dep.getVersions();
                    for (var lib in v) {
                        
                        r += ' DEP: ' + lib + ' - ' + v[lib] + '\n';
                    }
                    
                    _write(r);
                    break;
                }

                case 'whoami': {
                    
                    _write('nobody');
                    break;
                }

                case /^\s*?!.*/i.test($line)
                    ? $line
                    : undefined
                    : {
                        
                        try {
                            
                            sb.run(libs.sandbox.newScript($line.replace(/^\s*?!/, ''))).done(function ($res) {
                                                
                                _write($res);
                            }, function ($err) {
                                       
                                _writeError('Your last JS command threw an error:\n' + $err + '\n');    
                            });
                        }
                        catch ($e) {
                            
                            _writeError('Your last JS command threw an error:\n' + $e + '\n');
                        }
                        finally {
                            
                            break;
                        }
                    }

                default: {
                    
                    if ($line !== '' && !libs.plugin.callCommand($line)) {
                        
                        _write('Command not found!\n');
                    }
                    else {
                        
                        rl.prompt(true);
                    }
                }
            }
        });
    };
    
    /**
     * CONSTRUCTOR
     */

    // Before loading, we have to make sure that stupid plugin authors get errors if they don't work cleanly with SHPS :/
    console.log = function ($str) {
        
        _writeWarning('Output has to be done via SHPS\' logging module!');
        _writeHint('If you are a plugin author, use for example require(\'node-mod-load\').libs.coml .');
        _writeHint('If you are a plugin user and downloaded this module from the official plugin repository, please contact the SHPS support.');
        _write($str);
    };
})();
