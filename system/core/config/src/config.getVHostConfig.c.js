'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getVHostConfig = function ($uri, $section, $key) {

    if (typeof $section === 'undefined') {

        return this[sym.cfg.vhosts][$uri];
    }

    if (typeof $key === 'undefined') {

        return this[sym.cfg.vhosts][$uri][$section][$alias];
    }

    return this[sym.cfg.vhosts][$uri][$section][$alias][$key];
};
