"use strict";

var me = module.exports;

var readline = require('readline');


var log = require('./log.js');


var completer = function ($line, $callback) {
    
    var completions = 'exit help run'.split(' ');
    
    // IDEA
    // get last command -> complete.
    // If parameter of command, queue parameters of command and try to complete parameter.
    // If parameter fully complete, try next parameter which matched the initial short form.
    // Else put the initial short form.
    // Also add piping and breakets

    var hits = completions.filter(function (c) { return c.indexOf($line) == 0 });
    // show all completions if none found
    $callback(null, [hits, $line]); //.length ? hits : completions
}

var handleRequest
= me.handleRequest = function () {
    
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: completer
    });
    
    log.write('For help, please input `help` (or just `h` and press [TAB]) and hit [ENTER].\n');

    rl.setPrompt('SHPS> ');
    rl.prompt();

    rl.on('line', function ($line) {
        
        switch ($line) {

            case 'cls': {
                
                log.cls();
                log.writeWelcome();
                break;
            }

            case 'exit': {
                
                process.exit(0); //todo: nice shutdown
                break;
            }

            case 'help': {
                
                log.write('We are truely sorry, but user input has not been implemented, yet  :/');
                break;
            }

            case 'lick': {
            
                // I'm sorry, but I had to put this here...
                /*let*/var buf = new Buffer('DQpCaWcgYm94DQpTbWFsbCBib3gNCkNyeXN0YWwgYmFsbA0KU2luZ2xlIGRvb3JiZWxsDQpEb3VibGUgZG9vcmJlbGwNCkljZSBjcmVhbSBjb25lDQpGZWVkIHRoZSBwaWdlb25zDQpGb3J3YXJkIHN3aW0NCkJlYXQgdGhlIGhvcnNlDQpCdXRjaGVyIHRoZSBoaXBwbw0KR3JvcGUgdGhlIG9yYW5ndXRhbg0KU3BhbmsgdGhlIG1vbmV5DQoNCkFuZCBmaW5hbGx5DQpMaWNrIHRoZSBsaXphcmQ===', 'base64');
                log.write(buf.toString('utf-8') + '\n');
                break;
            }

            case 'version': {

                var build = SHPS_BUILD;
                if (build != '') {
                    
                    build = ' ' + build;
                }
                
                log.write('You are currently running SHPS v' + SHPS_VERSION.cyan.bold + build.yellow + ', but please call her ' + SHPS_INTERNAL_NAME.cyan.bold + '!');
                break;
            }

            case /^!.+/i.test($line)?$line:false: {

                log.write(eval($line.substring(1)));
                break;
            }

            default: {

                log.write('Command not found!');
            }
        }
        
        log.write('');
        rl.prompt();
    });
}
