'use strict';

const path = require('path');

const mix = require('mixwith');

const mixBase = require('./SHPSM_base.h');
const mixInit = require('./SHPSM_init.h');

const dirRoot = path.dirname(require.main.filename) + path.sep;


module.exports = class SHPS extends mix.mix(mixBase).with(mixInit) {

    /**
     * Constructor
     *
     * @param {boolean} $isDebug
     */
    constructor($isDebug = false) {

        super();
        this._init($isDebug);
    }

    /**
     * Returns debug status
     *
     * @returns {boolean}
     */
    isDebug() {};
};


module.exports.directories = {};
module.exports.directories.certs = dirRoot + 'cert' + path.sep;
module.exports.directories.configs = dirRoot + 'config' + path.sep;
module.exports.directories.dbs = dirRoot + 'db' + path.sep;
module.exports.directories.logs = dirRoot + 'log' + path.sep;
module.exports.directories.plugins = dirRoot + 'system' + path.sep + 'plugins' + path.sep;
module.exports.directories.pool = dirRoot + 'pool' + path.sep;
module.exports.directories.root = dirRoot;
module.exports.directories.templates = dirRoot + 'system' + path.sep + 'templates' + path.sep;
module.exports.directories.uploads = dirRoot + 'upload' + path.sep;

module.exports.mixins = {};
module.exports.mixins.base = mixBase;
module.exports.mixins.init = mixInit;
