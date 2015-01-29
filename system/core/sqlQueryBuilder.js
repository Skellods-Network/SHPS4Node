'use strict';

var me = module.exports;

var _mysql = require('mysql');

var _log = require('./log.js');
var _helper = require('./helper.js');
var _sqlR = require('./sql.js');

var self = this;
var _sql = _sqlR.hug(self); 


var _sql_queryBuilder = function f_sql_sql_queryBuilder($sql) {
    if (typeof $sql !== typeof _sql.SQL) {
        
        log.error('The queryBuilder needs a valid sql object!');
        return;
    }
    
    
    /**
     * Contains type of operation
     * 0 = UNDEFINED
     * 1 = GET
     * 2 = INSERT
     * 3 = ALTER
     * 4 = DELETE
     * 
     * @var int
     */
    var $operation = 0;
    
    /**
     * Data to work with
     * GET: cols to get
     * SET: col=>value to set
     * 
     * @var [] of sql_col
     */
    var $buf = [];
    
    /**
     * Table to use for set or delete operations
     * 
     * @var \SHPS\sql_table
     */
    var $table = null;


}

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_sql_hug($h) {
    
    return helper.genericHug($h, self, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};