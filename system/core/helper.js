"use strict";

var me = module.exports;

var url = require('url');
var promise = require('promise');
var qs = require('querystring');
var u = require('util');

var log = require('./log.js');
var request = require('./request.js');

var mp = {
    self: this
};


/**
 * Domain representation class
 */
me.SHPS_domain = function ($uri) {
    
    var parsed = url.parse($uri, true, true);
    if (parsed.href.substring(0, 9) === 'localhost') {
        
        parsed.host = 'localhost';
    }

    var a = parsed.host.split('.');

    parsed.tld = a[a.length - 1];
    a.splice(a.length - 1, 1);
    parsed.sld = a[a.length - 1];
    a.splice(a.length - 1, 1);
    if (a.length > 0) {
        
        parsed.sub = a.join('.'); 
    }
    
    parsed.toString = function () {
        
        return this.href;
    };

    return parsed;
}

/**
 * Contains state of request:
 * - Domain info
 * - GET and POST variables
 */
me.requestState = function () {
    
    var _lem = 'Tried to write to locked state!';
    var _data = {
        
        locked: false,
        uri: '',
        path: '/',
        GET: null,
        POST: null,
        SESSION: null,
        config: null,
        site: '',
        namespace: 'default',
        httpStatus: 500,
        responseType: 'text/plain',
        responseBody: '',
        request: null,
        result: null,
    };
    
    /* Gotta make this work somehow... sometime
    var _dKeys = Object.keys(_data);
    var i = 0;
    while (i < _dKeys.length) {

        this.__defineGetter__(_dKeys[i], function () {
            
            var index = i;
            return _data[_dKeys[index]];
        });

        this.__defineSetter__(_dKeys[i], function ($val) {
            
            var index = i;
            if (_data.locked) {

                log.error(_lem);
            }
            else {

                _data[_dKeys[index]] = $val;
            }
        });
    }
    */

    var __getData =
    this._getData = function () {
        
        return _data;
    }
    
    this.__defineGetter__("locked", function () {
        
        return _data.locked;
    });
    
    this.__defineSetter__("locked", function ($locked) {
        
        if (_data.locked || $locked) {
            
            _data.locked = true;
        }
        
        return _data.locked;
    });
    
    this.__defineGetter__("uri", function () {
        
        return _data.uri;
    });
    
    this.__defineSetter__("uri", function ($uri) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.uri = $uri;
        }
    });
    
    this.__defineGetter__("path", function () {
        
        return _data.path;
    });
    
    this.__defineSetter__("path", function ($path) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.path = $path;
        }
    });
    
    this.__defineGetter__("GET", function () {
        
        if (_data.GET === null) {
            
            _data.GET = [];
            var request = _data.path.split('?');
            var reqPath = request[0];
            if (reqPath[0] == '/') {
                
                reqPath = reqPath.substring(1);
            }
            
            var reqParams = reqPath.split('/');
            var i = 0;
            
            while (typeof reqParams[i] !== 'undefined') {
                
                var kvp = reqParams[i].split('=');
                if (kvp.length == 1) {
                    
                    _data.GET[kvp[0]] = true;
                }
                else if (kvp.length == 2) {
                    
                    _data.GET[kvp[0]] = kvp[1];
                }
                else {
                    
                    var j = 1;
                    while (typeof kvp[j] !== 'undefined') {
                        
                        _data.GET[kvp[0]] += kvp[j];
                        j++;
                    }
                }
                
                i++;
            }
        }
        
        return _data.GET;
    });
    
    this.__defineSetter__("GET", function ($GET) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.GET = $GET;
        }
    });
    
    this.__defineGetter__("POST", function () {
        
        var prom = new promise.Promise();
        if (_data.POST === null) {
            
            var queryData = '';
            
            if ($requestState.request.method == 'POST') {
                
                $requestState.request.on('data', function func_processPost_onData(data) {
                    
                    queryData += data;
                    if (queryData.length > 1e6) { // can only handle requests smaller than 1e6 == 1MB
                        
                        queryData = "";
                        $requestState.response.writeHead(413, { 'Content-Type': 'text/plain' }).end();
                        $requestState.request.connection.destroy();
                        prom.reject();
                    }
                });
                
                $requestState.request.on('end', function func_processPost_onEnd() {
                    
                    prom.resolve(querystring.parse(queryData));
                });

            }
            
            return prom.then(function ($r) {
                
                _data.POST = $r;
                return $r;
            });
        }
        else {
            
            return _data.POST;
        }
    });
    
    this.__defineSetter__("POST", function ($POST) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.POST = $POST;
        }
    });
    
    this.__defineGetter__("SESSION", function () {
        
        return _data.SESSION;
    });
    
    this.__defineSetter__("SESSION", function ($SESSION) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.SESSION = $SESSION;
        }
    });
    
    this.__defineGetter__("config", function () {
        
        return _data.config;
    });
    
    this.__defineSetter__("config", function ($config) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.config = $config;
        }
    });
    
    this.__defineGetter__("site", function () {
        
        return _data.site;
    });
    
    this.__defineSetter__("site", function ($site) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.site = $site;
        }
    });
    
    this.__defineGetter__("namespace", function () {
        
        return _data.namespace;
    });
    
    this.__defineSetter__("namespace", function ($ns) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.namespace = $ns;
        }
    });
    
    this.__defineGetter__("httpStatus", function () {
        
        return _data.httpStatus;
    });
    
    this.__defineSetter__("httpStatus", function ($val) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.httpStatus = $val;
        }
    });
    
    this.__defineGetter__("responseBody", function () {
        
        return _data.responseBody;
    });
    
    this.__defineSetter__("responseBody", function ($val) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.responseBody = $val;
        }
    });
    
    this.__defineGetter__("responseType", function () {
        
        return _data.responseType;
    });
    
    this.__defineSetter__("responseType", function ($val) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.responseType = $val;
        }
    });
    
    this.__defineGetter__("request", function () {
        
        return _data.request;
    });
    
    this.__defineSetter__("request", function ($val) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.request = $val;
        }
    });
    
    this.__defineGetter__("result", function () {
        
        return _data.result;
    });
    
    this.__defineSetter__("result", function ($val) {
        
        if (_data.locked) {
            
            log.error(_lem);
        }
        else {
            
            _data.result = $val;
        }
    });
};

/**
 * Grouphuggable
 * https://github.com/php-fig/fig-standards/blob/master/proposed/psr-8-hug/psr-8-hug.md
 * Breaks after when $breakCondition returns false
 * 
 * @param $hug object
 *  Huggable caller
 *  
 * @param $self object
 *  Hugged object
 *  
 * @param $breakCondition function(int)
 *  break condition (returns false on break)
 *  Takes number of preceded hugs from specific partner as first parameter
 */
var _genericHug 
= me.genericHug = function f_helper_genericHug($h, $self, $breakCondition) {
    
    if (typeof $self.hug.lastPartner === 'undefined') {
        
        $self.hug.lastPartner = [];
    }
    
    if (typeof $self.hug.lastPartner[$self] === 'undefined') {
        
        $self.hug.lastPartner[$self] = $h;
    }
    
    if (typeof $self.hug.count === 'undefined') {
        
        $self.hug.count = [];
    }

    if ($self.hug.lastPartner[$self] != $h) {
        
        $self.hug.lastPartner[$self] = $h;
        $self.hug.count[$self] = [];
    }
    
    if (typeof $self.hug.count[$self] === 'undefined') {

        $self.hug.count[$self] = [];
    }
    
    if (!u.isArray($h)) {
        
        $h = [$h];
    }
    
    var i = 0;
    var l = $h.length;
    while (i < l) {
        
        if (!$self.hug.count[$self][$h[i]]) {
            
            $self.hug.count[$self][$h[i]] = 0;
        }
        
        $self.hug.count[$self][$h[i]]++;
        if (!$breakCondition($self.hug.count[$self][$h[i]])) {
            
            i++;
            continue;
        }
        
        $h[i].self.hug($self);
        i++;
    }

    return $self;
};

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_helper_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};