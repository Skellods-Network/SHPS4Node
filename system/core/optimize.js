'use strict';

var me = module.exports;

var schedule = require('./schedule.js');
var log = require('./log.js');


schedule.addSlot('onListenStart', function ($protocol, $port) {

    if ($protocol.match(/HTTP\/1.*/i)) {

        log.writeWarning($protocol + ' connection not encrypted. Anyone can spy on data in transit!');
    }
});