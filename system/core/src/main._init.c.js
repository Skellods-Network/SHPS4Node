'use strict';

const h = require('../interface/main.h');

h.prototype._init = function($isDebug = false) {

    this._isDebug = $isDebug;
    this.mixins = h.mixins;
    this.directories = h.directories;
};
