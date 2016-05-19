'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getMasterConfig = function ($key) {

    if (typeof $key === 'undefined') {

        return this[sym.cfg.master];
    }

    return this[sym.cfg.master][$key];
};
