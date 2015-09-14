'use strict';

(function f_commandline() {

    var me = module.exports;
    
    var readline = require('readline');
    var cluster = require('cluster');
    var u = require('util');
    
    var libs = require('./perf.js').commonLibs;
    
    var rl = {};
    var _isInitialized = false;
    var mp = {
        self: this
    };
    
    var sb = null;
    
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
            
            libs.CUI.init();
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
        sb.addFeature.all();
        
        _isInitialized = true;
        
        rl.prompt(false);
        
        return rl;
    };
    
    var _handleRequest 
    = me.handleRequest = function () {
        
        libs.gLog.write('For help, please input `help` (or just `h` and press [TAB]) and hit [ENTER].\n'.bold);
        _init();
        
        //TODO: improve command parser
        rl.on('line', function ($line) {
            
            $line = $line.trim();
            switch ($line) {

                case 'clear':
                case 'clr':
                case 'cls': {
                    
                    libs.gLog.cls();
                    libs.gLog.writeWelcome();
                    break;
                }

                case 'exit': {
                    
                    _isInitialized = false;
                    rl.close();
                    libs.parallelize.killAll();
                    libs.main.killAllServers();
                    process.exit(0); //todo: nice shutdown
                    break;
                }

                case 'help': {
                    
                    libs.gLog.write('We are truely sorry, but help has not been implemented, yet  :/\n');
                    break;
                }

                case 'lick': {
                    
                    // I'm sorry, but I had to put this here...
                    /*let*/var buf = new Buffer('DQpCaWcgYm94DQpTbWFsbCBib3gNCkNyeXN0YWwgYmFsbA0KU2luZ2xlIGRvb3JiZWxsDQpEb3VibGUgZG9vcmJlbGwNCkljZSBjcmVhbSBjb25lDQpGZWVkIHRoZSBwaWdlb25zDQpGb3J3YXJkIHN3aW0NCkJlYXQgdGhlIGhvcnNlDQpCdXRjaGVyIHRoZSBoaXBwbw0KR3JvcGUgdGhlIG9yYW5ndXRhbg0KU3BhbmsgdGhlIG1vbmV5DQoNCkFuZCBmaW5hbGx5DQpMaWNrIHRoZSBsaXphcmQ===', 'base64');
                    libs.gLog.write(buf.toString('utf-8') + '\n');
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
                    
                    libs.gLog.write(r);
                    break;
                }

                case 'whoami': {
                    
                    libs.gLog.write('marco');
                    break;
                }

                case /^\s*?!.*/i.test($line)
                    ? $line
                    : undefined
                    : {
                        
                        try {
                            
                            sb.run(libs.sandbox.newScript($line.replace(/^\s*?!/, ''))).done(function ($res) {
                                                
                                libs.gLog.write($res);
                            }, function ($err) {
                                       
                                libs.gLog.writeError('Your last JS command threw an error:\n' + $err + '\n');    
                            });
                        }
                        catch ($e) {
                            
                            libs.gLog.writeError('Your last JS command threw an error:\n' + $e + '\n');
                        }
                        finally {
                            
                            break;
                        }
                    }

                default: {
                    
                    if ($line !== '' && !libs.plugin.callCommand($line)) {
                        
                        libs.gLog.write('Command not found!\n');
                    }
                    else {
                        
                        rl.prompt(true);
                    }
                }
            }
        });
    };
})();
