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
GLOBAL.SHPS_BUILD = 'BETA';
GLOBAL.SHPS_INTERNAL_NAME = 'IROKOKOU';
GLOBAL.SHPS_VERSION = SHPS_MAJOR_VERSION + '.' + SHPS_MINOR_VERSION + '.' + SHPS_PATCH_VERSION;

GLOBAL.SHPS_ERROR_NO_ERROR = 'No Error!';

GLOBAL.SHPS_DIR_ROOT = 0;
GLOBAL.SHPS_DIR_PLUGINS = 1;
GLOBAL.SHPS_DIR_CERTS = 2;
GLOBAL.SHPS_DIR_CONFIGS = 3;
GLOBAL.SHPS_DIR_UPLOAD = 4;


var constants = require('constants')
var fs = require('fs');
var async = require('vasync');
var colors = require('colors');
var https = require('http2');
var http = require('http');
var path = require('path');
var os = require('os');
var vm = require('vm');
var q = require('q');

var servers = [];

var libs = require('node-mod-load').libs;
libs.error;

var dep;

var self = this;
var debug = false;

var mp = {
    self: this
};


libs.schedule.addSlot('fatalError', function () {

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

    libs.coml.write(_getVersionText());
};

/**
 * Checks filesystem for inconsistencies, missing files or pollution
 * Only rough analysis
 * @the moment it only checks the root dir -> has to be improved
 * 
 * @return Promise()
 */
var _checkFS 
= me.checkFS = function f_main_checkFS() {

    var task = libs.coml.newTask('Checking Filesystem');
    
    var defer = q.defer();
    var root = _getDir(SHPS_DIR_ROOT);
    fs.readdir(root, function f_main_checkFS_rd($err, $list) {
        
        var i = 0;
        var l = $list.length;
        while (i < l) {
            
            var entry = $list[i];
            var $stat = fs.lstatSync(root + entry)

            if ($stat.isDirectory()) {
                
                if (Object.keys(libs.default.fileTree).indexOf(entry) < 0) {

                    libs.schedule.sendSignal('onPollution', root, 'SHPS root', entry);
                }
            }
            else if (libs.default.fileTree._files.indexOf(entry) < 0) {

                libs.schedule.sendSignal('onFilePollution', root, 'SHPS root', entry);
            }

            i++;
        }
        
        task.end(SHPS_COML_TASK_RESULT_OK);
        defer.resolve();
    });

    return defer.promise;
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
    libs.coml.write('Please wait while we initialize SHPS for you... it won\'t take long ;)');

    process.title = 'SHPS Terminal';

    async.pipeline({
        
        'funcs': [
            
            function f_init_prepare($_p1, $_p2) {
                
                libs.optimize;
                $_p2();
            }
            , function f_init_checkUpdate($_p1, $_p2) { _checkUpdate().done($_p2, $_p2); }
            , function f_init_checkFS($_p1, $_p2) { _checkFS().done($_p2, $_p2); }
            , function f_init_readConfig($_p1, $_p2) { libs.config.readConfig().done($_p2, $_p2); }
            , function f_init_parallelize($_p1, $_p2) {
                
                var wc = libs.config.getHPConfig('config', 'workers');
                if (wc > 0 || wc === -1) {

                    libs.parallelize.handle().done($_p2, $_p2);
                }
                else {
                    
                    process.nextTick($_p2);
                }
            }
            , function f_init_loadPlugins($_p1, $_p2) { libs.plugin.loadPlugins().done($_p2, $_p2); }
            , function f_init_listen($_p1, $_p2) {
                
                _listen();
                process.nextTick($_p2);
            }
            , function f_init_event($_p1, $_p2) {
                
                libs.coml.write('');
                dep = libs.dep;
                process.on('exit', function ($code) {

                    _killAllServers();
                });

                libs.schedule.sendSignal('onMainInit', $_p1);
                process.nextTick($_p2);
            }
        ]
    }, function func_init_done ($err) {
        
        libs.coml.write('\nWe done here! SHPS at your service - what can we do for you?'.bold);
        libs.coml.handleRequest();
    });
}

var _checkUpdate = function f_main_checkUpdate() {

    var defer = q.defer();

    libs.coml.write('\nChecking for Updates...', false);

    libs.schedule.sendSignal('onCheckForUpdate', false);
    
    // Do the check here...

    libs.coml.append(' not implemented yet'.yellow);
    defer.resolve();

    return defer.promise;
};

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

            numWorkers = os.cpus().length; // Smart regulation later on
        }
    }

    if (cluster.isMaster && numWorkers > 0) {
        
        for (var i = 1; i < numWorkers; i++) {

            var worker = cluster.fork();

            worker.on('message', function ($msg) {

                if ($msg.cmd && $msg.cmd == 'workerOptimizeRequest') {

                    libs.optimize.handleWorkerMessage($msg.data.event, $msg.data.params);
                }
            });

            cluster.on('online', function ($worker) {
            
                libs.coml.write('Worker ' + $worker.id + ' is now ' + 'online'.green);
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
 * @todo: find wrong config when ssl_port is configured for used http_port or vice-versa
 */
var _listen 
= me.listen = function () {
    
    var task = libs.coml.newTask('Starting Servers');
    
    var port = [];
    var defer = q.defer();
    var httpResponse = function ($req, $res) {
        
        var rs = new libs.helper.requestState();
        rs._domain = new libs.helper.SHPS_domain($req.headers.host, true);
        rs.uri = rs._domain.href;
        rs.config = libs.config.getConfig(rs._domain.hostname);
        rs.path = $req.url;
        rs.request = $req;
        rs.response = $res;
        rs.COOKIE = libs.cookie.newCookieJar(rs);

        libs.request.handleRequest(rs);

        //TODO: somehow clean up rs to remove memory leak
        //      -> Content Pipelines, cache and reuse RS's cache, better multi-process approach for disposable workers
    };
    
    var configHug = libs.config.hug(mp);
    var server;
    for (var $c in configHug.config) {
        
        if (configHug.config[$c].generalConfig.useHTTP1.value) {
            
            var p = configHug.config[$c].generalConfig.HTTP1Port.value;
            if (port.indexOf(p) == -1) {
                
                server = http.createServer(httpResponse);
                server.listen(p);
                servers.push(server);
                
                task.interim(SHPS_COML_TASK_RESULT_OK, 'HTTP/1.1 port opened on ' + (p + '').green);
                port += p;
                libs.schedule.sendSignal('onListenStart', 'HTTP/1.1', p, server);
            }
        }
        
        if (configHug.config[$c].generalConfig.useHTTP2.value) {
            
            var p = configHug.config[$c].generalConfig.HTTP2Port.value;
            if (port.indexOf(p) == -1) {
                
                //TODO: implement TLS Tickets, OCSP stapling, SNI
                //TODO: check why http2 crashes without error
                var options =  {
                    
                    secureProtocol: 'SSLv23_method',
                    secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
                    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS -AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA',
                    honorCipherOrder: true,
                };
                
                if (configHug.config[$c].TLSConfig.key.value != '' && configHug.config[$c].TLSConfig.cert.value != '') {

                    options.key = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configHug.config[$c].TLSConfig.key.value);
                    options.cert = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configHug.config[$c].TLSConfig.cert.value);
                }
                else if (configHug.config[$c].TLSConfig.pfx.value) {

                    options.pfx = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configHug.config[$c].TLSConfig.pfx.value);
                }
                
                if (configHug.config[$c].TLSConfig.ca.value != '') {

                    options.ca = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configHug.config[$c].TLSConfig.ca.value);
                }
                
                if (configHug.config[$c].TLSConfig.passphrase.value != '') {
                    
                    options.passphrase = configHug.config[$c].TLSConfig.passphrase.value;
                }
                
                if (configHug.config[$c].TLSConfig.dhParam.value != '') {
                    
                    options.dhparam = _getDir(SHPS_DIR_CERTS) + configHug.config[$c].TLSConfig.dhParam.value
                }

                server = https.createServer(options, httpResponse);
                server.listen(p);
                servers.push(server);
                
                task.interim(SHPS_COML_TASK_RESULT_OK, 'HTTP/2 port opened on ' + (p + '').green);
                port += p;
                libs.schedule.sendSignal('onListenStart', 'HTTP/2', p, server);
            }
        }
    }
    
    libs.schedule.sendSignal('onServerStart', port);
    task.end(SHPS_COML_TASK_RESULT_OK);
};

var _killAllServers 
= me.killAllServers = function f_main_killAllServers() {

    var i = 0;
    var l = servers.length;
    while (i < l) {
        
        servers[i].close();
        i++;
    }
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
 * Set Debug behaviour<br>
 * If set to true, the system will output all debuginfo to the console
 * 
 * @param Boolean $onOff //Default: true
 */
var _setDebug
= me.setDebug = function ($onOff) {
    $onOff = typeof $onOff !== 'undefined' ? $onOff : true;

    debug = $onOff;
    libs.schedule.sendSignal('onDebugChange', $onOff);
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
    
    return libs.helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
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
        
        libs.coml.error('Cannot focus undefined requestState!');
    }
    
    
    this.getDir = function f_main_focus_getDir($key) {
        
        return _getDir($key);
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
};
