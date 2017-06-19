'use strict';

const h = require('../interface/main.h');

h.prototype._init = function($isDebug = false) {
    Object.defineProperty(this, '_isDebug', {
        configurable: false,
        enumerable: false,
        value: $isDebug,
        writable: false,

    });

    this.mixins = h.mixins;
    this.directories = h.directories;
    this.RequestState = h.RequestState;
};
