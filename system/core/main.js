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
var async = require('vasync');
var colors = require('colors');
var helper = require('./helper.js');
var https = require('http2');
var http = require('http');

var log = require('./log.js');
var request = require('./request.js');
var cmd = require('./commandline.js');
var sql = require('./sql.js');


var config = [];
var debug = false;
var directories = {};
var domain = [];

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

            return domain[$domain].$group.$key.value;
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
    async.pipeline({
        
        'funcs': [
            //update  //log.write('Checking for new versions...');
            function func_init_readConfig ($_p1, $_p2) { _readConfig($_p2); }
            //,loadPlugins  //log.write('Preparing plugins...');
            , function func_init_listen ($_p1, $_p2) { _listen($_p2); }
        ]
    }, function ($err) {
    
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
        
        if (config[$c].generalConfig.useHTTP2.value) {
            
            if (config[$c].generalConfig.useHTTP1.value) {
                
                var p = config[$c].generalConfig.HTTP1Port.value;
                if (port.indexOf(p) == -1) {
                    
                    http.createServer(function ($req, $res) {
                        
                        var rs = helper.requestState;
                        var domain = new helper.SHPS_domain($req.headers.host);
                        rs.uri = domain.host;
                        rs.config = _getConfig(rs.uri);
                        //rs.locked = true;
                        
                        request.handleRequest($req, $res, rs);
                    })
                .listen(p);
                    
                    log.write('HTTP/1.1 port opened on ' + p);
                    port += p;
                }
            }
            
            var p = config[$c].generalConfig.HTTP2Port.value;
            if (port.indexOf(p) == -1) {
                
                https.createServer({
                    key: fs.readFileSync('./cert/' + config[$c].SSLConfig.key.value),
                    cert: fs.readFileSync('./cert/' + config[$c].SSLConfig.cert.value),
                    ca: fs.readFileSync('./cert/' + config[$c].SSLConfig.ca.value)
                }, function ($res, $req) {
                    
                    var rs = helper.requestState;
                    //var domain = new helper.SHPS_domain($req.headers.host);
                    //rs.uri = domain.host;
                    //rs.config = _getConfig(rs.uri);
                    //rs.locked(true);
                    
                    request.handleRequest($res, $req, rs);
                })
                .listen(p);
                
                log.write('HTTP/2.0 port opened on ' + p);
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
= me.make = function ($template2Start, $requestState) {
    $template2Start = (typeof $template2Start !== null ? $template2Start : $requestState.config.generalConfig.rootTemplate.value);
    
    // Read from cache
    
    log.log('Starting to build the homepage');
    
    //EVENT: onBeforeMake
    //pluginEngine.callEvent('onBeforeMake', {$template2Start}, $requestState);


    async.waterfall([
        
        function func_make_wf_1 ($cb) {
            
            var _sql = sql.newSQL('default', $requestState)
            if (typeof _sql !== 'undefined') {
                
                $cb(null, _sql);
            }
            else {
                
                $cb('ERROR: Failed to connect to the DB server');
            }
        },
    
        function func_make_wf_2 ($sql, $cb) {
            
            var rowsTemplate = [false];
            var rowsContent = [false];
            async.pipeline({
                
                'funcs': [

                    function func_make_wf_2_1 ($_p1, $cb) {
                        
                        var tblTemplate = $sql.openTable('template');
                        var tblNamespace = $sql.openTable('namespace');
                        $sql.query()
                            .get(tblTemplate.col('content'))
                            .fulfilling()
                            .equal(tblTemplate.col('name'), $template2Start)
                            .equal(tblTemplate.col('namespace'), tblNamespace.col('ID'))
                            .equal(tblNamespace.col('name'), _getNamespace($requestState))
                            .execute()
                            .then(function ($rows) {
                            
                                rowsTemplate = $rows;
                                $cb();
                            }, function ($p1) {
                            
                                log.error('ERROR: Failed to get initial template ' + $p1);
                                $cb();
                            });
                    },

                    function func_make_wf_2_2 ($cb) {
                        
                        if ($requestState.GET.site == null) {
                            
                            var site = $requestState.config.generalConfig.indexContent.value;
                        }
                        else {
                            
                            var site = $requestState.GET.site;
                        }
                        
                        var tblContent = $sql.openTable('content');
                        var tblNamespace = $sql.openTable('namespace');
                        $sql.query()
                            .get(tblContent.col('content'))
                            .fulfilling()
                            .equal(tblContent.col('name'), site)
                            .equal(tblContent.col('namespace'), tblNamespace.col('ID'))
                            .equal(tblContent.col('name'), _getNamespace($requestState))
                            .execute()
                            .then(function ($rows) {
                            
                                rowsContent = $rows;
                                $cb();
                            }, function ($p1) {
                            
                                log.error('ERROR: Failed to get initial template ' + $p1);
                                $cb();
                            });
                    },
                ]
            }, function () {
                
                $cb(null, rowsTemplate, rowsContent);
            });//end parallel $template2Starts
        
        },

        function ($template, $content, $cb) {
            
            if ($template[0] === false) {
                
                return;
            }
            
            var body = $template[0].content;
            body = _parseTemplateVars(body);
            body = body.replace('{$body}', $content[0].content);
            body = _parseTemplateVars(body);
            //body = body.replace('</body>', js.getLink() + '</body>');
            //body = body.replace('</head>', css.getLink() + '</head>');
            //body = optimizer.optimize(body);
            
            // EVENT: onAfterMake
            //pluginEngine.callEvent('onAfterMake', {$template2Start}, $requestState);
            
            $cb(null, body)
        },
    ], function () {

        
    });// end waterfall
}

var _getNamespace 
= me.getNamespace = function ($requestState) {
    
    var r = 'default';
    if ($requestState.POST.ns != null) {
        
        r = $requestState.POST.ns;
    }
    else if ($requestState.GET.ns != null) {
        
        r = $requestState.GET.ns;
    }
    
    return r;
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

    var dir = './config/';
    fs.readdir(dir, function ($err, $files) {

        if ($err) {

            log.error($err);
        }
        
        async.forEachParallel( {
        
            'inputs': $files,
            'func': function ($file, $callback) {
                
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
                        
                        config[helper.SHPS_domain(c.generalConfig.URL.value).host] = c;
                        
                        log.write('Config file was ' + 'loaded successfully'.green);
                    }
                    
                    $callback();
                })
            }
        }, function ($err) {
            
            if (typeof $cb !== 'undefined') {
                
                $cb();
            }
        });
    });
}

/**
 * Get whole configuration of certain homepage
 * 
 * @param string $uri
 * @return array|null
 */
var _getConfig 
= me.getConfig = function ($uri) {
    
    return config[$uri];
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
