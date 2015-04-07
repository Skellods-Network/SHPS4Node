'use strict';

var me = module.exports;

var readline = require('readline');
var cluster = require('cluster');
var u = require('util');

var helper = require('./helper.js');
var log = require('./log.js');
var main = require('./main.js');
var make = require('./make.js');

var rl = {};
var _isInitialized = false;
var self = this;


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
        
        rl.prompt();
    }
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
    
    return helper.genericHug($h, self, function f_commandline_hug_hug($hugCount) {

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

    rl.setPrompt('SHPS> ');
    rl.prompt();
    _isInitialized = true;

    return rl;
}

var _handleRequest 
= me.handleRequest = function () {

    log.write('For help, please input `help` (or just `h` and press [TAB]) and hit [ENTER].\n');
    _init();
    
    rl.on('line', function ($line) {
        
        switch ($line) {

            case 'cls': {
                
                log.cls();
                log.writeWelcome();
                break;
            }

            case 'exit': {
                
                _isInitialized = false;
                rl.close();
                cluster.disconnect();
                process.exit(0); //todo: nice shutdown
                break;
            }

            case 'help': {
                
                log.write('We are truely sorry, but help has not been implemented, yet  :/\n');
                break;
            }

            case 'lick': {
                
                // I'm sorry, but I had to put this here...
                /*let*/var buf = new Buffer('DQpCaWcgYm94DQpTbWFsbCBib3gNCkNyeXN0YWwgYmFsbA0KU2luZ2xlIGRvb3JiZWxsDQpEb3VibGUgZG9vcmJlbGwNCkljZSBjcmVhbSBjb25lDQpGZWVkIHRoZSBwaWdlb25zDQpGb3J3YXJkIHN3aW0NCkJlYXQgdGhlIGhvcnNlDQpCdXRjaGVyIHRoZSBoaXBwbw0KR3JvcGUgdGhlIG9yYW5ndXRhbg0KU3BhbmsgdGhlIG1vbmV5DQoNCkFuZCBmaW5hbGx5DQpMaWNrIHRoZSBsaXphcmQ===', 'base64');
                log.write(buf.toString('utf-8') + '\n');
                break;
            }

            case 'version': {
                
                var v = process.versions;
                var r = main.getVersionText() + '\n';
                for (var lib in v) {
                    
                    r += ' LIB: ' + lib + ' - ' + v[lib] + '\n';
                }
                
                log.write(r);
                break;
            }

            case /^\s*?!.*/i.test($line)
                ? $line
                : undefined
                : {
                    
                    try {

                        //log.write(eval($line.replace(/^\s*?!/, '')) + '\n');
                        log.write(make.extExecuteJS($line.replace(/^\s*?!/, ''), true, true, true));
                        //make.extExecuteJS($line.replace(/^\s*?!/, ''), true, true, true);
                        //log.write('DONE');
                    }
                    catch ($e) {

                        log.writeError('Your last JS command threw an error:\n' + $e + '\n');
                    }
                    finally {

                        break;
                    }
            }

            default: {
                
                //call plugins
                log.write('Command not found!\n');
            }
        }
        
    });
};
