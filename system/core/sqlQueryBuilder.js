'use strict';

var me = module.exports;

var mysql = require('mysql');
var oa = require('object-assign');
var u = require('util');

var libs = require('node-mod-load').libs;

var mp = {
    self: this
};


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
     * Col by which the result is sorted
     * 
     * @var sqlCol
     */
    var orderCol = null;
    
    /**
     * Order ascending (descending if false)
     * 
     * @var boolean
     */
    var orderASC = true;
    
    /**
     * Additional tables which need to be listed in the SQL query
     * 
     * @var []
     */
    var additionalTables = [];

    
    /**
     * Reset this builder
     * The builder is reset whenever a mode-setting method is called
     */
    var _reset =
    this.reset = function f_sqlQueryBuilder_reset() {

        operation = 0;
        buf = [];
    };
    
    /**
     * Fetch data from the DB (SELECT Mode)
     * 
     * @param array|sqlCol
     *   There can be infinite sqlCol or array parameters!
     * @result Object this sqlQueryBuilder
     */
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
    
    /**
     * Upload data to the database
     * If no conditions are defined, the data will be uploaded as new data (INSERT mode)
     * Else the data will be uploaded as replacement for existing data (UPDATE mode)
     * 
     * @param sqlTable $table
     * @param $data Object
     *   For example:
     *   {
     *     "col": "value",
     *     "foo": "bar",
     *   }
     * @result Object this sqlQueryBuilder
     */
    var _set =
    this.set = function f_sqlQueryBuilder_set($table, $data) {
    
        _reset();
        operation = 2;

        table = $table;
        buf = $data;

        return this;
    };
    
    /**
     * Delete rows from a table
     * Must have conditions!
     * 
     * @param sqlTable $table
     * @result sqlQueryBuilder
     */
    var _delete =
    this.delete = function f_sqlQueryBuilder_delete($table) {
    
        _reset();
        operation = 3;

        table = $table;

        return this;
    };
    
    /**
     * Finish Mode selection and start condition building
     * 
     * @param string
     *   Optional! If not set, a sqlConditionBuilder will be returned
     * @return undefined|sqlConditionBuilder
     */
    var _fulfilling =
    this.fulfilling = function f_sqlQueryBuilder_fulfilling($conditions) {
        
        if (operation === 0) {
            
            throw ('An action has to be selected before calling `fulfilling` on a queryBuilder!');
        }
        
        if (typeof $conditions === 'undefined') {
            
            return libs.sqlConditionBuilder.newSQLConditionBuilder(this);
        }
        else {
            
            var cb = oa({}, $conditions);
            cb.bindQueryBuilder(this);

            return cb;
        }
    };

    /**
     * Order result by a col
     * 
     * @param sqlCol $col
     * @param boolean $descending //Default: false
     * @result sqlQueryBuilder this
     */
    var _orderBy =
    this.orderBy = function f_sqlQueryBuilder_orderBy($col, $descending) {
        $descending = typeof $descending !== 'undefined' ? $descending : false;

        orderCol = $col;
        orderASC = !$descending;

        return this;
    };
    
    /**
     * Get parent SQL Object
     * 
     * @result SQL
     */
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
        
        if (orderCol !== null) {

            query += ' ORDER BY ' + orderCol.toString();
            query += orderASC ? ' ASC' : ' DESC';
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
    
    /**
     * Execute query
     * 
     * @param string $conditions
     *   Last chance to add conditions to the query
     * @result Promise|Object
     */
    var _execute =
    this.execute = function f_sqlQueryBuilder_execute($conditions) {
        
        switch (operation) {

            case 0: {
                
                throw ('No action selected!');
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

                throw ('UNKNOWN ERROR in SQLQueryBuilder (operation `' + operation + '` has no meaning)!');
            }
        }
    };
};
