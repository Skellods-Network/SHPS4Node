'use strict';

var fs = require('fs');

var async = require('vasync');
var colors = require('colors');
var defer = require('promise-defer');
var semver = require('semver');
var q = require('q');
var libs = require('node-mod-load').libs;

var sym = require('../interface/config-symbols.h.js');

var readDir = function (dir, type, task, regex) {

    var d = defer();

    fs.readdir(dir, ($err, $files) => {

        if ($err) {

            d.reject($err);
            return;
        }

        var i = 0;
        var l = $files.length;
        var files = {};
        while (i < l) {

            let file = $files[i];
            i++;

            if (!regex.test(file)) {

                libs.schedule.sendSignal('onFilePollution', dir, type, file);
                continue;
            }

            task.interim(TASK_RESULT_OK, 'Found ' + type + ': ' + file);

            let fc = '';
            try {

                fc = fs.readFileSync(dir + file);
            }
            catch (err) {

                task.interim(TASK_RESULT_ERROR, 'Could not open ' + type + ' ' + file);
                libs.coml.writeError(err);
                continue;
            }

            let content = null;
            try {

                content = JSON.parse(fc);
            }
            catch (err) {

                task.interim(TASK_RESULT_ERROR, 'Could not read ' + type + ' ' + file);
                libs.coml.writeError(err);
                continue;
            }

            files[file] = content;
        }

        d.resolve(files);
    });

    return d.promise;
};

var readTemplates = function (co, cb) {

    var dir = libs.main.getDir(SHPS_DIR_TEMPLATES);
    readDir(dir, 'template', co.task, /\.json$/).then($files => {

        co.templates = $files;
        cb(null, co);
    }, cb);
};

var evalTemplates = function (co, cb) {

    var i = 0;
    var keys = Object.keys(co.templates);
    var l = keys.length;
    var tCheck = 0b000;
    while (i < l) {

        let f = keys[i];
        let t = co.templates[f];
        i++;

        if (!t.configHeader || !t.configHeader.type || t.configHeader.type !== 'template') {

            co.task.interim(TASK_RESULT_ERROR, 'File is not a template: ' + f.toString().red);
        }

        //TODO check template version
        //TODO check config version

        switch (t.template._info.type) {

            case 'master': {

                this[sym.cfg.master] = t.template;
                this[sym.template.master] = t.template;
                tCheck += 0b100;
                co.task.interim(TASK_RESULT_OK, 'Master template loaded: ' + f.toString().green);
                break;
            }

            case 'database': {

                this[sym.template.database] = t.template;
                tCheck += 0b010;
                co.task.interim(TASK_RESULT_OK, 'Database template loaded: ' + f.toString().green);
                break;
            }

            case 'vhost': {

                this[sym.template.vhost] = t.template;
                tCheck += 0b001;
                co.task.interim(TASK_RESULT_OK, 'VHost template loaded: ' + f.toString().green);
                break;
            }
        }
    }

    if (tCheck != 0b111) {

        cb(new Error('Could not find all necessary config templates!'), co);
    }
    else {

        cb(null, co);
    }
};

var readConfigs = function (co, cb) {

    var dir = libs.main.getDir(SHPS_DIR_CONFIGS);
    readDir(dir, 'config', co.task, /\.json$/).then($files => {

        co.configs = $files;
        cb(null, co);
    }, cb);
};

var evalConfigs = function (co, cb) {

    var matchTemplate = (template, config) => {

        var tKeys = Object.keys(template);
        var cKeys = Object.keys(config);
        var i = 0;
        var l = cKeys.length;
        while (i < l) {

            if (config[cKeys[i]] instanceof Object) {

                if (['_info', 'configHeader'].indexOf(cKeys[i]) < 0 && typeof template[cKeys[i]] !== 'undefined') {

                    template[cKeys[i]] = matchTemplate(template[cKeys[i]], config[cKeys[i]]);
                }
            }
            else if (cKeys[i] !== 'value' && typeof template[cKeys[i]] === 'undefined') {

                this.task.interim(TASK_RESULT_WARNING, 'Config option not in template: ' + cKeys[i]);
            }
            else if (cKeys[i] !== 'value' && typeof template[cKeys[i]] !== typeof config[cKeys[i]]) {

                this.task.interim(TASK_RESULT_ERROR, 'Config option type deviates from template option type: ' + cKeys[i]);
            }
            else {

                template[cKeys[i]] = config[cKeys[i]];
            }

            i++;
        }

        return template;
    };

    var i = 0;
    var keys = Object.keys(co.configs);
    var l = keys.length;
    while (i < l) {

        let f = keys[i];
        let c = co.configs[f];
        i++;

        if (!c.configHeader || !c.configHeader.type || ['database', 'master', 'vhost', 'hp'].indexOf(c.configHeader.type) < 0) {

            co.task.interim(TASK_RESULT_ERROR, 'Config type cannot be recognized: ' + f.toString().red);
        }

        //TODO check config version

        switch (c.configHeader.type) {

            case 'master': {

                if (semver.lt(c.configHeader.SHPSVERSION_MA + '.' + c.configHeader.SHPSVERSION_MI + '.0', '4.2.0')) {

                    co.task.interim(TASK_RESULT_WARNING, 'This config file uses a deprecated format: ' + f.toString().yellow.bold);
                    co.warnings++;
                    c = c.config;
                }

                this[sym.cfg.master] = matchTemplate(this[sym.template.master], c);
                co.task.interim(TASK_RESULT_OK, 'Master config loaded: ' + f.toString().green);
                break;
            }

            case 'database': {

                //TODO: use one database config for several vhosts

                if (typeof this[sym.cfg.vhosts][c.configHeader.vhost] === 'undefined') {

                    this[sym.cfg.vhosts][c.configHeader.vhost] = {};
                }

                if (typeof this[sym.cfg.vhosts][c.configHeader.vhost].databaseConfig === 'undefined') {

                    this[sym.cfg.vhosts][c.configHeader.vhost].databaseConfig = {};
                }

                this[sym.cfg.vhosts][c.configHeader.vhost].databaseConfig[c.alias.value] = matchTemplate(this[sym.template.database], c);
                co.task.interim(TASK_RESULT_OK, 'Database config loaded: ' + (c.configHeader.vhost + '::' + c.alias.value).green);
                break;
            }

            case 'hp': {

                this[sym.cfg.vhosts][c.generalConfig.URL.value] = c;
                co.task.interim(TASK_RESULT_WARNING, 'This config file uses a deprecated format: ' + f.toString().yellow.bold);
                co.task.interim(TASK_RESULT_OK, 'Config loaded: ' + f.toString().green);
                co.warnings++;
                break;
            }

            case 'vhost': {

                this[sym.cfg.vhosts][c.generalConfig.URL.value] = matchTemplate(this[sym.template.vhost], c);
                co.task.interim(TASK_RESULT_OK, 'VHost config loaded: ' + f.toString().green);
                break;
            }
        }
    }

    cb(null, co);
};

require('../interface/config.h.js').prototype.readConfig = function () {

    var d = q.defer();

    var task = libs.coml.newTask('Detecting Configurations');

    async.waterfall([

        cb => {

            cb(null, {
                task: task,
                templates: {},
                configs: {},
                warnings: 0,
            });
        },
        readTemplates.bind(this),
        evalTemplates.bind(this),
        readConfigs.bind(this),
        evalConfigs.bind(this),
    ], ($err, $res) => {

        if ($err) {

            task.end(TASK_RESULT_ERROR);
            d.reject($err);
        }
        else {

            if ($res.warnings > 0) {

                task.end(TASK_RESULT_WARNING);
            }
            else {

                task.end(TASK_RESULT_OK);
            }

            d.resolve();
        }
    });

    return d.promise;
};
