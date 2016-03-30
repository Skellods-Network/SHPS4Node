'use strict';

var sym = require('../interface/config-symbols.h.js');


require('../interface/config.h.js').prototype._init = function () {

    this[sym.domains] = [];
    this[sym.cfgMaster] = {};
    this[sym.cfgDBs] = {};
    this[sym.cfgVHosts] = {};
};
