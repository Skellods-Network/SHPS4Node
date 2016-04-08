'use strict';

var sym = require('../interface/config-symbols.h.js');

require('../interface/config.h.js').prototype.getHPConfig = function ($group, $key, $domain) {

    if (typeof $domain !== 'undefined' &&
        typeof this[sym.cfg.vhosts][$domain] !== 'undefined' &&
        typeof this[sym.cfg.vhosts][$domain][$group] !== 'undefined' &&
        typeof this[sym.cfg.vhosts][$domain][$group][$key] !== 'undefined') {

        return this[sym.cfg.vhosts][$domain][$group][$key].value;
    }

    if (typeof this[sym.cfg.master][$group] !== 'undefined') {

        if (typeof $key !== 'undefined' &&
            (typeof this[sym.cfg.master][$group] !== 'undefined' && typeof this[sym.cfg.master][$group][$key] !== 'undefined')) {

            return this[sym.cfg.master][$group][$key].value || this[sym.cfg.master][$group][$key].default;
        }
    }
    else if ($group === 'config') {

        return typeof this[sym.cfg.master][$key].value !== 'undefined' ? this[sym.cfg.master][$key].value : this[sym.cfg.master][$key].default;
    }
    else {

        if (typeof this[sym.cfg.master]['config'] !== 'undefined' && typeof this[sym.cfg.master]['config'][$group] !== 'undefined') {

            return typeof this[sym.cfg.master]['config'][$group].value !== 'undefined' ? this[sym.cfg.master]['config'][$group].value : this[sym.cfg.master]['config'][$group].default;
        }
    }

    return;
};