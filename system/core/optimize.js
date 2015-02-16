'use strict';

var me = module.exports;

var os = require('os');

var scheduler = require('./schedule.js');
var log = require('./log.js');
var herlper = require('./helper.js');
var main = require('./main.js');

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

        if (_vulnerabilities[k[i]] !== null) {

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
                    
                    log.writeWarning('Public eastereggs are enabled for in ' + $file + '!');
                    log.writeHint('Consider setting `config->eastereggs->value` in ' + $file + ' to `false`.');
                    
                    _vulnerabilities.eastereggs = true;
                }

                break;
            }

            case 'hp': {

                break;
            }

            default: {

                log.writeWarning('Configuration ' + $file + ' uses an unknown type (`' + $config.configHeader.type + '`) in its header part!');
                _unknownDangersCount++;
            }
        }
    }
});

scheduler.addSlot('onFilePollution', function ($dir, $dirDescription, $file) {

    log.writeWarning('File `' + $file + '` is polluting the ' + $dirDescription + ' directory (' + $dir + ')!');
    log.writeHint('Consider deleting ' + $dir + $file + '.');
});

scheduler.addSlot('onPollution', function ($dir, $dirDescription, $file) {
    
    log.writeWarning('`' + $file + '` is polluting the ' + $dirDescription + ' directory (' + $dir + ')!');
    log.writeHint('Consider deleting ' + $dir + $file + '.');
});

scheduler.addSlot('onFileNotFound', function ($file, $dir, $description) {
    $description = typeof $description === 'undefined' ? '' : ' ' + $description;
    
    log.writeWarning('`' + $file + '` could not be found in ' + $dir + '!' + $description);
    log.writeHint('Consider loading the admin-GUI plugin which is able to repair your installation.');
});
