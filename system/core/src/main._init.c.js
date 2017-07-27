'use strict';

const H = require('../interface/main.h');
const LogRotate = require('rotating-file-stream');
const sym = require('../interface/main.sym.h');

H.prototype[sym.construct] = function mainConstructor() {
    this.mixins = H.mixins;
    this.directories = H.directories;
    this.RequestState = H.RequestState;
    this.logLevels = H.logLevels;

    this[sym.logLevel] = 0; // todo: read from master config
    this[sym.logRotate] = LogRotate(($time, $index) => {
        if (!$time) {
            return 'SHPS.log';
        }

        return `${$time.getTime()}-${$index}-SHPS.log.gz`;
    }, {
        compress: 'gzip',
        history: '.history',
        maxFiles: 10, // todo: read from master config
        path: this.directories.logs,
        size: '100M', // todo: read from master config
    });

    this.writeLog(this.logLevels.warning, { mod: 'MAIN', msg: 'fixme: read log options from master config!' });
};
