'use strict';

var me = module.exports;

var libs = require('./perf.js').commonLibs;

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
    
    return libs.helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newRow 
= me.newRow = function f_sqlRow_newRow($table) {
    
    return new _sqlRow($table);
};

var _sqlRow = function c_sqlRow($table) {
    
    var mp = {
        self: this
    };

    /**
     * Result data
     * 
     * @var {} of Key => Value pairs indexed by table
     */
    var data = {};
    
    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = me.hug = function f_main_hug($h) {
        
        return libs.helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };
    
    /**
     * Retrive value of result row
     * 
     * @param string $col
     * @param mixed $table sql_table or string, NULL for first found //Default: undefined
     * @return mixed
     */
    var _getValue 
    = this.getValue = function f_sqlRow_getValue($col, $table) {
        
        $table = _getTableName($table);
        if (typeof data[$table] !== 'undefined') {
            
            if (typeof data[$table][$key] !== 'undefined') {
                
                return data[$table][$key];
            }
            else {
                
                return;
            }
        }
        
        for (var e in data) {
            
            if (typeof e[$key] !== 'undefined') {
                
                return e[$key];
            }
        }
        
        return;
    };
    
    /**
     * Get raw data []
     * 
     * @return []
     */
    var _getRawData 
    = this.getRawData = function f_sqlRow_getRawData() {
        
        return data;
    };
    
    /**
     * Add (or edit if already existent) a value pair
     * 
     * @param string $key
     * @param mixed $value
     * @param mixed $table sql_table or string, NULL for default //Default: null
     */
    var _setValue 
    = this.setValue = function f_sqlRow_setValue($key, $value, $table) {
        
        $table = getTableName($table);
        if (typeof data[$table] === 'undefined') {
            
            data[$table] = {};
        }
        
        data[$table][$key] = $value;
    };
    
    /**
     * Returns tablename as string
     * 
     * @param mixed $table
     * @return string
     * @throws exception
     */
    var _getTableName 
    = this.getTableName = function f_sqlRow_getTableName($table) {
        
        if (typeof $table === null || typeof $table === 'undefined') {
            
            $table = SQL_NO_TABLE;
        }
        
        if ($table instanceof libs.sqlTable.hug(mp.self).table) {
            
            $table = $table.getName();
        }
        
        if (typeof $table !== 'string' && !$table instanceof String) {
            
            return;
        }
        
        return $table;
    };
    
    /**
     * Transform resultset into {}<br>
     * If table is set to null, data might be overwritten
     * 
     * @param mixed $table string or \SHPS\sql_table //Default: null
     * @return []
     */
    var _asArray 
    = this.asArray = function f_sqlRow_asArray($table) {
        var r = [];
        if (!($table = _getTableName($table))) {
            
            return;
        }
        
        for (var d in data) {
            
            if ($table === SQL_NO_TABLE || d === $table) {
                
                r[d] = data[d];
            }
        }
        
        return r;
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
};
