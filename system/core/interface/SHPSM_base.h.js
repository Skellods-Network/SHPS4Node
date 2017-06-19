'use strict';

const mix = require('mics').mix;


module.exports = mix(superclass => class extends superclass {

    // noinspection JSMethodCanBeStatic
    // noinspection JSUnusedGlobalSymbols
    /**
     * Return version info of module
     *
     * @returns {string}
     */
    getVersion() {
        return 'unknown';
    }
});
