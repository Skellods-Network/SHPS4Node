'use strict';

// There is a bug in NML@2.1.1. Since v3.0.0 is out it's unlikely that the bug will be fixed in v2.x, so we will have to wait for the change to NML@3.x
// var nml = require('node-mod-load')('SHPS_nosql');
// nml.addDir('./interface', true);
// nml.addDir('./src', true);
// module.exports = nml.libs['nosql.h']; // Will act like a singleton

module.exports = require('./interface/nosql.h.js');

require('./src/nosql.init.c.js');
require('./src/nosql.openTable.c.js');


//Table
require('./interface/nosql-table.h.js');

require('./src/nosql-table.init.c.js');
require('./src/nosql-table.insert.c.js');
