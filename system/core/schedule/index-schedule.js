'use strict';

var me = module.exports;

var events = require('events');

var libs = require('node-mod-load').libs;

var dSlots = [];
var eventEmitter = new events.EventEmitter();
var mp = {
    self: this
};


var _sendSignal 
= me.sendSignal = function ($signal) {
    
    eventEmitter.emit.apply(eventEmitter, arguments);
};

var _addSlot 
= me.addSlot = function ($event, $slot) {
    
    eventEmitter.on($event, $slot);
};

/**
 * Two-way signalling
 * 
 * @param $signal string
 *   Returns array of results as parameter
 */
var _sendDuplexSignal
= me.sendDuplexSignal = function f_schedule_sendDuplexSignal($signal) {
    
    var r = [];
    var i = 0;
    var l = dSlots.length;
    while (i < l) {

        if (dSlots[i].event !== $signal) {

            continue;
        }

        r.push(dSlots[i].call.apply(null, arguments.slice(1)));
    }

    return r;
};

/**
 * Adds two-way slot. The slot's return value will be returned to the signal sender
 * 
 * @param $event string
 * @param $slot callable
 */
var _addDuplexSlot
= me.addDuplexSlot = function f_schedule_addDuplexSlot($event, $slot) {
    
    dSlots.push({
    
        event: $event,
        call: $slot,
    });
};
