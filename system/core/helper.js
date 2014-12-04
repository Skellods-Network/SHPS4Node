"use strict";

var me = module.exports;

var url = require('url');

var log = require('./log.js');


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
me.requestState = {
    
    _data: {

        locked: false,
        uri: '',
        GET: {},
        POST: {},
        SESSION: {},
        config: {},
    },

    get locked() {
        
        return locked;
    },

    set locked($locked) {
        
        if (this._data.locked || $locked) {
            
            this._data.locked = true;
        }
        
        return this._data.locked;
    },
    
    get uri() {
        
        return this._data.uri;
    },
    
    set uri($uri) {
        
        if (this._data.locked) {
            
            log.error('Tried to write to locked state!');
        }
        else {
            
            this._data.uri = $uri;
        }
    },

    get GET() {
    
        return this._data.GET;
    },

    set GET($GET) {

        if (locked) {
            
            log.error('Tried to write to locked state!');
        }
        else {

            this._data.GET = $GET;
        }
    },

    get POST() {
        
        return this._data.POST;
    },
    
    set POST($POST) {
        
        if (this._data.locked) {
            
            log.error('Tried to write to locked state!');
        }
        else {
            
            this._data.POST = $POST;
        }
    },

    get SESSION() {
        
        // if empty, fill session
        return this._data.SESSION;
    },
    
    set SESSION($SESSION) {
        
        if (this._data.locked) {
            
            log.error('Tried to write to locked state!');
        }
        else {
            
            this._data.SESSION = $SESSION;
        }
    },

    get config() {
        
        // if empty, fill session
        return this._data.config;
    },
    
    set config($config) {
        
        if (this._data.locked) {
            
            log.error('Tried to write to locked state!');
        }
        else {
            
            this._data.config = $config;
        }
    },
}