/* eslint-disable class-methods-use-this,no-unused-vars */

'use strict';

const path = require('path');

const mix = require('mics').mix;

const mixBase = require('./SHPSM_base.h');
const mixInit = require('./SHPSM_init.h');
const RequestState = require('./requestState.h');
const sym = require('./main.sym.h');

const dirRoot = path.dirname(require.main.filename) + path.sep;


// noinspection JSUnusedLocalSymbols
module.exports = mix(mixBase, mixInit, superclass => class SHPS extends superclass {
    /**
     * Constructor
     *
     * @param {boolean} $isDebug
     */
    constructor() {
        super();
        this[sym.construct]();
    }

    /**
     * Directory Paths
     *
     * @return {
         *  {
         *   certs: string,
         *   configs: string,
         *   dbs: string,
         *   logs: string,
         *   plugins: string,
         *   pool: string,
         *   root: string,
         *   templates: string,
         *   uploads: string
         *  }
         * }
     */
    static get directories() {
        return {
            certs: `${dirRoot}cert${path.sep}`,
            configs: `${dirRoot}config${path.sep}`,
            dbs: `${dirRoot}db${path.sep}`,
            logs: `${dirRoot}log${path.sep}`,
            plugins: `${dirRoot}system${path.sep}plugins${path.sep}`,
            pool: `${dirRoot}pool${path.sep}`,
            root: dirRoot,
            templates: `${dirRoot}system${path.sep}templates${path.sep}`,
            uploads: `${dirRoot}upload${path.sep}`,
        };
    }

    /**
     * Log Levels
     * @returns {
     *   {
     *     trace: {level: number, prefix: string},
     *     debug: {level: number, prefix: string},
     *     info: {level: number, prefix: string},
     *     warning: {level: number, prefix: string},
     *     error: {level: number, prefix: string},
     *     fatal: {level: number, prefix: string}
     *   }
     * }
     */
    static get logLevels() {
        return {
            trace: { level: 0, prefix: 'TRC' },
            debug: { level: 1, prefix: 'DBG' },
            info: { level: 2, prefix: 'NFO' },
            warning: { level: 3, prefix: 'WRN' },
            error: { level: 4, prefix: 'ERR' },
            fatal: { level: 5, prefix: 'FTL' },
        };
    }

    /**
     * Mixins
     *
     * @return {{base: *, init: *}}
     */
    static get mixins() {
        return {
            base: mixBase,
            init: mixInit,
        };
    }

    /**
     * Get RequestState interface
     *
     * @return {RequestState}
     * @constructor
     */
    static get RequestState() {
        return RequestState;
    }

    startSystem() { throw new Error('Not implemented: main.startSystem()'); }

    /**
     * Write to global logger
     *
     * @param {logLevels|number} level
     * @param {string|{mod:string,msg:string}} message
     * @param {function} cb
     */
    writeLog(level, message, cb) { throw new Error('Not implemented: main.getLogger()'); }
});
