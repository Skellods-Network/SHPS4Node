'use strict';

var me = module.exports;


me.master = {
    "workers": {
        "description": "Spawns {%value} workers to handle work. Workers are working even closer together than clustered SHPSs. Makes use of multiple cores. Even with 0 workers there will always be a master process. Insert -1 for smart worker regulation",
        "value": -1
    }
}

me.config = {

}