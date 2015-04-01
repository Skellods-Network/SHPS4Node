'use strict';

var me = module.exports;

var events = require('events');

var helper = require('./helper.js');

var eventEmitter = new events.EventEmitter();
var self = this;


var _sendSignal 
= me.sendSignal = function ($signal) {
    
    eventEmitter.emit.apply(eventEmitter, arguments);
};

var _addSlot 
= me.addSlot = function ($event, $slot) {
    
    eventEmitter.on($event, $slot);
};

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_schedule_hug($h) {
    
    return helper.genericHug($h, self, function f_schedule_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
