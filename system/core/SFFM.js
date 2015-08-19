'use strict';

var me = module.exports;

var path = require('path');
var u = require('util');
var crypto = require('crypto');
var __ = null;
__defineGetter__('_', function () {
    
    if (!__) {
        
        __ = require('lodash');
    }

    return __;
});


var _helper = null;
__defineGetter__('helper', function () {
    
    if (!_helper) {
        
        _helper = require('./helper.js');
    }
    
    return _helper
});

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

    var re = new RegExp(Object.keys($mapObj).join('|'), 'gi');
    
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

        $request.headers['x-forwarded-for'] = 'Something went to hell in here.... So we just add a random value';
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
    
    if ($request.socket && $request.socket.ssl != undefined) {

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

/**
 * Calculate length of a string
 * The problem when using string length or even buffer length is that certain character lengths (especially asian symbols) will be counted in a wrong way for UTF8
 * That leads to too small character counts
 * This function aims to solve the problem by adding to the count when special characters are detected
 * 
 * @param $str UTF-8 String
 * @result integer
 */
var _stringByteLength 
= me.stringByteLength = function f_SFFM_stringByteLength($str) {

    if ($str.length === 'undefined') {

        return 0;
    }
    
    var i = 0;
    var c = $str.length;
    if (typeof $str !== 'array') {

        var tmp = [];
        while (i < c) {
            
            typeof $str === 'string' ? tmp.push($str.charCodeAt(i))
                                     : tmp.push($str[i]);

            i++;
        }
        
        $str = tmp;
    }
    else {

        i = c;
    }
    
    while (i > 0) {

        var code = $str[i];
        if (code > 0x7f && code <= 0x7ff) {
            
            c++;
        }
        else if (code > 0x7ff && code <= 0xffff) {
            
            if (code < 0xDC00 || code > 0xDFFF) {
                
                c += 2;
            }
        }

        i--;
    }

    return c;
};

var _canGZIP
= me.canGZIP = function ($requestState, $fileSize) {
    $fileSize = $fileSize !== undefined ? $fileSize : $requestState.config.generalConfig.gzipMinSize.value + 1;

    //TODO: This is a bad parser :(
    return  $requestState.request.headers['accept-encoding'] &&
            $requestState.request.headers['accept-encoding'].match(/\bgzip\b/) &&
            $fileSize > $requestState.config.generalConfig.gzipMinSize.value;
}