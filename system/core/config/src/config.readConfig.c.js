'use strict';

var fs = require('fs');

var defer = require('promise-defer');
var semver = require('semver');
var q = require('q');
var libs = require('node-mod-load').libs;

var sym = require('../interface/config-symbols.h.js');


require('../interface/config.h.js').prototype.readConfig = function ($uri) {

    var task = libs.coml.newTask('Detecting Configurations');

    var d = q.defer();
    var dir;
    if (!(dir = libs.main.getDir(SHPS_DIR_CONFIGS))) {

        d.reject(new Error("Could not retrive config directory!"));
        task.end(TASK_RESULT_ERROR);

        return d.promise;
    }

    // TODO: search for template files to load, parse them
    
    fs.readdir(dir, ($err, $files) => {

        if ($err) {

            task.end(TASK_RESULT_ERROR);
            d.reject($err);
        }

        var i = 0;
        var l = $files.length;
        var proms = [];
        while (i < l) {

            let file = $files[i];
            if (!/\.json$/.test(file)) {

                libs.schedule.sendSignal('onFilePollution', dir, 'config', file);

                i++;
                continue;
            }

            let tmp = defer();
            proms.push(tmp.promise);
            task.interim(TASK_RESULT_OK, 'Config file found: ' + file);
            this.readFile(dir + file).done($payload => {

                if ($payload._info) {// Template

                    var cfgVersion = $payload._info.SHPSVERSION_MA + '.' + $payload._info.SHPSVERSION_MI + '.0';
                    if (semver.gt(cfgVersion, SHPS_VERSION)) {

                        task.interim(TASK_RESULT_ERROR, 'Template file version incompatible: ' + file + '@' + cfgVersion);
                        tmp.resolve(new Error('Template file version incompatible (cfg version too high; min. version: ' + cfgVersion + ')'));
                        return;
                    }

                    cfgVersion = $payload._info.SHPSVERSION_MA + '.' + $payload._info.SHPSVERSION_MI + '.0';
                    if (semver.gt(cfgVersion, SHPS_VERSION)) {

                        task.interim(TASK_RESULT_ERROR, 'Config file version incompatible: ' + file + '@' + cfgVersion);
                        tmp.resolve(new Error('Config file version incompatible (cfg version too high; min. version: ' + cfgVersion + ')'));
                        return;
                    }

                    var addCfg = () => {

                        var name = $payload._info.type;
                        var s = sym.template[name];
                        if (!this[s]) {

                            this[s] = $payload;
                            task.interim(TASK_RESULT_OK, name + ' template loaded successfully: ' + file);
                        }
                        else {

                            var txt = 'Multiple ' + name + ' template files found: ' + file;
                            task.interim(TASK_RESULT_WARNING, txt);
                            tmp.resolve(new Error(txt));
                        }
                    };

                    switch ($payload._info.type) {

                        case 'master':
                        case 'database':
                        case 'vhost': {

                            addCfg();
                            break;
                        }
                        default: {

                            var txt = 'Unknown configuration file: ' + file + ' of type ' + $payload._info.type;
                            task.interim(TASK_RESULT_WARNING, txt);
                            tmp.resolve(new Error(txt));
                            return;
                        }
                    }
                }
                else {// Config

                    var cfgVersion = $payload.configHeader.SHPSVERSION_MA + '.' + $payload.configHeader.SHPSVERSION_MI + '.0';
                    if (semver.gt(cfgVersion, SHPS_VERSION)) {

                        task.interim(TASK_RESULT_ERROR, 'Config file version incompatible: ' + file + '@' + cfgVersion);
                        tmp.resolve(new Error('Config file version incompatible (cfg version too high; min. version: ' + cfgVersion + ')'));
                        return;
                    }

                    switch ($payload.configHeader.type) {

                        case 'master': {

                            
                            task.interim(TASK_RESULT_OK, 'Master Template loaded successfully: ' + file);
                            break;
                        }
                        case 'database': {

                            break;
                        }
                        case 'vhost': {

                            break;
                        }

                        // deprecated since v4.2.0, do not remove
                        case 'hp': {

                            break;
                        }

                        default: {

                            var txt = 'Unknown configuration file: ' + file + ' of type ' + $payload._info.type;
                            task.interim(TASK_RESULT_WARNING, txt);
                            tmp.resolve(new Error(txt));
                            return;
                        }
                    }
                }

                tmp.resolve();
            }, $err => {

                task.interim(TASK_RESULT_WARNING, 'Config could not be loaded: ' + file);
                libs.coml.writeError($err);
                tmp.resolve($err);
            });

            i++;
        }

        Promise.all(proms).then($vals => {

            task.end(TASK_RESULT_OK);
            d.resolve();
        });
    });

    return d.promise;
};
