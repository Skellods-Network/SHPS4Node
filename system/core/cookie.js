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
    
    $requestState._COOKIE = list;

    return list;
}

var _newCookieJar 
= me.newCookieJar = function f_cookie_newCookieJar($requestState) {
    
    return new CookieJar($requestState);
};

var CookieJar = function c_CookieJar($requestState) {
    
    var _newCookies = {};

    this.getCookies = function f_cookieJar_getCookies() {

        _getCookies($requestState);
    };

    this.getChangedCookies = function f_CookieJar_getChangedCookies() {
        
        var i = 0;
        var keys = Object.keys(_newCookies);
        var l = keys.length;
        var r = [];

        while (i < l) {
            
            var cookie = _newCookies[keys[i]];
            var cs = cookie.name + '=' + cookie.value + ';Path=/;Max-Age=' + cookie.expire + ';Expires=' + (new Date((new Date()).getTime() + 1000 * cookie.expire)).toISOString();
            if ($requestState.config.generalConfig.URL.value != 'localhost') {

                cs += 'Domain=.' + $requestState.config.generalConfig.URL.value;
            }

            if (cookie.httponly) {

                cs += ';httpOnly';
            }
            
            if (cookie.secure) {

                cs += ';secure';
            }

            r.push(cs);
            i++;
        }

        return r;
    };
    
    /**
     * Sets new cookie or updates old one.
     * If you need to unset a cookie, please call this function with an expire value <= 0
     * 
     * @param $name string
     * @param $value string
     * @param $expire int
     *   Default: 0
     * @param $httponly boolean
     *   Default: true
     * @param $secure boolean
     *   Default: true if https-request
     */
    this.setCookie = function f_CookieJar_setCookie($name, $value, $expire, $httponly, $secure) {
        $expire = $expire || 0;
        $httponly = $httponly || true;
        $secure = $secure || /^https.*/i.test($requestState.domain.protocol);

        $requestState._COOKIE[$name] = $value;
        _newCookies[$name] = {
            
            name: $name,
            value: $value,
            expire: $expire,
            httponly: $httponly,
            secure: $secure
        };
    };

    this.getCookie = function f_cookieJar_getCookie($name) {

        return $requestState._COOKIE[$name];
    }
    
    
    // CONSTRUCTOR
    _getCookies($requestState);
};
