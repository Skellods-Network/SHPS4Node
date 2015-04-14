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

GLOBAL.SHPS_DIR_ROOT = 0;
GLOBAL.SHPS_DIR_PLUGINS = 1;
GLOBAL.SHPS_DIR_CERTS = 2;
GLOBAL.SHPS_DIR_CONFIGS = 3;
GLOBAL.SHPS_DIR_UPLOAD = 4;


var fs = require('fs');
var async = require('vasync');
var colors = require('colors');
var https = require('http2');
var http = require('http');
var path = require('path');
var cluster = require('cluster');
var os = require('os');
var vm = require('vm');

var q = require('q');

var cookie = require('./cookie.js');
var scheduler = require('./schedule.js');
var optimize = require('./optimize.js');
var helper = require('./helper.js');
var log = require('./log.js');
var request = require('./request.js');
var cmd = require('./commandline.js');
var sql = require('./sql.js');
var plugin = require('./plugin.js');
var cl = require('./commandline.js');
var dInit = require('./default.js');

var dep;

var config = {};
var master = {};
var debug = false;
var domain = [];
var self = this;


scheduler.addSlot('fatalError', function () {

    process.abort();
});


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

        case SHPS_DIR_ROOT: r = path.dirname(require.main.filename) + '/'; break;
        case SHPS_DIR_PLUGINS: r = path.dirname(require.main.filename) + '/system/plugins/'; break;
        case SHPS_DIR_CERTS: r = path.dirname(require.main.filename) + '/cert/'; break;
        case SHPS_DIR_CONFIGS: r = path.dirname(require.main.filename) + '/config/'; break;
        case SHPS_DIR_UPLOAD: r = path.dirname(require.main.filename) + '/upload/'; break;
    }

    if (r !== null) {
    
        r = path.normalize(r);    
    }

    return r;
};

var _getVersionText 
= me.getVersionText = function f_main_getVersionText() {
    
    /*let*/var build = SHPS_BUILD;
    if (build != '') {
        
        build = ' ' + build;
    }

    return 'You are currently running SHPS v' + SHPS_VERSION.cyan.bold + build.yellow + ', but please call her ' + SHPS_INTERNAL_NAME.cyan.bold + '!';
};

var _printVersion 
= me.printVersion = function f_main_printVersion() {

    log.write(_getVersionText());
};

/**
 * Checks filesystem for inconsistencies, missing files or pollution
 * Only rough analysis
 * @the moment it only checks the root dir -> has to be improved
 */
var _checkFS 
= me.checkFS = function f_main_checkFS($cb) {

    log.write('Checking filesystem...');
    
    var root = _getDir(SHPS_DIR_ROOT);
    fs.readdir(root, function f_main_checkFS_rd($err, $list) {
        
        var i = 0;
        var l = $list.length;
        while (i < l) {
            
            var entry = $list[i];
            var $stat = fs.lstatSync(root + entry)

            if ($stat.isDirectory()) {
                
                if (Object.keys(dInit.fileTree).indexOf(entry) < 0) {

                    scheduler.sendSignal('onPollution', root, 'SHPS root', entry);
                }
            }
            else if (dInit.fileTree._files.indexOf(entry) < 0) {

                scheduler.sendSignal('onFilePollution', root, 'SHPS root', entry);
            }

            i++;
        }

        log.write('');
        $cb();
    });
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
        typeof domain[$domain][$group] !== 'undefined' &&
        typeof domain[$domain][$group][$key] !== 'undefined') {

        return domain[$domain][$group][$key].value;
    }
    
    if (typeof master[$group] !== 'undefined') {

        return master[$group].value;
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
            function f_init_checkFS($_p1, $_p2) { _checkFS($_p2); }
            , function f_init_readConfig($_p1, $_p2) { _readConfig($_p2); }
            , function f_init_loadPlugins($_p1, $_p2) { plugin.loadPlugins($_p2); }
            , function f_init_parallelize($_p1, $_p2) { _parallelize($_p2); }
            , function f_init_event($_p1, $_p2) {
                
                log.write('');
                dep = require('./dependency.js');
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
        
        var isPM2Installed = false;
        try {
            require.resolve('pm2');
            isPM2Installed = true;
        } catch (e) { }
        
        if (isPM2Installed) {

            numWorkers = 0; // let PM2 handle the rest
        }
        else {

            numWorkers = 0;//os.cpus().length; // Smart regulation later on
        }
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
                    rs.domain = domain;
                    rs.COOKIE = cookie.newCookieJar(rs);
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
                    key: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].TLSConfig.key.value),
                    cert: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].TLSConfig.cert.value),
                    ca: fs.readFileSync(_getDir(SHPS_DIR_CERTS) + config[$c].TLSConfig.ca.value)
                }, function ($res, $req) {
                    
                    var rs = new helper.requestState();
                    var domain = new helper.SHPS_domain($req.headers.host);
                    rs.uri = domain.host;
                    rs.config = _getConfig(rs.uri);
                    rs.path = $req.url;
                    rs.request = $req;
                    rs.result = $res;
                    rs.domain = domain;
                    rs.COOKIE = cookie.newCookieJar(rs);
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
    
    var defer = q.defer();
    // Read from cache
    
    log.log('Starting to build the homepage');
    
    //plugin.callEvent('onBeforeMake', $template2Start, $requestState);
    
    var template = [];
    var content = {};
    var body = '';
    async.waterfall([
        
        /*function f_main_make_wf_1($cb) {
            
            var _sql = sql.newSQL('default', $requestState)
            if (typeof _sql !== 'undefined') {
                
                $cb(null, _sql);
            }
            else {
                
                $cb('ERROR: Failed to connect to the DB server');
            }
        },
    
        function f_main_make_wf_2($sql, $cb) {
            
            var rowsTemplate = [false];
            var rowsContent = [false];
            async.pipeline({
                
                'funcs': [

                    function f_main_make_wf_2_1($_p1, $cb) {
                        
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

                    function f_main_make_wf_2_2($cb) {
                        
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
                        })
                            .done();
                    }
                ]
            }, function () {
                
                $cb(null, rowsTemplate, rowsContent);
            });//end parallel $template2Starts
        
        },*/
        function ($_p1, $_p2) {

            template.push({ content: 'Hellow World! - {$body}' });
            content.content = 'XXX';
            $_p1();
        },
    ], function ($err) {
        
        if (typeof template[0] === 'undefined') {
            
            return;
        }
        
        body = template[0].content;
        body = _parseTemplateVars(body);
        body = body.replace('{$body}', content.content);
        body = _parseTemplateVars(body);
        //body = body.replace('</body>', js.getLink() + '</body>');
        //body = body.replace('</head>', css.getLink() + '</head>');
        //body = optimizer.optimize(body);
        
        //plugin.callEvent('onAfterMake', $template2Start, $requestState);

        scheduler.sendSignal('onMake', body, $requestState);
        
        $requestState.responseType = 'text/html';
        $requestState.responseBody = body;
        defer.resolve();
    });// end waterfall

    return defer.promise;
};

var _parseTemplateVars = function f_main_parseTemplateVars($partial) {
    
    return $partial;
};

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
};

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
    
    var masterFound = false;
    fs.readdir(dir, function ($err, $files) {

        if ($err) {

            log.error($err);
        }
        
        async.forEachParallel({
        
            'inputs': $files,
            'func': function ($file, $callback) {
                
                var validFile = true;
                async.pipeline({
                    funcs: [
                        function ($_p1, $cb) {

                            fs.stat(dir + $file, function ($err, $stat) {

                                if ($stat && $stat.isDirectory()) {

                                    scheduler.sendSignal('onPollution', dir, 'config', $file);
                                    validFile = false;
                                }
                                else {

                                    if ($file.substring($file.length - 5) != '.json') {

                                        scheduler.sendSignal('onFilePollution', dir, 'config', $file);
                                        validFile = false;
                                    }
                                }
                                
                                $cb();
                            });
                        },

                        function ($_p1, $cb) {

                            if (validFile === false) {

                                $cb();
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
                                            masterFound = true;
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
                                    $cb();
                                }
                            });
                        },

                        function ($_p1, $cb) {
                            
                            //$cb();
                            $callback();
                        }
                    ]
                });
            }
        }, function ($err) {
            
            if (!masterFound) {
                
                master = dInit.master;
                scheduler.sendSignal('onFileNotFound', 'master.json', dir, 'Default configuration loaded!');
            }
            
            if (Object.keys(config).length == 0) {
                
                scheduler.sendSignal('onFileNotFound', '*.config.json', dir, 'Nothing will be served without configuration files!');
            }

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
