'use strict';

var me = module.exports;

var libs = require('node-mod-load').libs;

var mp = {
    self: this,
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

    /**
     * Bind a QueryBuilder to this ConditionBuilder
     * A ConditionBuilder must always be attached to a QueryBuilder!
     * 
     * @param Object QueryBuilder
     * @result Object this ConditionBuilder
     */
    var _bindQueryBuilder =
    this.bindQueryBuilder = function f_sqlConditionBuilder_bindQueryBuilder($qb) {

        $sqb = $qb;
        return this;
    };
    
    /**
     * Query-conformant serialization
     * For example:
     *   `SHPS_test`.`user`.`user`='admin' OR `SHPS_test`.`user`.`user`='root'
     *   
     * @result string
     */
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
        
        var errorFun = function () {

            $value = 'NULL';
            throw ('Value Type mismatch in sqlConditionsBuilder_prepare!');
        }
        
        if (typeof $value === 'undefined') {
            
            errorFun();
        }
        else {
            
            if (typeof $value === 'string') {
                
                $value = $sqb.getSQL().standardizeString($value);
            }
            else if (typeof $value === 'number') {

                // Do nothing. I really have to think about a better solution for this...
            }
            else if ($value.toString !== 'undefined') {
                
                $value = $value.toString();
            }
            else {

                errorFun();
            }
        }

        return $value;
    };
    
    /**
     * Adds an AND-statement in breakets into the condition string
     * The two functions will be called with a ConditionBuilder as first parameter
     * This can be used to build either side of the AND-statement
     * e.g.
     *   $sql.get(tblTest.col('foo'))
     *       .fulfilling()
     *       .and(function($sqb) {
     *       
     *           $sqb.eq(tblTest.col('bar'), 'val');
     *       }, function($sqb) {
     *       
     *           $sqb.gt(tblTest.col('ID'), 1);
     *       })
     *       .execute()
     *       .done(...);
     *       
     * @param function(ConditionBuilder) $left
     * @param function(ConditionBuilder) $right
     * @result Object this ConditionBuilder
     */
    var _and =
    this.and = function f_sqlConditionBuilder_sqlConditionBuilder_and($left, $right) {
    
        if (typeof $left !== 'undefined' && typeof $right !== 'undefined') {

            if (_firstCondition) {
                
                _firstCondition = false;
            }
            else {
                
                _conditions += ' AND ';
            }

            _conditions += '(' + _prepare($left(_newSQLConditionBuilder())) + ' AND ' + _prepare($right(_newSQLConditionBuilder())) + ')';
        }
        else {

            throw ('Value Type mismatch in sqlConditionsBuilder_and!');
        }

        return this;
    };
    
    /**
     * Adds an OR-statement in breakets into the condition string
     * The two functions will be called with a ConditionBuilder as first parameter
     * This can be used to build either side of the OR-statement
     * e.g.
     *   $sql.get(tblTest.col('foo'))
     *       .fulfilling()
     *       .or(function($sqb) {
     *       
     *           $sqb.eq(tblTest.col('bar'), 'val');
     *       }, function($sqb) {
     *       
     *           $sqb.lt(tblTest.col('ID'), 10);
     *       })
     *       .execute()
     *       .done(...);
     *       
     * @param function(ConditionBuilder) $left
     * @param function(ConditionBuilder) $right
     * @result Object this ConditionBuilder
     */
    var _or =
    this.or = function f_sqlConditionBuilder_sqlConditionBuilder_or($left, $right) {
    
        if (typeof $left !== 'undefined' && typeof $right !== 'undefined') {
            
            if (_firstCondition) {
                
                _firstCondition = false;
            }
            else {
                
                _conditions += ' AND ';
            }
            
            _conditions += '(' + _prepare($left(_newSQLConditionBuilder($sqb))) + ' OR ' + _prepare($right(_newSQLConditionBuilder($sqb))) + ')';
        }
        else {
            
            throw ('Value Type mismatch in sqlConditionsBuilder_and!');
        }
        
        return this;
    };
    
    var _comparison = function f_sqlConditionBuilder_sqlConditionBuilder_equal($left, $operator, $right) {
        
        if (_firstCondition) {
            
            _firstCondition = false;
        }
        else {
            
            _conditions += ' AND ';
        }
        
        if (typeof $left === 'object') {
            
            $sqb.addTable($left.getTable());
        }
        
        if (typeof $right === 'object') {
            
            $sqb.addTable($right.getTable());
        }
        
        if ($left !== 'NULL') {
            
            $left = _prepare($left);
        }

        if ($right !== 'NULL') {

            $right = _prepare($right);
        }

        _conditions += $left + $operator + $right;
    };
    
    /**
     * Needed condition-value is in between two values
     * 
     * @param $col Object sqlCol
     * @param $left mixed
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _between =
    this.between = function f_sqlConditionBuilder_sqlConditionBuilder_between($col, $left, $right) {
        
        if (_firstCondition) {
            
            _firstCondition = false;
        }
        else {
            
            _conditions += ' AND ';
        }
        
        $sqb.addTable($col.getTable());

        _conditions += _prepare($col) + ' BETWEEN ' + _prepare($left) + ' AND ' + _prepare($right);

        return this;
    };
    
    /**
     * Some col of the table needs to be equal to some other col or value
     * Function-Aliases:
     *   - eq
     *   - same
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _equal =
    this.equal =
    this.eq =
    this.same = function f_sqlConditionBuilder_sqlConditionBuilder_equal($left, $right) {

        _comparison($left, '=', $right);
        return this;
    };
    
    /**
     * Some col of the table must not be equal to some other col or value
     * Function-Aliases:
     *   - ne
     *   - different
     *   - notEqual
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _unequal =
    this.unequal =
    this.different =
    this.ne =
    this.notEqual = function f_sqlConditionBuilder_sqlConditionBuilder_unequal($left, $right) {
        
        _comparison($left, '<>', $right); // <> is ANSI
        return this;
    };
    
    /**
     * Some col of the table must be greater than some other col or value
     * Function-Aliases:
     *   - gt
     *   - more
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _greater =
    this.greater =
    this.more =
    this.gt = function f_sqlConditionBuilder_sqlConditionBuilder_greater($left, $right) {
        
        _comparison($left, '>', $right);
        return this;
    };
    
    /**
     * Some col of the table must be less than some other col or value
     * Function-Aliases:
     *   - lt
     *   - smaller
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _less =
    this.less =
    this.smaller =
    this.lt = function f_sqlConditionBuilder_sqlConditionBuilder_less($left, $right) {
        
        _comparison($left, '<', $right);
        return this;
    };
    
    /**
     * Some col of the table must be greater or equal than some other col or value
     * Function-Aliases:
     *   - ge
     *   - moreEqual
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _greaterEqual =
    this.greaterEqual =
    this.moreEqual =
    this.ge = function f_sqlConditionBuilder_sqlConditionBuilder_greaterEqual($left, $right) {
        
        _comparison($left, '>=', $right);
        return this;
    };
    
    /**
     * Some col of the table must be less or equal than some other col or value
     * Function-Aliases:
     *   - ge
     *   - moreEqual
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _lessEqual =
    this.lessEqual =
    this.smallerEqual =
    this.le = function f_sqlConditionBuilder_sqlConditionBuilder_lessEqual($left, $right) {
        
        _comparison($left, '<=', $right);
        return this;
    };
    
    /**
     * Some col of the table must be (sql-)like some other value
     * Function-Aliases:
     *   - similar
     * 
     * @param mixed $left
     * @param $right mixed
     * @result Object this ConditionBuilder
     */
    var _like =
    this.like =
    this.similar = function f_sqlConditionBuilder_sqlConditionBuilder_like($left, $right) {
        
        _comparison($left, ' LIKE ', $right);
        return this;
    };
    
    /**
     * Some col of the table must be NULL
     * 
     * @param sqlCol $val
     * @result Object this ConditionBuilder
     */
    var _isNull =
    this.isNull = function f_sqlConditionBuilder_sqlConditionBuilder_isNull($val) {
        
        _comparison($val, ' IS ', 'NULL');
        return this;
    };
    
    /**
     * Some col of the table must not be NULL
     * 
     * @param sqlCol $val
     * @result Object this ConditionBuilder
     */
    var _isNotNull =
    this.isNotNull = function f_sqlConditionBuilder_sqlConditionBuilder_isNotNull($val) {
        
        _comparison($val, ' IS NOT ', 'NULL');
        return this;
    };
    
    /**
     * Some col of the table must not be distinct from some other col or value
     * 
     * @param mixed $left
     * @param mixed $right
     * @result Object this ConditionBuilder
     */
    var _notDistinct =
    this.notDistinct = function f_sqlConditionBuilder_sqlConditionBuilder_notDistinct($left, $right) {
        
        _comparison($left, ' IS NOT DISTINCT FROM ', $right);
        return this;
    };
    
    /**
     * Order result by a col
     * 
     * @param sqlCol $col
     * @param boolean $descending //Default: false
     * @result Object this ConditionBuilder
     */
    var _orderBy =
    this.orderBy = function f_sqlQueryBuilder_orderBy($col, $descending) {
        
        $sqb.orderBy($col, $descending);

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
        
        return libs.helper.genericHug($h, _mp, function f_sql_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };
    
    /**
     * Execute query
     * 
     * @result Promise|Object
     *   If no sqlQueryBuilder is attached, this sqlConditionBuilder is returned
     */
    var _execute =
    this.execute = function f_sqlConditionBuilder_sqlConditionBuilder_execute() {
        
        if ($sqb) {

            return $sqb.execute(this);
        }
        else {

            return this;
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
= me.hug
= mp.hug =
this.hug = function f_sqlConditionBuilder_hug($h) {
    
    return libs.helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};
