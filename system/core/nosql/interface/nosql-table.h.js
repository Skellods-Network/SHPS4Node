'use strict';


module.exports = class NoSQLTable {

    constructor($noSQL, $name) {

        this._nosql = $noSQL;
        this._name = $name;
    }

    /**
     * Init method
     * Has to be called before anything else
     *
     * @result Promise
     */
    init() { throw 'Not Implemented!'; }

    /**
     * Insert rows into table
     * 
     * @param $vals
     *  Object or array of objects containing values (1 object / row)
     * 
     * @return Promise(Object|Array)
     *   The resolving object(s) will contain information about the insert(s), containing for example the row index
     */
    insert($vals) { throw 'Not Implemented!'; }


};
