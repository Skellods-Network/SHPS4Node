'use strict';

var me = module.exports;

var mysql = require('mysql');
var u = require('util');

var log = require('./log.js');
var helper = require('./helper.js');
var sql = require('./sql.js');
var scb = require('./sqlConditionBuilder.js');

var mp = {
    self: this
};

//var sqlP = sql.hug(mp).self;


var _newSQLQueryBuilder 
= me.newSQLQueryBuilder = function f_sql_newSQLQueryBuilder($sql) {

    return new _SQLQueryBuilder($sql);
};

var _SQLQueryBuilder = function f_sql_sqlQueryBuilder($sql) {
    /*if (typeof $sql !== typeof sqlP.SQL) {
        
        log.error('The queryBuilder needs a valid sql object!');
        return;
    }*/
    

    var mp = {
        self: this
    };

    /**
     * Contains type of operation
     * 0 = UNDEFINED
     * 1 = GET
     * 2 = SET
     * 3 = DELETE
     * 
     * @var int
     */
    var operation = 0;
    
    /**
     * Data to work with
     * GET: cols to get
     * SET: col=>value to set
     * 
     * @var [] of sql_col
     */
    var buf = [];
    
    /**
     * Table to use for set or delete operations
     * 
     * @var sqlTable
     */
    var table = null;
    
    /**
     * Additional tables which need to be listed in the SQL query
     * 
     * @var []
     */
    var additionalTables = [];
    

    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug =
    this.hug = function f_sqlQueryBuilder_hug($h) {
        
        return helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };

    var _reset =
    this.reset = function f_sqlQueryBuilder_reset() {

        operation = 0;
        buf = [];
    };

    var _get =
    this.get = function f_sqlQueryBuilder_get(/* ... */) {
    
        _reset();
        operation = 1;

        var i = 0;
        var l = arguments.length;
        while (i < l) {
            
            if (u.isArray(arguments[i])) {

                var j = 0;
                var a = arguments[i];
                var ll = a.length;
                while (j < ll) {

                    buf.push(a[j]);
                    j++;
                }
            }
            else {

                buf.push(arguments[i]);
            }

            i++;
        }

        return this;
    };

    var _set =
    this.set = function f_sqlQueryBuilder_set($table, $data) {
    
        _reset();
        operation = 2;

        table = $table;
        buf = $data;

        return this;
    };

    var _delete =
    this.delete = function f_sqlQueryBuilder_delete($table) {
    
        _reset();
        operation = 3;

        table = $table;

        return this;
    };

    var _fulfilling =
    this.fulfilling = function f_sqlQueryBuilder_fulfilling($conditions) {
        
        if (operation === 0) {
            
            log.error('An action has to be selected before calling `fulfilling` on a queryBuilder!');
        }
        
        if (typeof $conditions === 'undefined') {
            
            return scb.newSQLConditionBuilder(this);
        }
        else {
            
            var cb = u._extend({}, $conditions);
            cb.bindQueryBuilder(this);

            return cb;
        }
    };

    var _getSQL =
    this.getSQL = function f_sqlQueryBuilder_getSQL() {
    
        return $sql;
    };
    
    var _select = function f_sqlQueryBuilder_select($conditions) {
    
        var query = 'SELECT ';
        var colCount = buf.length;
        var tables = additionalTables;
        var i = 0;
        var tmp = null;
        while (i < colCount) {
            
            query += buf[i].toString(true);
            tmp = buf[i].getTable();
            if (tables.indexOf(tmp) < 0) {
                
                tables.push(tmp);
            }
            
            if (i == colCount - 1) {
                
                query += ' ';
            }
            else {
                
                query += ',';
            }
            
            i++;
        }
        
        query += 'FROM ';
        i = 0;
        var tblCount = tables.length;
        while (i < tblCount) {
            
            query += tables[i].toString();
            if (i < tblCount - 1) {
                
                query += ',';
            }
            
            i++;
        }
        
        if (typeof $conditions !== 'undefined') {
            
            query += ' WHERE ' + $conditions.toString();
        }
        
        query += ';';
        return $sql.query(query);
    };
    
    /**
     * Add table to list of tables in SQL query
     * @todo Make faster
     * 
     * @param sqlTable $table
     */
    var _addTable =
    this.addTable = function f_sqlQueryBuilder_addTable($table) {
        
        var i = 0;
        var c = additionalTables.length;
        while (i < c) {
            
            if (additionalTables[i].getAbsoluteName() == $table.getAbsoluteName()) {

                return;
            }

            i++;
        }

        additionalTables.push($table);
    };

    var _execute =
    this.execute = function f_sqlQueryBuilder_execute($conditions) {
        
        switch (operation) {

            case 0: {
                
                log.error('No action selected!');
                break;
            }

            case 1: { // SELECT
                
                return _select($conditions);
                break;
            }

            case 2: {
                
                if (typeof $conditions === 'undefined') { // INSERT

                    return table.insert(buf);
                }
                else { // ALTER

                    return table.update(buf, $conditions);
                }

                break;
            }

            case 3: { // DELETE
                
                if (typeof $conditions === 'undefined') { // DROP TABLE
                    
                    return table.drop();
                }
                else { // DROP ROWS

                    return table.delete($conditions);
                }

                break;
            }

            default: {

                log.error('UNKNOWN ERROR in SQLQueryBuilder (operation `' + operation + '` has no meaning)!');
            }
        }
    };
};

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_sql_hug($h) {
    
    return helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
