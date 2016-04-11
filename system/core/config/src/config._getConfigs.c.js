'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getConfigs = function () {

    return this[sym.cfg.vhosts];
};
