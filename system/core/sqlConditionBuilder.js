'use strict';

var me = module.exports;

var LinkedList = require('linkedlist');
var libs = require('node-mod-load').libs;


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
    
    var _conditions = new LinkedList();
    var _lastParamNum = 0;
    
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
     * Query-conformant serialization (sanitized and prepared with parameters)
     * 
     * For example:
     *   `SHPS_test`.`user`.`user`= :cp0 OR `SHPS_test`.`user`.`user`= :cp1
     *   
     * @result string
     */
    var _toString =
    this.toString = function f_sqlConditionBuilder_toString($paramNumOffset, $getNewOffset) {
        
        var r = '';
        
        _conditions.resetCursor();
        _lastParamNum = 0;
        if ($paramNumOffset) {
            
            _lastParamNum = $paramNumOffset;
        }
        
        var item;
        var tmp;
        while (item = _conditions.next()) {
            
            if (!item.col) {
                
                //TODO check if of type sqlConditionBuilder
                if (typeof item.left === 'object') {
                    
                    tmp = item.left.toString(_lastParamNum, true);
                    r += tmp.string || tmp;
                    _lastParamNum = tmp.offset || _lastParamNum;
                }
                else {
                    
                    r += $sqb.getSQL().genParamName('c', _lastParamNum++);
                }
                
                r += item.op;
                
                //TODO check if of type sqlConditionBuilder
                if (typeof item.right !== 'object') {
                    
                    r += $sqb.getSQL().genParamName('c', _lastParamNum++);
                }
                else {
                    
                    tmp = item.right.toString(_lastParamNum, true);
                    r += tmp.string || tmp;
                    _lastParamNum = tmp.offset || _lastParamNum;
                }
            }
            else {
                
                r += item.col.toString() + item.op;
                
                //TODO check if of type sqlConditionBuilder
                if (typeof item.left === 'object') {
                    
                    tmp = item.left.toString(_lastParamNum, true);
                    r += tmp.string || tmp;
                    _lastParamNum = tmp.offset || _lastParamNum;
                }
                else {
                    
                    r += $sqb.getSQL().genParamName('c', _lastParamNum++);
                }
                
                r += ' AND ';
                
                //TODO check if of type sqlConditionBuilder
                if (typeof item.right !== 'object') {
                    
                    r += $sqb.getSQL().genParamName('c', _lastParamNum++);
                }
                else {
                    
                    tmp = item.right.toString(_lastParamNum, true);
                    r += tmp.string || tmp;
                    _lastParamNum = tmp.offset || _lastParamNum;
                }
            }
            
            r += ' AND ';
        }
        
        // If I just could use ES6 destructuring~
        // Really looking forward to switching to Node.JS v6 as LTS
        if (r.length >= 4) {
            
            if ($getNewOffset) {
                
                return { string: r.slice(0, -4), offset: _lastParamNum, };  
            }
            else {
                
                return r.slice(0, -4);  
            }
        }
        else {
            
            if ($getNewOffset) {
                
                return { string: r, offset: _lastParamNum, };  
            }
            else {
                
                return r;
            }
        }
    };
    
    var _getParamValues =
    this.getParamValues = function f_sqlConditionBuilder_getParamValues($paramNumOffset, $getNewOffset) {
        
        var r = {};
        
        _conditions.resetCursor();
        _lastParamNum = 0;
        if ($paramNumOffset) {
            
            _lastParamNum = $paramNumOffset;
        }

        var item;
        var tmp;
        while (item = _conditions.next()) {

            if (item.left.getParamValues) {
                    
                tmp = item.left.getParamValues(_lastParamNum, true);
                r = Object.assign(r, tmp.vals);
                _lastParamNum = tmp.offset;
            }
            else if (typeof item.left !== 'object') {

                r[$sqb.getSQL().genParamName('c', _lastParamNum++).substr(1)] = item.left;
            }

            if (typeof item.right !== 'object') {

                r[$sqb.getSQL().genParamName('c', _lastParamNum++).substr(1)] = item.right;
            }
            else if (item.right.getParamValues) {

                tmp = item.right.getParamValues(_lastParamNum, true);
                r = Object.assign(r, tmp.vals);
                _lastParamNum = tmp.offset;
            }
        }
        
        if ($getNewOffset) {
            
            return { vals: r, offset: _lastParamNum, };
        }
        else {
            
            return r;
        }
    };
    
    var _connect = function f_sqlConditionBuilder_connect($left, $connection, $right) {
        
        if (typeof $left !== 'undefined' && typeof $right !== 'undefined') {

            _conditions.push({
            
                left: $left(_newSQLConditionBuilder()),
                op: $connection,
                right: $right(_newSQLConditionBuilder()),
            });
        }
        else {

            throw ('Value Type mismatch in sqlConditionsBuilder_and!');
        }
        
        return this;
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
    
        return _connect($left, ' AND ', $right);
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
    
        return _connect($left, ' OR ', $right);
    };
    
    var _comparison = function f_sqlConditionBuilder_sqlConditionBuilder_equal($left, $operator, $right) {
        
        var l = $left;
        var r = $right;
        
        //TODO Check if object of type sqlConditionBuilder
        if (typeof l === 'object') {
            
            $sqb.addTable(l.getTable());
        }
        
        //TODO Check if object of type sqlConditionBuilder
        if (typeof r === 'object') {
            
            $sqb.addTable(r.getTable());
        }
        
        if (l === 'NULL') {
            
            l = null;
        }
        
        if (r === 'NULL') {
            
            r = null;
        }
        
        _conditions.push({
            
            left: l,
            op: $operator,
            right: r,
        });
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
        
        if ($col.getTable) {

            $sqb.addTable($col.getTable());
        }

        _conditions.push({
            
            col: $col,
            left: $left,
            op: ' BETWEEN ',
            right: $right,
        });

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
