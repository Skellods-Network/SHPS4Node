'use strict';

var fs = require('fs');

var libs = require('node-mod-load').libs;
var sqlite = require('sql.js');


require('../interface/s-h.h.js').prototype._init = function ($db) {

    this.dbPath = libs.main.getDir(SHPS_DIR_DB) + $db;
    
    try {

        fs.accessSync(this.dbPath, fs.F_OK /* | fs.R_OK | fs.W_OK */);
    }
    catch ($e) {
        
        //TODO check what the problem is
        //for now I just take the guess that the file does not exist
        //but an error here could also mean that the user does not have the needed permissions
        
        //TODO catch errors from trying to write..
        fs.writeFileSync(this.dbPath, '');
    }
    finally {

        var filebuffer = fs.readFileSync(this.dbPath);
        this.db = new sqlite.Database(filebuffer);
    }
    
    this.qHead = null;
};
