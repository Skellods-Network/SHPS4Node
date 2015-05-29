'use strict';

var me = module.exports;

var os = require('os');

var scheduler = require('./schedule.js');
var log = require('./log.js');
var herlper = require('./helper.js');
var main = require('./main.js');
var SFFM = require('./SFFM.js');

var self = this;


var _vulnerabilities = {
    
    protocol: null,
    eastereggs: null
};

var _unknownDangersCount = 0;

var _handledMessages = [];

var _dangerCount 
= me.dangerCount = function f_optimize_dangerCount() {
    
    var k = Object.keys(_vulnerabilities);
    var l = k.length;
    var i = 0;
    var c = 0;
    while (i < l) {

        if (_vulnerabilities[k[i]] !== null && _vulnerabilities[k[i]] !== false) {

            c++;
        }

        i++;
    }

    return c + _unknownDangersCount;
};

var _handleWorkerMessage 
= me.handleWorkerMessage = function f_optimize_handleWorkerMessage($event, $params) {
    
    if (_handledMessages[$event]) {
        
        var i = 0;
        var hme = _handledMessages[$event];
        var l = hme.length;
        var found = false;
        while (i < l) {

            if (hme[i] == $params) {

                found = true;
                break;
            }
        }

        if (!found) {

            hme[$params]
        }
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
= me.hug = function f_optimize_hug($h) {
    
    return helper.genericHug($h, self, function f_optimize_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _checkConfigForRisks 
= me.checkConfigForRisks = function f_optimize_checkConfigForRisks($file, $config) {

    switch ($config.configHeader.type) {

        case 'master': {
            
            var numCPUs = os.cpus().length;
            if ($config.config.workers.value != -1 && $config.config.workers.value > numCPUs) {
                
                log.writeHint('Consider reducing the number of workers in ' + $file + ' to ' + numCPUs + ' (CPU core count) or setting it to -1 for smart handling.');
            }
            else if ($config.config.workers.value != -1 && $config.config.workers.value < numCPUs) {
                
                log.writeHint('Consider increasing the number of workers in ' + $file + ' to ' + numCPUs + ' (CPU core count) or setting it to -1 for smart handling.');
            }
            
            if (main.getHPConfig('eastereggs')) {
                
                // Eastereggs are fun for intranet applications, but could reveal too much information about the SHPS version in use
                log.writeWarning('Public eastereggs are enabled for in ' + $file + '!');
                log.writeHint('Consider setting `config->eastereggs->value` in ' + $file + ' to `false`.');
                
                _vulnerabilities.eastereggs = true;
            }
            
            if ($config.SWMGUI.active.value) {
                
                // This is very important, but I guess there might always be that one person...
                // TODO: Check if the SWMGUI is reachable from the internet and disable it until that port is blocked or changed for a blocked one.
                log.writeHint('SWMGUI is active. Make sure it is unreachable from the internet!');
            }
            
            break;
        }

        case 'hp': {
            
            if ($config.generalConfig.uploadQuota.value <= 0) {
                
                // No upload quota is a possible risk as users can fill up the disk and break the system (DoS attack)
                log.writeWarning('No upload quota set in ' + $file + '!');
                log.writeHint('Consider setting `config->generalConfig->uploadQuota->value` to a value greater 0 in ' + $file + '.');

                _vulnerabilities.quota = true;
            }
            else {

                _vulnerabilities.quota = false;
            }
            
            if ($config.generalConfig.displayStats.value) {
                
                // Stats will tell visitors detailed version info about SHPS making it easy for attackers to select
                log.writeWarning('Stats are set to visible in ' + $file + '!');
                log.writeHint('Consider setting `config->generalConfig->displayStats->value` to false in ' + $file + '.');

                _vulnerabilities.stats = true;
            }
            else {

                _vulnerabilities.stats = false;
            }
            
            if ($config.generalConfig.useHTTP1.value) {
                
                // HTTP/1.x is legacy and SHPS does not support encryption for that particular module (HTTP/2 is encrypted and supports a protocol-downgrade to HTTP/1.1 if necessary)
                log.writeWarning('HTTP/1.1 activated in ' + $file + '!');
                log.writeHint('Consider setting `config->generalConfig->useHTTP1->value` to false in ' + $file + '. Use HTTP/2, which supports TLS and protocol-downgrade, instead.');
                
                _vulnerabilities.protocol = true;
            }
            else {

                _vulnerabilities.protocol = false;
            }
            
            if ($config.securityConfig.loginDelay.value <= 0) {
                
                // A delay of a second or more will prevent vertical passwort bruteforcing
                log.writeWarning('The login delay contains a possibly dangerous value in ' + $file + '!');
                log.writeHint('Consider setting `config->generalConfig->loginDelay->value` to a value greater 0 in ' + $file + '.');
                
                _vulnerabilities.loginDelay = true;
            }
            else {

                _vulnerabilities.loginDelay = false;
            }
            
            break;
        }

        default: {
            
            // Possibly a faulty or too old/new configuration file. The system might not act as expected.
            log.writeWarning('Configuration ' + $file + ' uses an unknown type (`' + $config.configHeader.type + '`) in its header part!');
            _unknownDangersCount++;
        }
    }

    return _vulnerabilities;
};


scheduler.addSlot('onListenStart', function ($protocol, $port) {

    if ($protocol.match(/HTTP\/1.[0,1]/i)) {

        log.writeWarning('The ' + $protocol + ' connection on port ' + $port + ' is not encrypted. Anyone can spy on data in transit!');
        log.writeHint('Consider switching all homepages to HTTP/2.0 by setting `generalConfig->useHTTP2->value` to `true` and `generalConfig->useHTTP1->value` to `false` in all configuration files.');

        _vulnerabilities.protocol = {
        
            version: $protocol,
            port: $port
        };
    }
});

scheduler.addSlot('onMainInit', function () {
    
    if (SFFM.isIOJS()) {

        log.write('SHPS detected IOJS and will make use of Harmony features!'.green);
    }
    else if (SFFM.isHarmonyActivated()) {

        log.write('SHPS detected that Harmony features are activated and will make use of them!'.green);
    }

    if (global.gc) {

        log.write('SHPS will optimize garbage collection!'.green);
    }
    else {
    
        log.writeHint('Consider using the node commandline parameter `--expose_gc`.');
    }
    
    var dCount = _dangerCount();
    if (dCount > 0) {

        log.writeWarning('System is not secure (' + dCount + ' problems seen so far)!');
        log.writeHint('Follow hints to remove warnings. Fewer warnings mean better security and stability.');
    }
    else {

        log.write('System looks secure so far!'.green);
    }
});

scheduler.addSlot('onConfigLoaded', function ($file, $successful, $config) {

    if ($successful) {
        
        _checkConfigForRisks($file, $config);
    }
});

scheduler.addSlot('onFilePollution', function ($dir, $dirDescription, $file) {

    log.writeHint('File `' + $file + '` is polluting the ' + $dirDescription + ' directory (' + $dir + ')! Consider deleting it.');
});

scheduler.addSlot('onPollution', function ($dir, $dirDescription, $file) {
    
    log.writeHint('`' + $file + '` is polluting the ' + $dirDescription + ' directory (' + $dir + ')! Consider deleting it.');
});

scheduler.addSlot('onFileNotFound', function ($file, $dir, $description) {
    $description = typeof $description === 'undefined' ? '' : ' ' + $description;
    
    log.writeHint('`' + $file + '` could not be found in ' + $dir + '!' + $description + ' Consider loading the admin-GUI plugin which is able to repair your installation.');
});

scheduler.addSlot('onPreferredModuleMissing', function ($preferredModule, $alternative, $text) {
    $text = typeof $text !== 'undefined' ? '\n' + $text : '';

    log.writeHint('The module `' + $preferredModule + '` could not be loaded. `' + $alternative + '` will be used instead.' + $text + '\nConsider installing `' + $preferredModule + '`.');
});

scheduler.addSlot('onDependencyMissing', function ($module) {
    
    var msg = 'The module `' + $module + '` could not be loaded. It is a hard-dependency, though. SHPS cannot start without it. Please follow the installation guide!';
    log.writeFatal(msg);
    throw msg;
});

scheduler.addSlot('onOptionalModuleMissing', function ($module, $text) {
    $text = typeof $text !== 'undefined' ? '\n' + $text : '';

    var msg = 'The module `' + $module + '` could not be loaded. It is an optional dependency, though. SHPS can start without it.' + $text + '\nConsider installing `' + $module + '`.';
    log.writeHint(msg);
});
