'use strict';

var me = module.exports;

var q = require('q');
var async = require('vasync');

var helper = require('./helper.js');
var sql = require('./sql.js');
var col = require('./sqlCol.js');
var row = require('./sqlRow.js');
var log = require('./log.js');

var mp = {
    self: this
};


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_main_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newTable 
= me.newTable = function f_sqlTable_newTable($sql, $name) {
    
    return new _sqlTable($sql, $name);
};

var _sqlTable = function c_sqlTable($sql, $name) {

    var _col =
    this.col = function f_sqlTable_col($name) {

        return new col.newCol(this, $name);
    };

    var _getSQL =
    this.getSQL = function f_sqlTable_getSQL() {

        return $sql;
    };

    var _getName =
    this.getName = function f_sqlTable_getName() {

        return $name;
    };

    var _getFullName =
    this.getFullName = function f_sqlTable_getFullName() {

        return $sql.getPrefix() + $name;
    };

    var _getAbsoluteName =
    this.getAbsoluteName = function f_sqlTable_getAbsoluteName() {

        return $sql.standardizeName($sql.getDB()) + '.' + $sql.standardizeName(_getFullName());
    };

    var _getAllColumns =
    this.getAllColumns = function f_sqlTable_getAllColumns() {
        
        log.warning('f_sqlTable_getAllColumns not implemented yet!');
        return [];
    };
    
    /**
     * Drop table
     * 
     * @return Q promise
     */
    var _drop =
    this.drop = function f_sqlTable_drop() {
        
        log.writeNote('Table ' + _getAbsoluteName() + ' will be dropped!');
        /*let*/var sql;
        $sql.isFree()
            ? sql = $sql
            : sql = sql.newSQL($sql);
        
        var defer = q.defer();
        sql.query('DROP TABLE ?;', _getAbsoluteName(), function f_sqlTable_drop_1($r) {
            
            defer.resolve($r);
            sql.free();
        });

        return defer.promise;
    };
    
    /**
     * Insert rows into table
     * 
     * @param $vals
     *  Object or array of objects containing values (1 object / row)
     * 
     * @return Q promise
     */
    var _insert =
    this.insert = function f_sqlTable_insert($vals) {
        
        var defer = q.defer();
        if (typeof $vals === 'array') {// improve this by putting everything into a single query if possible!
            
            async.forEachParallel({
                
                func: _insert,
                inputs: $vals
            }, function f_sqlTable_insert_1($err, $res) {
            
                defer.resolve($err, $res);
            });

            return defer.promise;
        }

        if (typeof $vals !== 'object') {

            log.error('Wrong parameters in f_sqlTable_insert()!');
            return;
        }

        /*let*/var sql;
        $sql.isFree()
            ? sql = $sql
            : sql = sql.newSQL($sql);
        
        var vals = [];
        var keys = [];
        for (var key in $vals) {
            
            keys.push(key);
            if (typeof $vals[key] === 'string') {

                vals.push($sql.standardizeString($vals[key]));
            }
            else if (typeof $vals[key] === 'boolean') {

                vals.push(
                    $vals[key]
                        ? 1
                        : 0
                );
            }
            else {

                vals.push($vals[key]);
            }
        }
        
        var qmark = '';
        var i = 0;
        var l = keys.length;
        while (true) {
            
            qmark += '?';
            i++;
            if (i < l) {

                qmark += ',';
            }
            else {

                break;
            }
        }

        sql.query('INSERT INTO ? (' + qmark + ') VALUES (' + qmark + ');', _getAbsoluteName(), keys, vals, function f_sqlTable_insert_2($r) {
            
            defer.resolve($r);
            sql.free();
        });

        return defer.promise;
    };

    var _delete =
    this.delete = function f_sqlTable_delete($conditions) {
    
        log.warning('f_sqlTable_delete not implemented yet!');
    };

    var _update =
    this.update = function f_sqlTable_update($values, $conditions) {
    
        log.warning('f_sqlTable_update not implemented yet!');
    };
};
