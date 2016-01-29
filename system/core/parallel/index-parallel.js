'use strict';

var me = module.exports;

var cluster = require('cluster');
var os = require('os');

var color = require('colors');
var q = require('q');


var libs = require('node-mod-load').libs;


/**
 * Returns if this process should do the work (is a worker)
 * 
 * @return Boolean
 */
var _work 
= me.work = function f_parallelize_work() {

    if (libs.config.getHPConfig('config', 'workers') == 0) {

        return true;
    }
    else {

        return cluster.isWorker;
    }
};

var _spawnWorker = function () {

    var worker = cluster.fork();
    worker.on('message', function ($msg) {
        
        libs.coml.write('onMessage' + $msg.chat);
    });
    
    worker.on('error', function ($msg) {
        
        libs.coml.write('onError: ' + $msg);
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
    var numCPUs = libs.config.getHPConfig('config', 'workers');
    if (numCPUs === -1) {
        
        numCPUs = os.cpus().length;
    }
    
    if (cluster.isMaster && numCPUs > 0 && !libs.main.isDebug()) {
        
        cluster.setupMaster({
        
            silent: !libs.main.isDebug(),
            args: []
        });
        
        libs.coml.write('\nForking ' + numCPUs + ' workers...');
        
        cluster.on('online', function ($worker) {
            
            libs.coml.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') is now ' + 'online'.green);
        });
        
        cluster.on('exit', function ($worker, $code, $signal) {
            
            if ($worker.suicide) {

                libs.coml.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') ' + 'died gracefully (suicide)'.red);
            }
            else {
                
                libs.coml.write('Worker ' + $worker.id + ' (PID: ' + $worker.process.pid + ') ' + ('died unexpectedly (' + ($signal || $code).toString() + ')').red.bold);
                _spawnWorker();
            }
        });
        
        var worker;
        for (var i = 0; i < numCPUs; i++) {
            
            worker = _spawnWorker();
        }
        
        defer.resolve();
    }
    else {
        
        defer.resolve();
    }

    return defer.promise;
};
