'use strict';

const H = require('../interface/main.h');
const sym = require('../interface/main.sym.h');

H.prototype[sym.construct] = function mainConstructor($isDebug = false) {
    Object.defineProperty(this, '_isDebug', {
        configurable: false,
        enumerable: false,
        value: $isDebug,
        writable: false,

    });

    this.mixins = H.mixins;
    this.directories = H.directories;
    this.RequestState = H.RequestState;
};
