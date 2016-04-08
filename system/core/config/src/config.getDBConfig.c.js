'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getDBConfig = function ($uri, $alias, $key) {

    if (typeof $alias === 'undefined') {

        return this[sym.cfg.vhosts][$uri].databaseConfig;
    }
    
    if (typeof $key === 'undefined') {

        return this[sym.cfg.vhosts][$uri].databaseConfig[$alias];
    }

    return this[sym.cfg.vhosts][$uri].databaseConfig[$alias][$key];
};
