'use strict';

var me = module.exports;

var scheduler = require('./schedule.js');
var log = require('./log.js');

var vulnerabilities = {
    
    protocol: null,
    eastereggs: null
};

var _dangerCount 
= me.dangerCount = function f_optimize_dangerCount() {
    
    var k = Object.keys(vulnerabilities);
    var l = k.length;
    var i = 0;
    var c = 0;
    while (i < l) {

        if (vulnerabilities[k[i]] !== null) {

            c++;
        }

        i++;
    }

    return c;
};

scheduler.addSlot('onListenStart', function ($protocol, $port) {

    if ($protocol.match(/HTTP\/1.[0,1]/i)) {

        log.writeWarning('The ' + $protocol + ' connection on port ' + $port + ' is not encrypted. Anyone can spy on data in transit!');
        log.writeHint('Consider switching all homepages to HTTP/2.0 by setting `generalConfig->useHTTP2->value` to `true` and `generalConfig->useHTTP1->value` to `false` in all configuration files.');

        vulnerabilities.protocol = {
        
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

        if ($config.generalConfig.eastereggs.value) {

            log.writeWarning('Public eastereggs are enabled for ' + $config.generalConfig.URL.value + ' in ' + $file + '!');
            log.writeHint('Consider setting `generalConfig->eastereggs->value` in ' + $file + ' to `false`.');

            vulnerabilities.eastereggs = true;
        }
    }
});

scheduler.addSlot('onFilePollution', function ($dir, $dirDescription, $file) {

    log.writeWarning('File `' + $file + '` is polluting the ' + $dirDescription + ' directory (' + $dir + ')!');
    log.writeHint('Consider deleting ' + $dir + $file + '.');
});