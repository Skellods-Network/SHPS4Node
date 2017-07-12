'use strict';

const mix = require('mics').mix;


module.exports = mix(superclass => class extends superclass {

    /**
     * Return version info of module
     *
     * @returns {string}
     */
    static getVersion() {
        return 'unknown';
    }
});
