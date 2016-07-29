'use strict';

module.exports = class SQLiteHelper {

    /**
     * Constructor
     *
     * @param $db string
     *   Path to DB file
     */
    constructor($db) {

        this._init($db);
    }

    /**
     * Save changes to disk
     *
     * @result Promise
     */
    flush() { throw 'Not Implemented!'; };

    /**
     * Enqueues a query to be handled
     *
     * @param $str string Query
     * @param $bindVals Object
     *   Bind values to replaceables in your prepared statement
     * @param $cb Callable($err, $rows)
     */
    query($str, $bindVals, $cb) { throw 'Not Implemented!'; };
};
