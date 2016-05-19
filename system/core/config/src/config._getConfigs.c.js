'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype._getConfigs = function () {

    return this[sym.cfg.vhosts];
};
