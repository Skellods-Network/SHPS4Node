'use strict';

var me = module.exports;

var crypto = require('crypto');
var util = require('util');

var helper = require('./helper.js');
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

var _getCookies
= me.getCookies = function f_cookie_getCookies($requestState) {

    var list = {};
    var rc = $requestState.request.headers.cookie;
    
    rc && rc.split(';').forEach(function ($cookie) {

        var parts = $cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    
    $requestState.COOKIE = list;
    $requestState._oldCOOKIE = util._extend({}, list);

    return list;
}

var _getChangedCookies 
= me.getChangedCookies = function f_cookie_getChangedCookies($requestState) {

    var rsoc = $requestState._oldCOOKIE;
    var rsc = $requestState.COOKIE;
    var nck = Object.keys(rsc);
    var diff = [];
    var i = 0;
    var l = Object.keys(rsc).length;
    while (i < l) {

        if (!rsoc[nck[i]] || rsoc[nck[i]] != rsc[nck[i]]) {

            diff.push(nck[i] + '=' + rsc[nck[i]]);
        }

        i++;
    }

    return diff;
};
