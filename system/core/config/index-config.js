'use strict';

// There is a bug in NML@2.1.1. Since v3.0.0 is out it's unlikely that the bug will be fixed in v2.x, so we will have to wait for the change to NML@3.x
// var nml = require('node-mod-load')('SHPS_config');
// nml.addDir('./interface', true);
// nml.addDir('./src', true);
// module.exports = new nml.libs['config.h']; // Will act like a singleton

var Config = require('./interface/config.h.js');

require('./src/config.getDBConfig.c.js');
require('./src/config.getHPConfig.c.js');
require('./src/config.getMasterConfig.c.js');
require('./src/config.getVHostConfig.c.js');
require('./src/config.readConfig.c.js');

require('./src/config._init.c.js');

require('./src/config.getConfig.c.js'); // Deprecated since v4.2.0, remove in v4.3.0

// Internal stuff
require('./src/config._getConfigs.c.js');


module.exports = new Config();
