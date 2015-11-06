'use strict';

var me = module.exports;

var libs = require('node-mod-load').libs;


var _sqlCol = function c_sqlCol($table, $name, $returnAs) {

    var distinct = false;

    
    /**
     * In a query, the results will be distinct for this column
     * 
     * @result Object this sqlCol
     */
    var _distinct 
    this.distinct = function f_sqlCol_distinct() {

        distinct = true;
        return this;
    };
    
    /**
     * Define an alias for the column which will be used in the result rows
     * 
     * @result Object this sqlCol
     */
    var _as 
    this.as = function f_sqlCol_as($alias) {

        $returnAs = $alias;
        return this;
    };
    
    /**
     * Serializes the column into a query-conform text
     * For example
     *   DISTINCT `SHPS_test`.`user`.`user` AS `userName`
     *   
     * @param boolean $alias
     *   Should the alias be added
     *   Default: false
     * @result string
     */
    var _toString 
    this.toString = function f_sqlCol_toString($alias) {
        
        var r = '';
        if ($name === '*') {

            r = '*';
        }
        else {
            
            var r = distinct ? 'DISTINCT '
                             : '';

            r += $table.toString() + '.' + $table.getSQL().standardizeName($name);
            if (typeof $returnAs !== 'undefined' && $alias) {
                
                r += ' AS ' + $table.getSQL().standardizeName($returnAs);
            }
        }

        return r;
    };
    
    /**
     * Returns the table in which the column is to be found
     * 
     * @result Object sqlTable
     */
    var _getTable 
    this.getTable = function f_sqlCol_getTable() {

        return $table;
    };

    return this;
};

var _newCol 
= me.newCol = function f_sqlCol_newCol($table, $name, $asName) {
    
    return new _sqlCol($table, $name, $asName);
};