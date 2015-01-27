'use strict';

var me = module.exports;

var helper = require('./helper.js');

var self = this;


var _cleanStr
= me.cleanStr = function ($dirty) {

    return $dirty;
}

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_SFFM_hug($h) {
    
    return helper.genericHug($h, self, function f_SFFM_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};