'use strict';

/**
 * SHPS Main
 */

/**
 * Points of Interest
 *
 * Performance array vs object: http://stackoverflow.com/questions/8423493/what-is-the-performance-of-objects-arrays-in-javascript-specifically-for-googl
 */

var me = module.exports;

GLOBAL.SHPS_ = 1;
GLOBAL.SHPS_MAJOR_VERSION = 4;
GLOBAL.SHPS_MINOR_VERSION = 4;
GLOBAL.SHPS_PATCH_VERSION = 2;
GLOBAL.SHPS_BUILD = '';
GLOBAL.SHPS_INTERNAL_NAME = 'IROKOKOU';
GLOBAL.SHPS_VERSION = SHPS_MAJOR_VERSION + '.' + SHPS_MINOR_VERSION + '.' + SHPS_PATCH_VERSION;

GLOBAL.SHPS_ERROR_NO_ERROR = 'No Error!';

GLOBAL.SHPS_DIR_ROOT = 0;
GLOBAL.SHPS_DIR_PLUGINS = 1;
GLOBAL.SHPS_DIR_CERTS = 2;
GLOBAL.SHPS_DIR_CONFIGS = 3;
GLOBAL.SHPS_DIR_UPLOAD = 4;
GLOBAL.SHPS_DIR_POOL = 5;
GLOBAL.SHPS_DIR_LOG = 6;
GLOBAL.SHPS_DIR_TEMPLATES = 7;
GLOBAL.SHPS_DIR_DB = 8;

GLOBAL.SHPS_MODULE_STATE_HALT = 17001;
GLOBAL.SHPS_MODULE_STATE_RUNNING = 17002;


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

        case SHPS_DIR_ROOT: r = path.dirname(require.main.filename) + path.sep; break;
        case SHPS_DIR_PLUGINS: r = path.dirname(require.main.filename) + path.sep + 'system' + path.sep + 'plugins' + path.sep; break;
        case SHPS_DIR_CERTS: r = path.dirname(require.main.filename) + path.sep + 'cert' + path.sep; break;
        case SHPS_DIR_CONFIGS: r = path.dirname(require.main.filename) + path.sep + 'config' + path.sep; break;
        case SHPS_DIR_UPLOAD: r = path.dirname(require.main.filename) + path.sep + 'upload' + path.sep; break;
        case SHPS_DIR_POOL: r = path.dirname(require.main.filename) + path.sep + 'pool' + path.sep; break;
        case SHPS_DIR_LOG: r = path.dirname(require.main.filename) + path.sep + 'log' + path.sep; break;
        case SHPS_DIR_TEMPLATES: r = path.dirname(require.main.filename) + path.sep + 'system' + path.sep + 'templates' + path.sep; break;
        case SHPS_DIR_DB: r = path.dirname(require.main.filename) + path.sep + 'db' + path.sep; break;
    }

    if (r !== null) {

        r = path.normalize(r);
    }

    return r;
};

var _getVersionText
= me.getVersionText = function f_main_getVersionText() {

    var build = SHPS_BUILD;
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
        
        //TODO: analyse template type and version
        var fileTree = JSON.parse(fs.readFileSync(_getDir(SHPS_DIR_TEMPLATES) + 'fsTree.json')).template.tree;
        
        while (i < l) {

            var entry = $list[i];
            var $stat = fs.lstatSync(root + entry)

            if ($stat.isDirectory()) {

                if (Object.keys(fileTree).indexOf(entry) < 0) {

                    libs.schedule.sendSignal('onPollution', root, 'SHPS root', entry);
                }
            }
            else if (fileTree._files && fileTree._files.indexOf(entry) < 0) {

                libs.schedule.sendSignal('onFilePollution', root, 'SHPS root', entry);
            }

            i++;
        }

        task.end(TASK_RESULT_OK);
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
= me.init = function f_main_init () {

    if (typeof libs.main._state !== 'undefined') return q.promise($res => { $res(); });
    libs.main._state = SHPS_MODULE_STATE_RUNNING;

    q.longStackSupport = true;

    var d = q.defer();

    // The Init Module initializes itself on creation
    var init = new libs.init();
    init.boot().done($res => {

        dep = libs.dep;
        _init.initialized = true;
        d.resolve($res);
    }, d.reject);

    return d.promise;
}

var _checkUpdate = me.checkUpdate = function f_main_checkUpdate() {

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

        libs.request.handleRequest(libs.helper.newRequestState($req, $res));

        //TODO: somehow clean up rs to remove memory leak
        //      -> Content Pipelines, cache and reuse RS's cache, better multi-process approach for disposable workers
    };

    var server;
    var configs = libs.config._getConfigs();
    for (var $c in configs) {

        if (!configs[$c].generalConfig) {

            continue;
        }
    
        if (configs[$c].generalConfig.useHTTP1.value) {

            var p = configs[$c].generalConfig.HTTP1Port.value;
            if (port.indexOf(p) == -1) {

                server = http.createServer(httpResponse);
                server.listen(p);
                servers.push(server);

                task.interim(TASK_RESULT_OK, 'HTTP/1.1 port opened on ' + (p + '').green);
                port += p;
                libs.schedule.sendSignal('onListenStart', 'HTTP/1.1', p, server);
            }
        }

        if (configs[$c].generalConfig.useHTTP2.value) {

            var p = configs[$c].generalConfig.HTTP2Port.value;
            if (port.indexOf(p) == -1) {

                //TODO: implement TLS Tickets, OCSP stapling, SNI
                //TODO: check why http2 crashes without error
                
                const ciphers = [
                    'DHE-RSA-AES256-GCM-SHA384',
                    'DHE-RSA-AES128-GCM-SHA256',
                    'DHE-RSA-AES256-SHA256',
                    'DHE-RSA-AES128-SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-SHA384',
                    'ECDHE-RSA-AES128-SHA256',
                    'ECDHE-RSA-AES256-SHA',
                    'ECDHE-RSA-AES128-SHA',
                    'ECDHE-ECDSA-AES128-SHA',
                    'ECDHE-ECDSA-AES256-SHA',
                    'AES256-SHA256',
                    'AES128-SHA256',
                    '!aNULL',
                    '!eNULL',
                    '!MD5',
                    '!DES',
                    '!RC4',
                    '!PSK',
                ];
                
                var options =  {

                    secureProtocol: 'SSLv23_method',
                    secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
                    ciphers: ciphers.join(':');
                    honorCipherOrder: true,
                };
                
                if (configs[$c].TLSConfig.key.value !== '' && configs[$c].TLSConfig.cert.value !== '') {

                    options.key = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configs[$c].TLSConfig.key.value);
                    options.cert = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configs[$c].TLSConfig.cert.value);
                }
                else if (configs[$c].TLSConfig.pfx.value) {

                    options.pfx = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configs[$c].TLSConfig.pfx.value);
                }
                
                if (configs[$c].TLSConfig.ca.value !== '') {

                    options.ca = fs.readFileSync(_getDir(SHPS_DIR_CERTS) + configs[$c].TLSConfig.ca.value);
                }
                
                if (configs[$c].TLSConfig.passphrase.value !== '') {
                    
                    options.passphrase = configs[$c].TLSConfig.passphrase.value;
                }
                
                if (configs[$c].TLSConfig.dhParam.value !== '') {
                    
                    options.dhparam = _getDir(SHPS_DIR_CERTS) + configs[$c].TLSConfig.dhParam.value
                }

                server = https.createServer(options, httpResponse);
                server.listen(p);
                servers.push(server);

                task.interim(TASK_RESULT_OK, 'HTTP/2 port opened on ' + (p + '').green);
                port += p;
                libs.schedule.sendSignal('onListenStart', 'HTTP/2', p, server);
            }
        }
    }

    libs.schedule.sendSignal('onServerStart', port);
    task.end(TASK_RESULT_OK);
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
