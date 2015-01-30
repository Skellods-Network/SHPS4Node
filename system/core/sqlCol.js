'use strict';

var me = module.exports;

var helper = require('./helper.js');

var mp = {
    self: this
};


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_main_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newCol 
= me.newCol = function f_sqlCol_newCol($table) {
    
    return new _sqlCol($table);
};

var _sqlCol = function c_sqlCol($table) {
    
    var mp = {
        self: this
    };
    
    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = me.hug = function f_main_hug($h) {
        
        return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };
};