'use strict';

var me = module.exports;

var scheduler = require('./schedule.js');
var log = require('./log.js');


scheduler.addSlot('onListenStart', function ($protocol, $port) {

    if ($protocol.match(/HTTP\/1.*/i)) {

        log.writeWarning($protocol + ' connection not encrypted. Anyone can spy on data in transit!');
    }
});

scheduler.addSlot('onMainInit', function () {

    if (global.gc) {

        log.write('SHPS will optimize garbage collection!'.green);
    }
});

scheduler.addSlot('onConfigLoaded', function ($file, $successful, $config) {

    if ($successful) {

        if ($config.generalConfig.eastereggs.value) {

            log.writeWarning('Public eastereggs are enabled for ' + $config.generalConfig.URL.value + ' in ' + $file + '!');
        }
    }
});