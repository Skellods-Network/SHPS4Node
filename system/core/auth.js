'use strict';

var me = module.exports;

var helper = require('./helper.js');
var session = require('./session.js');
var SFFM = require('./SFFM.js');

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
= me.hug = function f_auth_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var Auth 
= me.focus = function c_auth($requestState) {
    
    var _session;

    var _test =
    this.test = function f_auth_test() {

        return _session.data;
    };


    // CONSTRUCTOR
    _session = session.newSession($requestState);;
    $requestState.SESSION = _session.data;
};

var _newAuth
= me.newAuth = function f_sqlCol_newAuth($requestState) {
    
    return new Auth($requestState);
};