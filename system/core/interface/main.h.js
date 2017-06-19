'use strict';

const path = require('path');

const mix = require('mics').mix;

const mixBase = require('./SHPSM_base.h');
const mixInit = require('./SHPSM_init.h');

const dirRoot = path.dirname(require.main.filename) + path.sep;


// noinspection JSUnusedLocalSymbols
module.exports = mix(mixBase, mixInit, superclass =>
    class SHPS
    extends superclass {
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
                certs: dirRoot + 'cert' + path.sep,
                configs: dirRoot + 'config' + path.sep,
                dbs: dirRoot + 'db' + path.sep,
                logs: dirRoot + 'log' + path.sep,
                plugins: dirRoot + 'system' + path.sep + 'plugins' + path.sep,
                pool: dirRoot + 'pool' + path.sep,
                root: dirRoot,
                templates: dirRoot + 'system' + path.sep + 'templates' + path.sep,
                uploads: dirRoot + 'upload' + path.sep,
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
            return require('./requestState.h');
        }

        // noinspection JSUnusedGlobalSymbols
        /**
         * Returns debug status
         *
         * @return {boolean} true if debug-mode is enabled
         */
        isDebug() {}
    }
);
