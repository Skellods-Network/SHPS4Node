"use strict";

/**
 * SHPS Main<br>
 * This file is part of the Skellods Homepage System. It must not be distributed
 * without the licence file or without this header text.
 * 
 * 
 * @author Marco Alka <admin@skellods.de>
 * @copyright (c) 2013, Marco Alka
 * @license privat_Licence.txt Privat Licence
 * @link http://skellods.de Skellods
 */


var me = module.exports;

GLOBAL.SHPS_ = 1;
GLOBAL.SHPS_MAJOR_VERSION = 3;
GLOBAL.SHPS_MINOR_VERSION = 1;
GLOBAL.SHPS_PATCH_VERSION = 0;
GLOBAL.SHPS_VERSION = SHPS_MAJOR_VERSION + '.' + SHPS_MINOR_VERSION + '.' + SHPS_PATCH_VERSION;
GLOBAL.SHPS_INTERNAL_NAME = 'BYAKUEI';

var fs = require('fs');
var async = require('async');
var colors = require('colors');
var helper = require('./helper.js');
var https = require('http2');
var http = require('http');

var log = require('./log.js');
var request = require('./request.js');
var cmd = require('./commandline.js');


var config = [];
var debug = false;
var directories = {};
var domain = '';


/**
 * Get directory path
 * 
 * @param string $key
 * @return string|void
 */
var _getDir
= me.getDir = function ($key) {
    
    if (directories.hasOwnProperty($key)) {
        
        return directories.$key;
    }
    else return;
}

/**
 * Get full domain with subdomain
 * 
 * @return string
 */
var _getDomain
= me.getDomain = function () {
    
    return domain;
}

/**
 * Get setting from config file
 *
 * @param $group
 * @param $key
 * @param $domain
 * @return void|string|int|boolean
 */
var _getHPConfig
= me.getHPConfig = function ($group, $key, $domain) {
    
    if (typeof domain[$domain] !== 'undefined' &&
        typeof domain[$domain].$group !== 'undefined' &&
        typeof domain[$domain].$group.$key !== 'undefined') {

            return domain[$domain].$group.$key;
    }

    return;
}

/**
 * Return singelton instance
 * 
 * @return SHPS_main
 */
var _getInstance
= me.getInstance = function () {
    
    init();
    return e;
};

/**
 * Initialize the system
 *
 * @param SHPS_domain $domain
 */
var _init
= me.init = function () {
    
    if (typeof _init.initialized !== 'undefined') return;
    
    _init.initialized = true;
    log.write('Please wait while we initialize SHPS for you... it won\'t take long ;)\n');
    async.series([
        //update  //log.write('Checking for new versions...');
        _readConfig
        //,loadPlugins  //log.write('Preparing plugins...');
        ,_listen
    ], function ($err) {
    
        log.write('\nWe done here! SHPS at your service - what can we do for you?');
        log.writeInfo();
        cmd.handleRequest();
    });
}

/**
 * Return debug status
 * 
 * @return Boolean
 */
var _isDebug
= me.isDebug = function () {
    
    return debug;
}

/**
 * Listen for HTTP or HTTPS connections
 *
 * @param callable $cb Callback
 * @todo: find wrong config when ssl_port is configured for used http_port or vice-versa
 */
var _listen
= me.listen = function ($cb) {
    
    log.write('Starting servers...');

    var port = [];
    
    for (var $c in config) {
        
        if (config[$c].General_Config.use_ssl) {

            var p = config[$c].General_Config.SSL_port;
            if (port.indexOf(p) == -1) {
                
                https.createServer({
                    key: fs.readFileSync('./cert/' + config[$c].SSL_Config.key),
                    cert: fs.readFileSync('./cert/' + config[$c].SSL_Config.cert),
                    ca: fs.readFileSync('./cert/' + config[$c].SSL_Config.ca),
                    
                    //windowSize: 1024 * 1024,
                    
                    //autoSpdy31: true
                }, function ($res, $req) {
                    
                    var conf = config[$c];
                    request.handleRequest($res, $req, conf);
                })
                .listen(p);
                
                log.write('HTTP/2.0 ' + String.fromCharCode(0x300C) + '\u300C?SSL? port opened on ' + p);
                port += p;
            }
        }

        if (config[$c].General_Config.use_http) {
            
            var p = config[$c].General_Config.HTTP_port;
            if (port.indexOf(p) == -1) {
                
                http.createServer(function ($res, $req) {
                    
                    var conf = config[$c];
                    request.handleRequest($res, $req, conf);
                })
                .listen(p);
                
                log.write('HTTP/1.1 port opened on ' + p);
                port += p;
            }
        }
    }

    $cb();
}

/**
 * Make homepage from templates
 *
 * @param {RequestState} $requestState
 * @param string $firstTemplate //Default: site
 */
var _make 
= me.make = function ($requestState, $firstTemplate) {
    $firstTemplate = typeof $firstTemplate !== 'undefined' ? $firstTemplate : 'site';
    
    // Read from cache

}

/**
 * Read all config files and store them
 *
 * @param callable $cb Callback
 * @todo: if no config available: ask user to input config step-by-step and write config file
 */
var _readConfig
= me.readConfig = function ($cb) {
    
    log.write('Detecting configurations...');

    var dir = './system/config/';
    fs.readdir(dir, function ($err, $files) {

        if ($err) {

            log.error($err);
        }
        
        async.forEach($files, function ($file, $callback) {
            
            fs.readFile(dir + $file, 'utf-8', function ($err, $data) {
                
                if ($err) {
                    
                    log.error($err);
                }

                log.write('Config file found: ' + $file.green);
                
                var c = '';
                try {

                    c = JSON.parse($data);
                }
                catch ($e) {
                    
                    log.write('Config file was ' + 'invalid'.red.bold + '! ' + 'SKIPPED'.red.bold);
                }

                if (c !== '') {
                    
                    config[helper.SHPS_domain(c.General_Config.URL).host] = c;
                    
                    log.write('Config file was ' + 'loaded successfully'.green);
                }

                $callback();
            });
        }, function ($err) {
            
            $cb();
        });
    });
}

/**
 * Set Debug behaviour<br>
 * If set to true, the system will output all debuginfo to the console
 * 
 * @param Boolean $onOff //Default: true
 */
var _setDebug
= me.setDebug = function ($onOff) {
    $onOff = typeof $onOff !== 'undefined' ? $onOff : true;

    debug = $onOff;
}
