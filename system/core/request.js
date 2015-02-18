'use strict';

var me = module.exports;

var main = require('./main.js');
var io = require('./io.js');
var plugin = require('./plugin.js');
var helper = require('./helper.js');
var cookie = require('./cookie.js');

var self = this;


var _handleRequest 
= me.handleRequest = function handleRequest($requestState) {
    
    $requestState.httpStatus = 501;
    $requestState.COOKIE = cookie.getCookies($requestState);

    var unblock;
    if (typeof $requestState.GET['favicon.ico'] !== 'undefined') {

        // annoying browsers ask for favicon.ico if not specified... have to handle this...
    }
    else if (typeof $requestState.GET['request'] !== 'undefined') {

        // handle request
    }
    else if (typeof $requestState.GET['plugin'] !== 'undefined') {
        
        // call plugin
        unblock = plugin.callPluginEvent('onDirectCall', $requestState.GET['plugin'], $requestState);
    }
    else if (typeof $requestState.GET['file'] !== 'undefined') {

        // serve file
    }
    else if (typeof $requestState.GET['js'] !== 'undefined') {

        // present JS
    }
    else if (typeof $requestState.GET['css'] !== 'undefined') {

        // render css
    }
    else if (typeof $requestState.GET['site'] !== 'undefined') {

        // transmit site
    }
    else if (typeof $requestState.GET['HTCPCP'] !== 'undefined') {
        
        if (main.getHPConfig('eastereggs')) {
            
            $requestState.httpStatus = 418;
            $requestState.responseType = 'text/plain';
            $requestState.responseBody = 'ERROR 418: I\'m a teapot!';
        }
    }
    else {
        
        // if they don't know what they want, they should just get the index site...
        $requestState.GET['site'] = $requestState.config.generalConfig.indexContent.value;
        // transmit site
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
        
        var bodyLengthMatch = encodeURIComponent($requestState.responseBody).match(/%[89ABab]/g);
        var cl = $requestState.responseBody.length + (bodyLengthMatch ? bodyLengthMatch.length : 0);

        $requestState.result.writeHead($requestState.httpStatus, {

            'Content-Type': $requestState.responseType + '; charset=utf-8',
            'Server': 'SHPS',
            'Set-Cookie': cookie.getChangedCookies($requestState),
            'Age': 0, // <-- insert time since caching here
            'Cache-Control': 3600,  // <-- make this an option in the config file
            'Content-Encoding': 'identity', // <-- gzip larger content. Cache gzipped version only!
            'Content-Language': 'en', // <-- use lang.getLanguage()
            'Content-Length': cl,
            // 'Content-MD5': <-- use for big files
            // 'Etag': <-- insert cache token here (change token whenever the cache has to be rebuild)
            // 'Strict-Transport-Security': 'max-age=16070400; includeSubDomains' <-- only for HTTPS

            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'X-Powered-By': 'SHPS',

        });

        $requestState.result.end($requestState.responseBody);
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
