'use strict';

var me = module.exports;

var oa = require('object-assign');
var util = require('util');
var zip = require('zlib');
var q = require('q');
var crypt = require('crypto');
var streams = require('stream');

var css = require('./css.js');
var main = require('./main.js');
var file = require('./file.js');
var optimize = require('./optimize.js');
var plugin = require('./plugin.js');
var helper = require('./helper.js');
var cookie = require('./cookie.js');
var make = require('./make.js');
var SFFM = require('./SFFM.js');
var scheduler = require('./schedule.js');
var lang = require('./language.js');

var self = this;


var _handleRequest 
= me.handleRequest = function handleRequest($requestState) {
    
    $requestState.httpStatus = 501;
    $requestState.POST;

    var unblock;
    if (typeof $requestState.config === 'undefined') {
        
        $requestState.response.writeHead(404, { 'Server': 'SHPS' });
        $requestState.response.end('The requested domain is not configured!');
        $requestState.resultPending = false;
    }
    else {
        $requestState.site = $requestState.GET['site'] ? $requestState.GET['site']
                                                       : $requestState.config.generalConfig.indexContent.value;
        
        var siteHandler = function ($loop) {
            
            // "Do Not Track"-handling. We're nice, ain't we :)
            if ($requestState.request.headers['dnt'] !== '1') {
                
                $requestState.SESSION['lastSite'] = $requestState.site;
            }
            
            var defer = q.defer();
            defer.resolve($loop);

            return defer.promise;
        }

        if ($requestState.path === '/favicon.ico') {
            
            // annoying browsers ask for favicon.ico if not specified... have to handle this...
            $requestState.httpStatus = 404;
            var p = q.defer();
            p.resolve('not implemented yet');
            unblock = p.promise;
        }
        else if (typeof $requestState.GET['request'] !== 'undefined') {
            
            // handle request
            unblock = make.requestResponse($requestState, $requestState.GET['request'], typeof $requestState.GET['ns'] !== 'undefined' ? $requestState.GET['ns'] : 'default');
        }
        else if (typeof $requestState.GET['plugin'] !== 'undefined') {
            
            // call plugin
            if (plugin.pluginExists($requestState.GET['plugin'])) {
                
                unblock = plugin.callPluginEvent($requestState, 'onDirectCall', $requestState.GET['plugin'], $requestState);
            }
            else {
                
                $requestState.httpStatus = 404;
            }
        }
        else if (typeof $requestState.GET['file'] !== 'undefined') {
            
            // serve file
            unblock = file.serveFile($requestState, $requestState.GET['file']);
        }
        else if (typeof $requestState.GET['js'] !== 'undefined') {

        // present JS
        }
        else if (typeof $requestState.GET['css'] !== 'undefined') {
            
            var tmp = css.newCSS($requestState);
            unblock = tmp.handle();
        }
        else if (typeof $requestState.GET['site'] !== 'undefined') {
            
            // transmit site
            unblock = make.siteResponse($requestState, $requestState.GET['site'], $requestState.GET['ns']).then(siteHandler);
            
        }
        else if (typeof $requestState.GET['HTCPCP'] !== 'undefined' && main.getHPConfig('eastereggs')) {
            
            $requestState.httpStatus = 418;
            $requestState.responseType = 'text/plain';
            $requestState.responseBody = 'ERROR 418: I\'m a teapot!';
        }
        else {
            
            // if they don't know what they want, they should just get the index site...
            $requestState.GET['site'] = $requestState.site;
            unblock = make.siteResponse($requestState, $requestState.GET['site'], $requestState.GET['ns']).then(siteHandler, siteHandler);
        }
    }
    
    if (typeof unblock === 'undefined') {
        
        unblock = {
        
            then: function ($cb) {

                $cb();
                return this;
            },

            done: function ($cb) {
                
                if ($cb) {

                    $cb();
                }
                return this;
            }
        };
    }
    
    var errFun = function ($err) {
        
        $requestState.response.writeHead(500, { 'Server': 'SHPS' });
        $requestState.response.end($err.toString());//TODO: don't send error info -> might be sensitive data
    };

    unblock.done(function () {
        
        if (!$requestState.resultPending && !$requestState.headerPending) {
            
            return;
        }

        if ($requestState.resultPending) {
            
            $requestState.responseBody = optimize.compressStream($requestState, $requestState.responseBody, Buffer.byteLength($requestState.responseBody, 'utf8'));
        }
        
        var headers = {
            
            'Age': 0, // <-- insert time since caching here
            'Cache-Control': $requestState.config.generalConfig.timeToCache.value,
            'Content-Type': $requestState.responseType + ';charset=utf-8',
            //'Date': Date.now.toString(), // <-- automatically sent by Node.JS
            'Set-Cookie': $requestState.COOKIE.getChangedCookies(),
            
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1;mode=block',
            
            // ASVS V2 3.10
            'X-Frame-Options': 'SAMEORIGIN',
        };
        
        var trailerHeaders = {

            'Server': 'SHPS',
            'X-Powered-By': 'SHPS4Node',
            //'Content-MD5': '', // <-- useless for HTML sites. Will not implement it since it only serves the purpose of increasing latency. Will leave here as a reminder.
            // 'Etag': <-- insert cache token here (change token whenever the cache was rebuilt)
        };
        
        if (main.isDebug()) {

            trailerHeaders['X-Powered-By'] = 'SHPS4Node/' + SHPS_VERSION + SHPS_BUILD;
            trailerHeaders['X-Version'] = SHPS_VERSION;
        }
        
        if (typeof $requestState.responseHeaders !== 'undefined') {
            
            headers = oa(headers, $requestState.responseHeaders);
        }
        
        if (typeof $requestState.responseTrailers !== 'undefined') {
            
            trailerHeaders = oa(trailerHeaders, $requestState.responseTrailers);
        }
        
        var useTrailers = $requestState.request.headers.TE && $requestState.request.headers.TE.match(/trailers/i);
        if (useTrailers) {
            
            headers['Trailer'] = Object.keys(trailerHeaders).join(',');
        }
        else {
            
            headers = oa(headers, trailerHeaders);
        }
        
        if (SFFM.isHTTPS($requestState.request)) {
            
            // ASVS V2 3.15
            headers['Strict-Transport-Security'] = 'max-age=' + $requestState.config.securityConfig.STSTimeout.value;
            if ($requestState.config.securityConfig.STSIncludeSubDomains.value) {
                
                headers['Strict-Transport-Security'] += ';includeSubDomains';
            }
            
            // SSLLabs suggestion
            if ($requestState.config.TLSConfig.keypin.value != '') {
                
                //TODO: calculate the keypin with openssl
                headers['Public-Key-Pins'] = 'pin-sha256="' + $requestState.config.TLSConfig.keypin.value + '";max-age=2592000';
                if ($requestState.config.securityConfig.HPKPIncludeSubDomains.value) {
                    
                    headers['Public-Key-Pins'] += ';includeSubDomains'
                }
            }
        }
        
        var respFun = function ($lang) {
                
            if ($requestState.resultPending && typeof $requestState.responseBody === 'string') {
                    
                headers['Content-Length'] = SFFM.stringByteLength($requestState.responseBody);
            }
                
            headers['Content-Encoding'] = $requestState.responseEncoding;
            headers['Content-Language'] = $lang;
                
            if ($requestState.headerPending) {

                $requestState.response.writeHead($requestState.httpStatus, headers);
                $requestState.emit('headerSent');
            }
                
            if ($requestState.resultPending) {
                
                if (typeof $requestState.responseBody.pipe === 'function') {

                    $requestState.responseBody.pipe($requestState.response);
                }
                else {

                    $requestState.response.write($requestState.responseBody, $requestState.isResponseBinary ? 'binary'
                                                                                                            : 'utf8');
                }

                $requestState.emit('bodySent');
            }
                
            if (useTrailers) {
                  
                $requestState.response.addTrailers(trailerHeaders);
            }
                
            if ($requestState.resultPending) {
                  
                $requestState.response.end();
            }
        };

        lang.newLang($requestState).getLanguage().done(respFun, function ($err) {
                        
            respFun('na');        
        });
    }, errFun);
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
