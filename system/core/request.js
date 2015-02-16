'use strict';

var me = module.exports;

var main = require('./main.js');
var io = require('./io.js');
var plugin = require('./plugin.js');
var helper = require('./helper.js');

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
            
        $requestState.result.writeHead($requestState.httpStatus, {

            'Content-Type': $requestState.responseType
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
