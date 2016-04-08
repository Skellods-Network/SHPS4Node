'use strict';

var sym = require('../interface/config-symbols.h.js');


require('../interface/config.h.js').prototype._init = function () {

    this[sym.domains] = [];

    this[sym.cfg.master] = {};
    this[sym.cfg.vhosts] = {};

    this[sym.template.database] = {};
    this[sym.template.vhost] = {};
    this[sym.template.master] = {};
};
