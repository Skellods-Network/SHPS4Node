'use strict';


/**
 * NoSQL
 * 
 * Analog to SQL
 * I still had to make some changes in order to make sense of the lingo.
 * In a future version, a unified `DB` class will make sense of everything and glue SQL and NoSQL together, possibly also by improving method names on both sides
 */
module.exports = class NoSQL {

    /**
     * Get free connection to the DB from the pool
     * 
     * @param $alias string
     *   DB alias from config file
     * @param @requestState Object
     * @result NoSQL Object
     *   This object is analog to the SQL Object
     */
    constructor($alias, $requestState) {

        this._alias = $alias;
        this._config = $requestState.config;
    }

    /**
     * Init method
     * Has to be called before anything else
     *
     * @result Promise
     */
    init() { throw 'Not Implemented!'; }

    /**
     * Open Document
     *
     * @param $name string
     * @result Object
     *   Document Object
     */
    openTable($name) { throw 'Not Implemented!'; }

    /**
     * Prepare to work with the DB
     *
     * @result Object
     *   QueryBuilder Object
     */
    query() { throw 'Not Implemented!'; }

    /**
     * Free the connection so it can be reused
     */
    free() { throw 'Not Implemented!'; }
};
