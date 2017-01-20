'use strict';

const nmlMain = require('node-mod-load')('SHPS4Node-main');

nmlMain.addDir('./system/core/interface', true);
nmlMain.addDir('./system/core/src', true);

module.exports = nmlMain.libs['main.h'];
