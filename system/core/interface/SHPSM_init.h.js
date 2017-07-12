'use strict';

const Result = require('rustify-js').Result;
const mix = require('mics').mix;


module.exports = mix(superclass => class extends superclass {
    /**
     * Called on module initialization
     *
     * @returns {*}
     */
    static init() {
        return superclass.init
            ? superclass.init()
            : Result.fromSuccess(superclass);
    }

    /**
     * Called on shutdown
     *
     * @returns {*}
     */
    static halt() {
        return superclass.halt
            ? superclass.halt()
            : Result.fromSuccess(superclass);
    }
});
