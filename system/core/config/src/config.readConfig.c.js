'use strict';

var fs = require('fs');

var async = require('vasync');
var defer = require('promise-defer');
var semver = require('semver');
var q = require('q');
var libs = require('node-mod-load').libs;

var sym = require('../interface/config-symbols.h.js');

var readTemplates = function (co, cb) {

    var dir = libs.main.getDir(SHPS_DIR_TEMPLATES);
    fs.readdir(dir, ($err, $files) => {

        if ($err) {

            cb($err);
            return;
        }

        var i = 0;
        var l = $files.length;
        var templates = [];
        while (i < l) {

            let file = $files[i];
            i++;

            if (!/\.json$/.test(file)) {

                libs.schedule.sendSignal('onFilePollution', dir, 'template', file);
                continue;
            }

            co.task.interim(TASK_RESULT_OK, 'Found Template: ' + file);

            let fc = '';
            try {

                fc = fs.readFileSync(dir + file);
            }
            catch (err) {

                co.task.interim(TASK_RESULT_ERROR, 'Could not open template ' + file);
                libs.coml.writeError(err);
                continue;
            }

            let template = null;
            try {

                template = JSON.parse(fc);
            }
            catch (err) {

                co.task.interim(TASK_RESULT_ERROR, 'Could not read template ' + file);
                libs.coml.writeError(err);
                continue;
            }

            co.templates[file] = template;
        }

        cb(null, co);
    });
};

var evalTemplates = function (co, cb) {

    var i = 0;
    var keys = Object.keys(co.templates);
    var l = keys.length;
    while (i < l) {

        let f = keys[i];
        let t = co.templates[f];
        i++;

        if (!t.configHeader || !t.configHeader.type || t.configHeader.type !== 'template') {

            co.task.interim(TASK_RESULT_ERROR, 'File is not a template: ' + f);
        }

        //TODO check template version
        //TODO check config version

        switch (t.template._info.type) {

            case 'master': {

                //TODO: fill master
            }

            //TODO: add other types
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
            });
        },
        readTemplates,
        evalTemplates,
    ], $err => {

        if ($err) {

            task.end(TASK_RESULT_ERROR);
            d.reject($err);
        }
        else {

            task.end(TASK_RESULT_OK);
            d.resolve();
        }
    });

    return d.promise;
};
