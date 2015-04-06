'use strict';

var me = module.exports;

var helper = require('./helper.js');
var log = require('./log.js');
var sql = require('./sql.js');

var mp = {
    self: this
};


/**
 * Creates new sqlQueryBuilder Object
 * 
 * @param $sqb Object
 *  SQL QueryBuilder Object
 * @return Object
 */
var _newSQLConditionBuilder 
= me.newSQLConditionBuilder = function f_sqlConditionBuilder_newSQLConditionBuilder($sqb) {
    
    return new _sqlConditionBuilder($sqb);
};

var _sqlConditionBuilder = function c_sqlConditionBuilder($sqb) {
    
    var _mp = {
        self: this
    };
    
    var _conditions = '';

    /**
     * Is the current condition the first in the string?
     * 
     * @var boolean
     */
    var _firstCondition = true;

    
    var _bindQueryBuilder =
    this.bindQueryBuilder = function f_sqlConditionBuilder_bindQueryBuilder($qb) {

        $sqb = $qb;
    };

    var _toString =
    this.toString = function f_sqlConditionBuilder_toString() {
    
        return _conditions;    
    };
    
    /**
     * Turn cols, strings and integers into proper SQL queryable values
     * 
     * @param mixed $value
     * @return string
     */
    var _prepare 
    = mp.prepare = function f_sqlConditionBuilder_sqlConditionBuilder_prepare($value) {
    
        if (typeof $value == 'string') {

            $value = $sqb.getSQL().standardizeString($value);
        }
        else if ($value.toString !== 'undefined') {

            $value = $value.toString();
        }
        else {

            $value = 'NULL';
            log.error('Value Type mismatch in sqlConditionsBuilder_prepare!');
        }

        return $value;
    };
    
    var _and =
    this.and = function f_sqlConditionBuilder_sqlConditionBuilder_and($left, $right) {
    
        if (typeof $left !== 'undefined' && typeof $right !== 'undefined') {

            if (_firstCondition) {
                
                _firstCondition = false;
            }
            else {
                
                _conditions += 'AND ';
            }

            _conditions += '(' + _prepare($left(_newSQLConditionBuilder())) + ' AND ' + _prepare($right(_newSQLConditionBuilder())) + ') ';
        }
        else {

            log.error('Value Type mismatch in sqlConditionsBuilder_and!');
        }

        return this;
    };
    
    var _or =
    this.or = function f_sqlConditionBuilder_sqlConditionBuilder_or($left, $right) {
    
        if (typeof $left !== 'undefined' && typeof $right !== 'undefined') {
            
            if (_firstCondition) {
                
                _firstCondition = false;
            }
            else {
                
                _conditions += 'OR ';
            }
            
            _conditions += '(' + _prepare($left(_newSQLConditionBuilder())) + ' AND ' + _prepare($right(_newSQLConditionBuilder())) + ') ';
        }
        else {
            
            log.error('Value Type mismatch in sqlConditionsBuilder_and!');
        }
        
        return this;
    };
    
    var _comparison = function f_sqlConditionBuilder_sqlConditionBuilder_equal($left, $operator, $right) {
        
        if (_firstCondition) {
            
            _firstCondition = false;
        }
        else {
            
            _conditions += 'AND ';
        }
        
        if (typeof $left === 'object') {
            
            $sqb.addTable($left.getTable());
        }
        
        if (typeof $right === 'object') {
            
            $sqb.addTable($right.getTable());
        }

        _conditions += _prepare($left) + $operator + _prepare($right);
    };
    
    var _between =
    this.between = function f_sqlConditionBuilder_sqlConditionBuilder_between($left, $right) {
        
        if (_firstCondition) {
            
            _firstCondition = false;
        }
        else {
            
            _conditions += 'AND ';
        }
        
        _conditions += 'BETWEEN ' + _prepare($left) + ' AND ' + _prepare($right);

        return this;
    };

    var _equal =
    this.equal =
    this.eq =
    this.same = function f_sqlConditionBuilder_sqlConditionBuilder_equal($left, $right) {

        _comparison($left, '=', $right);
        return this;
    };
    
    var _unequal =
    this.unequal =
    this.different =
    this.ne =
    this.notEqual = function f_sqlConditionBuilder_sqlConditionBuilder_unequal($left, $right) {
        
        _comparison($left, '<>', $right); // <> is ANSI
        return this;
    };
    
    var _greater =
    this.greater =
    this.more =
    this.gt = function f_sqlConditionBuilder_sqlConditionBuilder_greater($left, $right) {
        
        _comparison($left, '>', $right);
        return this;
    };
    
    var _less =
    this.less =
    this.smaller =
    this.lt = function f_sqlConditionBuilder_sqlConditionBuilder_less($left, $right) {
        
        _comparison($left, '<', $right);
        return this;
    };
    
    var _greaterEqual =
    this.greaterEqual =
    this.moreEqual =
    this.ge = function f_sqlConditionBuilder_sqlConditionBuilder_greaterEqual($left, $right) {
        
        _comparison($left, '>=', $right);
        return this;
    };
    
    var _lessEqual =
    this.lessEqual =
    this.smallerEqual =
    this.le = function f_sqlConditionBuilder_sqlConditionBuilder_lessEqual($left, $right) {
        
        _comparison($left, '<=', $right);
        return this;
    };
    
    var _like =
    this.like =
    this.similar = function f_sqlConditionBuilder_sqlConditionBuilder_like($left, $right) {
        
        _comparison($left, ' LIKE ', $right);
        return this;
    };
    
    var _isNull =
    this.isNull = function f_sqlConditionBuilder_sqlConditionBuilder_isNull($val) {
        
        _comparison($left, ' IS ', { toString: function () { return 'NULL'; } });
        return this;
    };
    
    var _isNotNull =
    this.isNotNull = function f_sqlConditionBuilder_sqlConditionBuilder_isNotNull($val) {
        
        _comparison($left, ' IS NOT ', { toString: function () { return 'NULL'; } });
        return this;
    };
    
    var _notDistinct =
    this.notDistinct = function f_sqlConditionBuilder_sqlConditionBuilder_notDistinct($left, $right) {
        
        _comparison($left, ' IS NOT DISTINCT FROM ', $right);
        return this;
    };

    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug
    = mp.hug
    this.hug = function f_sqlConditionBuilder_sqlConditionBuilder_hug($h) {
        
        return helper.genericHug($h, _mp, function f_sql_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };

    var _execute =
    this.execute = function f_sqlConditionBuilder_sqlConditionBuilder_execute() {
    
        return $sqb.execute(this);
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
= me.hug
= mp.hug =
this.hug = function f_sqlConditionBuilder_hug($h) {
    
    return helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
