'use strict';

var me = module.exports;

var oa = require('object-assign');
var util = require('util');
var zip = require('zlib');
var q = require('q');
var crypt = require('crypto');

var main = require('./main.js');
var io = require('./io.js');
var plugin = require('./plugin.js');
var helper = require('./helper.js');
var cookie = require('./cookie.js');
var make = require('./make.js');
var SFFM = require('./SFFM.js');
var lang = require('./language.js');

var self = this;


var _handleRequest 
= me.handleRequest = function handleRequest($requestState) {
    
    $requestState.httpStatus = 501;

    var unblock;
    if (typeof $requestState.GET['favicon.ico'] !== 'undefined') {

        // annoying browsers ask for favicon.ico if not specified... have to handle this...
    }
    else if (typeof $requestState.GET['request'] !== 'undefined') {

        // handle request
        unblock = make.requestResponse($requestState, $requestState.GET['request'], typeof $requestState.GET['ns'] !== 'undefined' ? $requestState.GET['ns'] : 'default');
    }
    else if (typeof $requestState.GET['plugin'] !== 'undefined') {
        
        // call plugin
        if (plugin.pluginExists($requestState.GET['plugin'])) {
            
        unblock = plugin.callPluginEvent('onDirectCall', $requestState.GET['plugin'], $requestState);
    }
        else {

            $requestState.httpStatus = 404;
        }
    }
    else if (typeof $requestState.GET['file'] !== 'undefined') {

        // serve file
        unblock = io.serveFile($requestState, $requestState.GET['file']);
    }
    else if (typeof $requestState.GET['js'] !== 'undefined') {

        // present JS
    }
    else if (typeof $requestState.GET['css'] !== 'undefined') {

        // render css
    }
    else if (typeof $requestState.GET['site'] !== 'undefined') {

        // transmit site
        unblock = make.siteResponse($requestState, $requestState.GET['site'], $requestState.GET['ns']); //main.make('site', $requestState);
    }
    else if (typeof $requestState.GET['HTCPCP'] !== 'undefined' && main.getHPConfig('eastereggs')) {
        
        $requestState.httpStatus = 418;
        $requestState.responseType = 'text/plain';
        $requestState.responseBody = 'ERROR 418: I\'m a teapot!';
    }
    else {
        
        // if they don't know what they want, they should just get the index site...
        $requestState.GET['site'] = $requestState.config.generalConfig.indexContent.value;
        unblock = make.siteResponse($requestState, $requestState.GET['site'], $requestState.GET['ns']);
    }
    
    if (typeof unblock === 'undefined') {
        
        unblock = {
        
            then: function ($cb) {

                $cb();
                return this;
            },

            done: function () {

                return this;
            }
        };
    }
    
    unblock.then(function () {
        
        var bodyLengthMatch;
        if ($requestState.isResponseBinary) {
            
            bodyLengthMatch = 0;
        }
        else {
            
            bodyLengthMatch = encodeURIComponent($requestState.responseBody).match(/%[89ABab]/g);
        }
        
        var defer = q.defer();
        var tmp = Buffer.byteLength($requestState.responseBody, 'utf8');
        if ($requestState.request.headers['accept-encoding'].match(/\bgzip\b/) && Buffer.byteLength($requestState.responseBody, 'utf8') > $requestState.config.generalConfig.gzipMinSize.value) {
            
            zip.gzip($requestState.responseBody, function ($err, $buf) {
                
                $requestState.responseBody = $buf;
                $requestState.responseEncoding = 'gzip';
                defer.resolve();
            });
        }
        else {
            
            defer.resolve();
        }
        
        var headers = {
            
            'Content-Type': $requestState.responseType + ';charset=utf-8',
            'Server': 'SHPS',
            'Set-Cookie': $requestState.COOKIE.getChangedCookies(),
            'Age': 0, // <-- insert time since caching here
            'Cache-Control': $requestState.config.generalConfig.timeToCache.value,
            //'Content-MD5': '', // <-- useless. Will not implement it since it only serves the purpose of increasing latency. Will leave here as a reminder.
            // 'Etag': <-- insert cache token here (change token whenever the cache was rebuilt)
            
            'X-XSS-Protection': '1;mode=block',
            'X-Content-Type-Options': 'nosniff',
            'X-Powered-By': 'SHPS',

            // ASVS V2 3.10
            'X-Frame-Options': 'SAMEORIGIN',
        };
        
        if (typeof $requestState.responseHeaders !== 'undefined') {
         
            headers = oa(headers, $requestState.responseHeaders);
        }
        
        if (SFFM.isHTTPS($requestState.request)) {

            // ASVS V2 3.15
            headers['Strict-Transport-Security'] = 'max-age=' + $requestState.config.securityConfig.STSTimeout.value;
            if ($requestState.config.securityConfig.STSIncludeSubDomains.value) {

                headers['Strict-Transport-Security'] += ';includeSubDomains';
            }
            
            // SSLLabs suggestion
            headers['Public-Key-Pins'] = 'pin-sha256="' + $requestState.config.TLSConfig.keypin.value + '";max-age=2592000';
            if ($requestState.config.securityConfig.HPKPIncludeSubDomains.value) {
                
                headers['Public-Key-Pins'] += ';includeSubDomains'
            }
        }

        defer.promise.then(function () {
            
            lang.getLanguage($requestState).then(function ($lang) {
                
                headers['Content-Length'] = $requestState.responseBody.length + (bodyLengthMatch ? bodyLengthMatch.length : 0);
                headers['Content-Encoding'] = $requestState.responseEncoding;
                headers['Content-Language'] = $lang;
                $requestState.result.writeHead($requestState.httpStatus, headers);
                if ($requestState.isResponseBinary) {
                
                    $requestState.result.write($requestState.responseBody, 'binary');
                    $requestState.result.end();
                }
                else {
                
                    $requestState.result.end($requestState.responseBody);
                }
            }).done();
        }).done();
    }).done();
};


var _focus 
= me.focus = function f_request_focus($requestState) {

    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot focus undefined requestState!');
    }
    
    this.handleRequest = function f_request_focus_handleRequest() {
        
        _handleRequest($requestState);
    };
};

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_request_hug($h) {
    
    return helper.genericHug($h, self, function f_request_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
