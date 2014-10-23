"use strict";

var me = module.exports;

var url = require('url');

var log = require('./log.js');


/**
 * Domain representation class
 */
me.SHPS_domain = function ($uri) {
    
    var parsed = url.parse($uri, true, true);
    /*var a = parsed.host.split('.');
    
    parsed.tld = a[a.length - 1];
    a.splice(a.length - 1, 1);
    parsed.sld = a[a.length - 1];
    a.splice(a.length - 1, 1);
    if (a.length > 0) {
        
        parsed.sub = a.join('.'); 
    }
    
    parsed.toString = function () {
        
        return this.href;
    };*/

    if (parsed.host === null) {
     
        parsed.host = 'localhost';
    }

    return parsed;
}

/**
 * Contains state of request:
 * - Domain info
 * - GET and POST variables
 */
me.requestState = function () {

    return {
        
        _data: {
            
            locked: false,
            uri: '',
            GET: {},
            POST: {},
            SESSION: {},
            config: {},
        },
        
        get locked() {
            
            return this._data.locked;
        },
        
        set locked($locked) {
            
            this._data.locked = true;
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
}