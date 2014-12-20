'use strict';

var me = module.exports;

var events = require('events');
var eventEmitter = new events.EventEmitter();


var _sendSignal
= me.sendSignal = function ($signal) {

    eventEmitter.emit.apply(eventEmitter, arguments);
}

var _addSlot
= me.addSlot = function ($event, $slot) {

    eventEmitter.on($event, $slot);
}