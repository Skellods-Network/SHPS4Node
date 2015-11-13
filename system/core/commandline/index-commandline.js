'use strict';

var color = require('colors');
var modLoad = require('node-mod-load');
var libs = modLoad.libs;

var nat = require('node-app-terminal');
module.exports = new nat();
var me = module.exports;

var sb = null;

var originalInit = module.exports.__proto__.init;
module.exports.__proto__.init = function () {
    
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

    return originalInit.apply(me, arguments);
};

/**
 * Write welcome message
 */
var _writeWelcome
= me.writeWelcome = function () {

    me.write('\n ' + 'WELCOME to a world of no worries.'.underline.green.bold + '\n ' + 'WELCOME to SHPS!'.underline.green.bold + '\n');

    libs.main.printVersion();
};

me.on('line', function ($line) {

    $line = $line.trim();
    switch ($line) {

        case 'clear':
        case 'clr':
        case 'cls': {

            me.cls();
            me.writeWelcome();
            break;
        }

        case 'exit': {

            libs.parallel.killAll();
            libs.main.killAllServers();
            process.exit(0); //todo: nice shutdown
            break;
        }

        case 'help': {

            me.write('We are truely sorry, but help has not been implemented, yet  :/\n');
            break;
        }

        case 'lick': {
                    
            // I'm sorry, but I had to put this here...
            var buf = new Buffer('DQpCaWcgYm94DQpTbWFsbCBib3gNCkNyeXN0YWwgYmFsbA0KU2luZ2xlIGRvb3JiZWxsDQpEb3VibGUgZG9vcmJlbGwNCkljZSBjcmVhbSBjb25lDQpGZWVkIHRoZSBwaWdlb25zDQpGb3J3YXJkIHN3aW0NCkJlYXQgdGhlIGhvcnNlDQpCdXRjaGVyIHRoZSBoaXBwbw0KR3JvcGUgdGhlIG9yYW5ndXRhbg0KU3BhbmsgdGhlIG1vbmV5DQoNCkFuZCBmaW5hbGx5DQpMaWNrIHRoZSBsaXphcmQ===', 'base64');
            me.write(buf.toString('utf-8') + '\n');

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

            me.write(r);
            break;
        }

        case 'whoami': {

            me.write('root');
            break;
        }

        case 'cache': {

            me.write('Not Implemented yet');
        }

        case /^\s*?!.*/i.test($line)
            ? $line
            : undefined
            : {

                try {

                    sb.run(libs.sandbox.newScript($line.replace(/^\s*?!/, ''))).done(function ($res) {

                        me.write($res);
                    }, function ($err) {

                        me.writeError('Your last JS command threw an error:\n' + $err + '\n');
                    });
                }
                catch ($e) {

                    me.writeError('Your last JS command threw an error:\n' + $e + '\n');
                }
                finally {

                    break;
                }
            }

        default: {

            if ($line !== '' && !libs.plugin.callCommand($line)) {

                me.write('Command not found!\n');
            }
            else {

                rl.prompt(true);
            }
        }
    }
});
