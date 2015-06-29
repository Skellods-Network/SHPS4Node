'use strict';

var me = module.exports;

var cluster = require('cluster');
var os = require('os');

var color = require('colors');
var q = require('q');


var _helper = null;
__defineGetter__('helper', function () {
    
    if (!_helper) {
        
        _helper = require('./helper.js');
    }
    
    return _helper
});

var _log = null;
__defineGetter__('log', function () {
    
    if (!_log) {
        
        _log = require('./log.js');
    }
    
    return _log;
});

var _config = null;
__defineGetter__('config', function () {
    
    if (!_config) {
        
        _config = require('./config.js');
    }
    
    return _config;
});

var _main = null;
__defineGetter__('main', function () {
    
    if (!_main) {
        
        _main = require('./main.js');
    }
    
    return _main;
});

var mp = {
    self: this
};


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_parallelize_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * Returns if this process should do the work (is a worker)
 * 
 * @return Boolean
 */
var _work 
= me.work = function f_parallelize_work() {

    return cluster.isMaster;
};

var _spawnWorker = function () {

    var worker = cluster.fork();
    worker.on('message', function ($msg) {
        
        log.write('onMessage' + $msg.chat);
    });
    
    worker.on('error', function ($msg) {
        
        log.write('onError: ' + $msg);
    });

    return worker;
};

var _killAll 
= me.killAll = function f_parallelize_killAll() {
    
    var k = Object.keys(cluster.workers);
    var i = 0;
    var l = k.length;
    while (i < l) {
        
        cluster.workers[k[i]].kill();
        i++;
    }
};

/**
 * Handle multi-process clustering of SHPS
 * 
 * @return Promise()
 */
var _handle 
= me.handle = function f_parallelize_handle() {
    
    var defer = q.defer();
    var numCPUs = config.getHPConfig('config', 'workers');
    if (numCPUs === -1) {
        
        numCPUs = os.cpus().length;
    }
    
    if (cluster.isMaster && numCPUs > 0 && !main.isDebug()) {
        
        cluster.setupMaster({
        
            silent: !main.isDebug(),
            args: []
        });
        
        log.write('\nForking ' + numCPUs + ' workers...');
        
        cluster.on('online', function ($worker) {
            
            log.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') is now ' + 'online'.green);
        });
        
        cluster.on('exit', function ($worker, $code, $signal) {
            
            if ($worker.suicide) {

                log.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') ' + 'died gracefully (suicide)'.red);
            }
            else {
                
                log.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') ' + ('died unexpectedly (' + ($signal || $code).toString() + ')').red.bold);
                _spawnWorker();
            }
        });
        
        var worker;
        for (var i = 0; i < numCPUs; i++) {
            
            worker = _spawnWorker();
        }
        
        defer.resolve(SHPS_ERROR_NO_ERROR);
    }
    else {
        
        defer.resolve();
    }

    return defer.promise;
};
