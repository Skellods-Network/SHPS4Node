'use strict';

var me = module.exports;

var path = require('path');
var u = require('util');
var _ = require('lodash');
var crypto = require('crypto');

var helper = require('./helper.js');

var mp = {
    self: this
};


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
    
    return helper.genericHug($h, mp, function f_SFFM_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * Tries to determine if SHPS is running on io.js or node.js
 * 
 * @return boolean
 */
var _isIOJS 
= me.isIOJS = function f_SFFM_isIOJS() {
    
    f_SFFM_isIOJS.isIOJS = 
        f_SFFM_isIOJS.isIOJS ||
        path.basename(process.title, '.exe') == 'iojs' ||
        _.indexOf(process.argv, 'iojs') >= 0 ||
        _.indexOf(process.argv, 'iojs.exe') >= 0;
    
    return f_SFFM_isIOJS.isIOJS;
};

/**
 * Replaces all occurances in $str with other strings based on $mapObj
 * 
 * @param $str string
 * @param $mapObj object
 *   This is a key:value list of things to replace
 * @return string
 */
var _replaceAll
= me.replaceAll = function f_SFFM_replaceAll($str, $mapObj) {

    var re = new RegExp(Object.keys($mapObj).join("|"), "gi");
    
    return $str.replace(re, function ($matched) {

        return $mapObj[$matched.toLowerCase()];
    });
}

var _getIP 
= me.getIP = function f_SFFM_getIP($request) {

    var ip = $request.headers['x-forwarded-for']
        || $request.connection.remoteAddress 
        || $request.socket.remoteAddress 
        || $request.connection.socket.remoteAddress;

    if (u.isArray(ip)) {
        
        ip = ip[0];
    }

    return ip;
};

/**
 * Split query into object
 * @param $path string
 * @return object
 */
var _splitQueryString 
= me.splitQueryString = function f_SFFM_splitQueryString($path) {

    var components = $path.split('?');
    var reqPath = components[0];
    if (reqPath[0] == '/') {
        
        reqPath = reqPath.substring(1);
    }
    else {

        reqPath = components[1]
    }

    var reqParams = reqPath.split('/');
    var i = 0;
    var params = {};
    
    while (typeof reqParams[i] !== 'undefined') {
        
        var kvp = reqParams[i].split('=');
        if (kvp.length == 1) {
            
            params[kvp[0]] = true;
        }
        else if (kvp.length == 2) {
            
            params[kvp[0]] = kvp[1];
        }
        else {
            
            var j = 1;
            while (typeof kvp[j] !== 'undefined') {
                
                params[kvp[0]] += kvp[j];
                j++;
            }
        }
        
        i++;
    }

    return params;
};

var _randomInt
= me.randomInt = function f_SFFM_randomInt($low, $high) {

    return (Math.random() * ($high - $low) + $low) |0;
}

var _randomString 
= me.randomString = function f_SFFM_randomString($length, $chars) {
    $chars = $chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    
    var rand = crypto.randomBytes($length);
    var cl = $chars.length;
    var r = '';
    var i = 0;
    var l = $length - 1;
    while (i < l) {
        
        r += $chars[rand[i] % cl];
        i++;
    }
    
    return r;
};

var _isHTTPS 
= me.isHTTPS = function f_SFFM_isHTTPS($request) {
    
    var s = $request.headers.host.substr(0, 5);
    if (s === 'https') {

        return true;
    }

    return false;
};