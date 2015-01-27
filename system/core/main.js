'use strict';

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

/**
 * Points of Interest
 * 
 * Performance array vs object: http://stackoverflow.com/questions/8423493/what-is-the-performance-of-objects-arrays-in-javascript-specifically-for-googl
 */

var me = module.exports;

GLOBAL.SHPS_ = 1;
GLOBAL.SHPS_MAJOR_VERSION = 4;
GLOBAL.SHPS_MINOR_VERSION = 0;
GLOBAL.SHPS_PATCH_VERSION = 0;
GLOBAL.SHPS_BUILD = 'ALPHA';
GLOBAL.SHPS_INTERNAL_NAME = 'IROKOKOU';
GLOBAL.SHPS_VERSION = SHPS_MAJOR_VERSION + '.' + SHPS_MINOR_VERSION + '.' + SHPS_PATCH_VERSION;

GLOBAL.SHPS_DIR_PLUGINS = 0;
GLOBAL.SHPS_DIR_CERTS = 1;
GLOBAL.SHPS_DIR_CONFIGS = 2;


var fs = require('fs');
var async = require('vasync');
var colors = require('colors');
var https = require('http2');
var http = require('http');
var path = require('path');
var cluster = require('cluster');
var os = require('os');

var scheduler = require('./schedule.js');
var optimize = require('./optimize.js');
var helper = require('./helper.js');
var log = require('./log.js');
var request = require('./request.js');
var cmd = require('./commandline.js');
var sql = require('./sql.js');
var plugin = require('./plugin.js');
var cl = require('./commandline.js');

var config = [];
var master = [];
var debug = false;
var domain = [];
var self = this;

/**
 * Get directory path
 * 
 * @param string $key
 * @return string|void
 */
var _getDir
= me.getDir = function ($key) {
    
    var r = null;
    switch ($key) {

        case SHPS_DIR_PLUGINS: r = path.dirname(require.main.filename) + '/system/plugins/'; break;
        case SHPS_DIR_CERTS: r = path.dirname(require.main.filename) + '/cert/'; break;
        case SHPS_DIR_CONFIGS: r = path.dirname(require.main.filename) + '/config/'; break;
    }

    if (r !== null) {
    
        r = path.normalize(r);    
    }

    return r;
};

var _printVersion 
= me.printVersion = function () {
    
    /*let*/var build = SHPS_BUILD;
    if (build != '') {
        
        build = ' ' + build;
    }

    log.write('You are currently running SHPS v' + SHPS_VERSION.cyan.bold + build.yellow + ', but please call her ' + SHPS_INTERNAL_NAME.cyan.bold + '!');
};

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
};

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
= me.init = function func_init () {
    
    if (typeof _init.initialized !== 'undefined') return;
    
    _init.initialized = true;
    log.write('Please wait while we initialize SHPS for you... it won\'t take long ;)\n');
    async.pipeline({
        
        'funcs': [
            //update  //log.write('Checking for new versions...');
            function f_init_readConfig($_p1, $_p2) { _readConfig($_p2); }
            , function f_init_loadPlugins($_p1, $_p2) { plugin.loadPlugins($_p2); }
            , function f_init_parallelize($_p1, $_p2) { _parallelize($_p2); }
            , function f_init_event($_p1, $_p2) {
                
                log.write('');
                scheduler.sendSignal('onMainInit', $_p1);
                $_p2();
            }
        ]
    }, function func_init_done ($err) {
    
        log.write('\nWe done here! SHPS at your service - what can we do for you?');
        cmd.handleRequest();
    });
}

var _parallelize = function ($cb) {
    
    var numWorkers = master.workers.value;
    if (numWorkers == -1) {
        
        numWorkers = os.cpus().length; // Smart regulation later on
    }

    if (cluster.isMaster && numWorkers > 0) {
        
        for (var i = 1; i < numWorkers; i++) {

            var worker = cluster.fork();

            worker.on('message', function ($msg) {

                if ($msg.cmd && $msg.cmd == 'workerOptimizeRequest') {

                    optimize.handleWorkerMessage($msg.data.event, $msg.data.params);
                }
            });

            cluster.on('online', function ($worker) {
            
                log.write('Worker ' + $worker.id + ' is now ' + 'online'.green);
                cl.prompt();
            });
        }

        $cb();
    }
    else {

        _listen($cb);
    }
};

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
    
    log.write('\nStarting servers...');
    
    var port = [];
    
    for (var $c in config) {
        
        if (config[$c].generalConfig.useHTTP1.value) {
        
            var p = config[$c].generalConfig.HTTP1Port.value;
            if (port.indexOf(p) == -1) {
                    
                http.createServer(function ($req, $res) {
                        
                    var rs = new helper.requestState();
                    var domain = new helper.SHPS_domain($req.headers.host);
                    rs.uri = domain.host;
                    rs.config = _getConfig(rs.uri);
                    rs.path = $req.url;
                    rs.request = $req;
                    rs.result = $res;
                    request.handleRequest(rs);
                })
            .listen(p);
                    
                log.write('HTTP/1.1 port opened on ' + (p + '').green);
                port += p;
                scheduler.sendSignal('onListenStart', 'HTTP/1.1', p);
            }
        }
        
        if (config[$c].generalConfig.useHTTP2.value) {

            var p = config[$c].generalConfig.HTTP2Port.value;
            if (port.indexOf(p) == -1) {
                
                https.createServer({
                    key: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].SSLConfig.key.value),
                    cert: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].SSLConfig.cert.value),
                    ca: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].SSLConfig.ca.value)
                }, function ($res, $req) {
                    
                    var rs = new helper.requestState();
                    var domain = new helper.SHPS_domain($req.headers.host);
                    rs.uri = domain.host;
                    rs.config = _getConfig(rs.uri);
                    rs.path = $req.url;
                    rs.request = $req;
                    rs.result = $res;
                    
                    request.handleRequest(rs);
                })
                .listen(p);
                
                log.write('HTTP/2.0 port opened on ' + (p + '').green);
                port += p;
                scheduler.sendSignal('onListenStart', 'HTTP/2.0', p);
            }
        }
    }
    
    scheduler.sendSignal('onServerStart', port);

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
    
    plugin.callEvent('onBeforeMake', $template2Start, $requestState);

    async.waterfall([
        
        function f_main_make_wf_1 ($cb) {
            
            var _sql = sql.newSQL('default', $requestState)
            if (typeof _sql !== 'undefined') {
                
                $cb(null, _sql);
            }
            else {
                
                $cb('ERROR: Failed to connect to the DB server');
            }
        },
    
        function f_main_make_wf_2 ($sql, $cb) {
            
            var rowsTemplate = [false];
            var rowsContent = [false];
            async.pipeline({
                
                'funcs': [

                    function f_main_make_wf_2_1 ($_p1, $cb) {
                        
                        var tblTemplate = $sql.openTable('template');
                        var tblNamespace = $sql.openTable('namespace');
                        $sql.query()
                            .get(tblTemplate.col('content'))
                            .fulfilling()
                            .equal(tblTemplate.col('name'), $template2Start)
                            .equal(tblTemplate.col('namespace'), tblNamespace.col('ID'))
                            .equal(tblNamespace.col('name'), _getNamespace($requestState))
                            .execute()
                            .then(function f_main_make_wf_2_1_then($rows) {
                            
                                rowsTemplate = $rows;
                                $cb();
                            }, function f_main_make_wf_2_1_else($p1) {
                            
                                log.error('ERROR: Failed to get initial template ' + $p1);
                                $cb();
                            });
                    },

                    function f_main_make_wf_2_2 ($cb) {
                        
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
                            .then(function f_main_make_wf_2_2_then($rows) {
                            
                                rowsContent = $rows;
                                $cb();
                            }, function f_main_make_wf_2_2_else($p1) {
                            
                                log.error('ERROR: Failed to get initial template ' + $p1);
                                $cb();
                            });
                    }
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
            
            plugin.callEvent('onAfterMake', $template2Start, $requestState);
            
            $cb(null, body)
        },
    ], function () {

        scheduler.sendSignal('onMake', $requestState);
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
= me.readConfig = function f_main_readConfig($cb) {
    
    log.write('Detecting configurations...');
    
    var dir;
    if(!(dir = _getDir(SHPS_DIR_CONFIGS))) {

        log.writeError("Could not retrive config directory!");
        return false;
    }

    fs.readdir(dir, function ($err, $files) {

        if ($err) {

            log.error($err);
        }
        
        async.forEachParallel( {
        
            'inputs': $files,
            'func': function ($file, $callback) {
                
                if ($file.substring($file.length - 5) != '.json') {
                    
                    i++;
                    schedule.sendSignal('onFilePollution', dir, 'config', $file);
                    $callback();
                    return;
                }

                fs.readFile(dir + $file, 'utf8', function ($err, $data) {
                    
                    if ($err) {
                        
                        log.error($err);
                    }
                    
                    log.write('Config file found: ' + $file);
                    
                    var c = '';
                    var status = false;
                    try {
                        
                        c = JSON.parse($data);
                        switch (c.configHeader.type) {

                            case 'master': {

                                log.write('Master file was ' + 'loaded successfully'.green);
                                master = c.config;
                                break;
                            }

                            case 'hp': {
                                
                                config[helper.SHPS_domain(c.generalConfig.URL.value).host] = c;
                                log.write('Config file `' + $file + '` was ' + 'loaded successfully'.green);
                                break;
                            }
                        }

                        status = true;
                    }
                    catch ($e) {
                        
                        log.write('Config file `' + $file + '` was ' + 'invalid'.red.bold + '! ' + 'SKIPPED'.red.bold);
                    }
                    finally {
                        
                        scheduler.sendSignal('onConfigLoaded', $file, status, c);
                    }
                    
                    
                    $callback();
                });
            }
        }, function ($err) {
            
            if (typeof $cb !== 'undefined') {
                
                $cb();
            }
        });
    });

    return true;
};

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
    $onOff = typeof $onOff !== 'undefined' 
 $onOff : true;

    debug = $onOff;
    scheduler.sendSignal('onDebugChange', $onOff);
}

/**
 * Tries to determine if SHPS is running on io.js or node.js
 */
var _isIOJS
= me.isIOJS = function f_main_isIOJS() {
    
    f_main_isIOJS.isIOJS = f_main_isIOJS.isIOJS || path.basename(process.title, '.exe') == 'iojs';
    return f_main_isIOJS.isIOJS;
}

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_main_hug($h) {
    
    return helper.genericHug($h, self, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};


/**
 * Focus all actions on a given requestState
 * Basically this is a wrapper so web developers don't have to worry about which domain their scripts are served to
 *
 * @param requestState $requestState
 */
var _focus 
= me.focus = function f_main_focus($requestState) {
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot focus undefined requestState!');
    }
    
    
    this.getDir = function f_main_focus_getDir($key) {
        
        return _getDir($key);
    };
    
    this.getHPConfig = function f_main_focus_getHPConfig($group, $key) {
        
        return _getHPConfig($group, $key, $requestState.config.generalConfig.URL.value);
    };
    
    this.getInstance = function f_main_focus_getInstance() {
        
        return this;
    };
    
    this.getNamespace = function f_main_focus_getNamespace() {
        
        return _getNamespace($requestState);
    };
    
    this.isDebug = function f_main_focus_isDebug() {
        
        return _isDebug();
    };
    
    this.make = function f_main_focus_make($template2Start) {
        
        return _make($template2Start, $requestState);
    };
    
    this.readConfig = function f_main_focus_readConfig($cb) {
        
        return _readConfig($cb);
    };
    
    this.setDebug = function f_main_focus_setDebug($onOff) {
        
        return _setDebug($onOff);
    };
};


