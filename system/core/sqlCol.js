'use strict';

var me = module.exports;

var helper = require('./helper.js');

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
= me.hug = function f_sqlCol_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _sqlCol = function c_sqlCol($table, $name, $returnAs) {
    
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
    = mp.hug =
    this.hug = function f_sqlCol_hug($h) {
        
        return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };

    var _toString 
    = mp.toString =
    this.toString = function f_sqlCol_toString($alias) {
        
        var r = '';
        if ($name === '*') {

            r = '*'
        }
        else {

            var r = $table.toString() + '.' + $table.getSQL().standardizeName($name);
            if (typeof $returnAs !== 'undefined' && $alias) {
                
                r += ' AS ' + $returnAs;
            }
        }

        return r;
    };
    
    var _getTable 
    = mp.getTable =
    this.getTable = function f_sqlCol_getTable() {

        return $table;
    };

    return this;
};

var _newCol 
= me.newCol = function f_sqlCol_newCol($table, $name) {
    
    return new _sqlCol($table, $name);
};