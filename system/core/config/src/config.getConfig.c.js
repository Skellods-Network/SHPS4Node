'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getConfig = function ($uri) {

    return this[sym.cfg.vhosts][$uri];
};
