'use strict';

const Result = require('result-js');


module.exports = require('mixwith').Mixin(superclass => class extends superclass {

    constructor(...args) {

        super(...args);
    }

    static init() {

        return superclass.init
            ? superclass.init()
            : Result.fromSuccess(superclass);
    };

    static halt() {

        return superclass.halt
            ? superclass.halt()
            : Result.fromSuccess(superclass);
    };
});
