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
 * Check if Harmony features can be used
 * 
 * @return boolean
 */
var _isHarmonyActivated 
= me.isHarmonyActivated = function f_SFFM_isHarmonyActivated() {

    return (_isIOJS() || ~process.execArgv.indexOf('--harmony'));
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

/**
 * Get client IP from requestState
 * 
 * @param $request object
 * @result string
 */
var _getIP 
= me.getIP = function f_SFFM_getIP($request) {
    
    if ($request.ip) {

        return $request.ip;
    }
    
    if (!($request.headers['x-forwarded-for'] 
        || $request.connection.remoteAddress 
        || $request.socket.remoteAddress 
        || ($request.connection.socket && $request.connection.socket.remoteAddress))) {

        var e = 'OH, FUCK!';
        throw new Error(e);
    }

    var ip = $request.headers['x-forwarded-for']
        || $request.connection.remoteAddress 
        || $request.socket.remoteAddress 
        || ($request.connection.socket && $request.connection.socket.remoteAddress);

    if (u.isArray(ip)) {
        
        ip = ip[0];
    }
    
    $request.ip = ip;
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
    var reqPath = '';
    if (components.length > 1) {

        reqPath = components[1];
    }

    var reqParams = reqPath.split('&');
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

/**
 * Generates a random number i a given range
 * 
 * @param $low integer
 * @param $high integer
 * @result integer
 */
var _randomInt
= me.randomInt = function f_SFFM_randomInt($low, $high) {

    return (Math.random() * ($high - $low) + $low) |0;
}

/**
 * Generate random string
 * 
 * @param $length integer
 * @param $chars string
 *   Pool of characters to use.
 *   If you have one character more often than another, the probability of it occuring will increase in the same amount
 * @result string
 */
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

/**
 * Find out if the client is connected via HTTP over TLS
 * 
 * @param $request object
 * @result boolean
 */
var _isHTTPS 
= me.isHTTPS = function f_SFFM_isHTTPS($request) {
    
    var s = $request.headers.host.substr(0, 5);
    if (s === 'https') {

        return true;
    }

    return false;
};

/**
 * Check if a module is available
 * 
 * @todo Try..catch is a little dirty. For now it works, but maybe it can be improved?
 * @param string $module
 * @result boolean
 */
var _isModuleAvailable 
= me.isModuleAvailable = function f_SFFM_isModuleAvailable($module) {
    
    var r = true;
    try {

        require.resolve($module);
    }
    catch ($e) {

        r = false;
    }

    return r;
};
