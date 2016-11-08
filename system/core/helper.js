'use strict';

var me = module.exports;

var events = require('events');
var net = require('net');
var url = require('url');
var qs = require('querystring');
var u = require('util');
var q = require('q');

var libs = require('node-mod-load').libs;

var isInitialized = false;
var mp = {
    self: this
};


/**
 * Domain representation class
 */
me.SHPS_domain = function ($uri, $prependHTTPProtocol/* = false */) {
    
    if ($prependHTTPProtocol && !/^https?\:\/\//i.test($uri)) {
        
        $uri = 'http://' + $uri;
    }

    var parsed = url.parse($uri, true, true);
    var colon = parsed.href.indexOf(':');
    
    if (parsed.hostname) {

        var a = parsed.hostname.split('.');
        
        parsed.tld = a[a.length - 1];
        a.splice(a.length - 1, 1);
        parsed.sld = a[a.length - 1];
        a.splice(a.length - 1, 1);
        if (a.length > 0) {
            
            parsed.sub = a.join('.');
        }
    }
    
    parsed.toString = function () {
        
        return parsed.href;
    };
    
    return parsed;
};

/**
 * Contains state of request:
 * - Domain info
 * - GET and POST variables
 */
 
if (parseInt(process.version[0]) <= 4) {
    
    me.requestState = function () {
        
        var self = this;
        var _GET = null;
        
        this.isDataComplete = false;
        
        this._COOKIE = {};
        this._domain = null;
        this._auth = null;
        this.cache = {};
        this.locked = false;
        this.uri = '';
        this.path = '/';
        this.FILE = {};
        this.SESSION = {};
        this.POST = {};
        this.config = null;
        this.site = '';
        this.namespace = 'default';
        this.httpStatus = 500;
        this.responseType = 'text/plain';
        this.responseHeaders = {};
        this.responseTrailers = [];
        this.isResponseBinary = false;
        this.responseBody = '';
        this.responseEncoding = 'identity';
        this.request = null;
        this.response = null;
        this.resultPending = true;
        this.headerPending = true;
        
        this.cache.__defineGetter__('auth', function () {

            if (!self._auth) {

                self._auth = libs.auth.newAuth(self);
            }

            return self._auth;
        });

        this.__defineGetter__('GET', function () {
            
            if (_GET === null) {
                
                _GET = libs.SFFM.splitQueryString(self.path);
            }
            
            return _GET;
        });
        
        this.__defineSetter__('GET', function ($val) {
            
            _GET = $val
        });

        events.EventEmitter.call(this);
    };

}
else {
    
    me.requestState = class RequestState extends events {
        
        constructor() {
        
            super();
        
            var self = this;
            var _GET = null;
            
            this.isDataComplete = false;
            
            this._COOKIE = {};
            this._domain = null;
            this._auth = null;
            this.cache = {};
            this.locked = false;
            this.uri = '';
            this.path = '/';
            this.FILE = {};
            this.SESSION = {};
            this.POST = {};
            this.config = null;
            this.site = '';
            this.namespace = 'default';
            this.httpStatus = 500;
            this.responseType = 'text/plain';
            this.responseHeaders = {};
            this.responseTrailers = [];
            this.isResponseBinary = false;
            this.responseBody = '';
            this.responseEncoding = 'identity';
            this.request = null;
            this.response = null;
            this.resultPending = true;
            this.headerPending = true;
            
            this.cache.__defineGetter__('auth', function () {

                if (!self._auth) {

                    self._auth = libs.auth.newAuth(self);
                }

                return self._auth;
            });

            this.__defineGetter__('GET', function () {
                
                if (_GET === null) {
                    
                    _GET = libs.SFFM.splitQueryString(self.path);
                }
                
                return _GET;
            });
            
            this.__defineSetter__('GET', function ($val) {
                
                _GET = $val
            });
        }
    };
}

me.newRequestState = function f_helper_newRequestState($req, $res) {

    var rs = new me.requestState();
    var host = '';
    if ($req.origin /* probably WS connection */) {

        host = $req.origin;
    }
    else if (typeof $req === 'undefined') {
        
        host = 'localhost';
    }
    else {

        host = $req.headers.host;
    }

    rs._domain = new me.SHPS_domain(host, true);
    rs.uri = rs._domain.href;
    rs.config = libs.config.getConfig(rs._domain.hostname);
    rs.path = $req.url ? $req.url : '/';
    rs.request = $req;
    rs.response = $res;
    rs.COOKIE = libs.cookie.newCookieJar(rs);

    return rs;
};

me.init = function () {

    if (!isInitialized) {

        u.inherits(me.requestState, events.EventEmitter);
        isInitialized = true;
    }

    libs.auth._state = SHPS_MODULE_STATE_RUNNING;

    return q.Promise($res => {

        $res();
    });
};
