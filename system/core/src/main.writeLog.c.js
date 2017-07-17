'use strict';

const H = require('../interface/main.h');
const os = require('os');
const sym = require('../interface/main.sym.h');

//  noinspection JSUnusedGlobalSymbols
H.prototype.writeLog = function mainWriteLog($level, $msg, $cb) {
    const level = $level.level
        ? $level.level
        : Number.isInteger($level)
            ? $level
            : Number.MAX_VALUE

    ;

    if (this[sym.logLevel] > level) {
        return;
    }

    const prefix = $level.prefix
        ? $level.prefix
        : typeof $level === 'string'
            ? $level
            : Object.keys(this.logLevels)
                .map($key => this.logLevels[$key])
                .reduce(($lObj, $init) => ($lObj.level === level ? $lObj.prefix : $init), 'XXX')

    ;

    const msg = typeof $msg === 'string'
        ? $msg
        : $msg.mod
            ? `[${$msg.mod.toUpperCase()}] ${$msg.msg}`
            : (new Error()).stack
                .toString()
                .split('\n')[2]
                .trim()

    ;

    this[sym.logRotate].write(`${Date.now()} ${prefix}: ${msg}${os.EOL}`, 'utf8', $cb);
};
