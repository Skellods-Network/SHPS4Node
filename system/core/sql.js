'use strict';

var me = module.exports;

GLOBAL.SHPS_SQL_MYSQL = 2;
GLOBAL.SHPS_SQL_MSSQL = 16;

GLOBAL.SHPS_SQL_MARIA = SHPS_SQL_MYSQL | 4;
GLOBAL.SHPS_SQL_PERCONA = SHPS_SQL_MYSQL | 8;

var mysql = require('mysql');
var mssql = require('mssql');
var pooling = require('generic-pool');
var async = require('vasync');
var Promise = require('promise');
var q = require('q');

var main = require('./main.js');
var log = require('./log.js');
var helper = require('./helper.js');
var sffm = require('./SFFM.js');
var row = require('./sqlRow.js');
var col = require('./sqlCol.js');
var table = require('./sqlTable.js');
var SQLQueryBuilder = require('./sqlQueryBuilder.js');
var SQLConditionBuilder = require('./sqlConditionBuilder.js');

var _sqlConnectionPool = {};
var mp = {
    self: this
};


/**
 * SQL string determinators
 * 
 * @var array
 */
var _stringdeterminator
= mp.stringdeterminator = {};
_stringdeterminator[SHPS_SQL_MYSQL] = '\'';
_stringdeterminator[SHPS_SQL_MARIA] = '\'';
_stringdeterminator[SHPS_SQL_MSSQL] = '\'';

/**
 * SQL variable determinators
 * 
 * @var array
 */
var _variabledeterminator 
= mp.variabledeterminator = {};
_variabledeterminator[SHPS_SQL_MYSQL] = ['`', '`'];
_variabledeterminator[SHPS_SQL_MARIA] = ['`', '`'];
_variabledeterminator[SHPS_SQL_MSSQL] = ['[', ']'];

/**
 * Alias Connections
 * 
 * @var array
 */
var _alias_connections = [];

/**
 * Memcached object
 * 
 * @var memcached
 */
var _memcached = null;

/**
 * Condition Builder currently in use
 * 
 * @var SHPS_sql_conditionBuilder
 */
var _conditionbuilder = null;

var _newCol 
= me.newCol = col.newCol;

var _newRow 
= me.newRow = row.newRow;

var _newTable 
= me.newTable = table.newTable;

var _newConditionBuilder 
= me.newConditionBuilder = SQLConditionBuilder.newSQLConditionBuilder;

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= mp.hug
= me.hug = function f_sql_hug($h) {
    
    return helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * SQL Class<br>
 * For SQLite, a new file will be created if the database file is missing
 * 
 * @param string $user
 * @param string $passwd
 * @param string $database
 * @param string $host
 * @param string $prefix
 * @param array $mcServers [[(Sting)'Host',(Integer)['Port']],[...]]
 */
var _SQL 
= mp.SQL = function ($dbConfig, $connection) {

    if (typeof $dbConfig === 'undefined') {
        
        log.error('Cannot work with undefined dbConfig!');
    }
    
    if (typeof $connection === 'undefined' || $connection === null) {
        
        log.error('Cannot work without connection!');
        return;
    }
    
    var mp = {
        self: this
    };

    /**
     * Total count of SQL queries
     * 
     * @var integer
     */
    var _queryCount = 0;
    
    /**
     * Total time of all SQL queries
     * 
     * @var integer
     */
    var _queryTime = 0;
    
    /**
     * Time last query needed to complete
     * 
     * @var integer
     */
    var _lastQueryTime = 0;
    
    /**
     * Database type
     * 
     * @var integer
     */
    var _dbType = 0;
    
    /**
     * PDO link
     * 
     * @var PDO
     */
    var _connection = null;
    
    /**
     * Connection status
     * 
     * @var boolean
     */
    var _free = false;
    
    /**
     * Containes the last executed query
     * 
     * @var string
     */
    var _lastQuery = '';
    
    /**
     * Containes the last query's statement
     * 
     * @var PDOStatement
     */
    var _statement = null;
    
    /**
     * Contains Table/Col info : [INDEX][table,columne]
     * 
     * @var array of array of strings
     */
    var _tblInfo = [];
    
    /**
     * Index of next row to fetch
     * 
     * @var type 
     */
    var _fetchIndex = 0;
    
    /**
     * Server Type
     * 
     * @var string
     */
    var _serverType = '';
    
    /**
     * Tables to include in current query
     * 
     * @var array of string
     */
    var _includeTable = [];
    
    
    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = mp.hug = function f_sql_hug($h) {
        
        return helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
            
            if ($hugCount > 3) {
                
                return false;
            }
            
            return true;
        });
    };

    /**
     * Make a new SQL query
     * 
     * @param string $query OPTIONAL
     * @param mixed $param several parameters for SQL statement
     * @return mixed Promise if a query was given, else a queryBuilder object is returned
     */
    var _query
    = this.query = function ($query, $param) {
        
        _free = false;
        _fetchIndex = -1;
        var _resultRows = [];

        if (typeof $param !== 'undefined') {

            $query = mysql.format($query, $param, true, main.getHPConfig('generalConfig', 'timezone', $requestState.uri));
            mysql.createQuery($query, cb);
        }
        
        if (typeof $query !== 'undefined') {
            
            _lastQuery = $query;
            _queryCount++;
            var start = process.hrtime();
            
            return new Promise(function ($fulfill, $reject) {

                $connection.query($query, function ($err, $rows, $fields) {
                    
                    var t = process.hrtime(start);
                    _lastQueryTime = t[0] + (t[1] / 1000000000);
                    _queryTime += _lastQueryTime;
                    
                    if ($err) {
                        
                        $reject($err);
                    }
                    else {
                        
                        _resultRows = $rows;
                        $fulfill($rows, $fields);
                    }
                });
            });
        }

        return SQLQueryBuilder.newSQLQueryBuilder(this);
    }
    
    /**
     * Standardizes names in a SQL query by adding determinators
     * 
     * @param string $var
     * @return string
     */
    var _standardizeName
    = this.standardizeName = function ($var) {
        
        /*let*/var s = _variabledeterminator[_dbType][0];
        /*let*/var e = _variabledeterminator[_dbType][1];
        if ($var !== '*'
            && $var.substring(0, 1) !== s
            && $var.substring(-1) !== e) {

            $var = s + sffm.cleanStr($var) + e;
        }

        return $var;
    }
    
    /**
     * Standardizes strings in a SQL query by adding determinators
     * 
     * @param string $str
     * @return string
     */
    var _standardizeString
    = this.standardizeString = function ($str) {

        $str = sffm.cleanStr($str);
        /*let*/var s = _stringdeterminator[_dbType];
        if ($str.substring(0, 1) != s 
            && $str.substring(-1) != s) {

            $str = s + $str + s;
        }
        
        return $str;
    }
    
    /**
     * Get query count
     * 
     * @return integer
     */
    var _getQueryCount
    = this.getQueryCount = function () {
        
        return 0;
    }

    /**
     * Get overall query time
     * 
     * @return integer
     */
    var _getQueryTime
    = this.getQueryTime = function () {
        
        return 0;
    }
    
    /**
     * Get time the last query needed to complete
     * 
     * @return integer
     */
    var _getLastQueryTime 
    = this.getLastQueryTime = function () {
        
        return _lastQueryTime;
    }
    
    /**
     * Get connection count
     * 
     * @return integer
     */
    var _getConnectionCount
    = this.getConnectionCount = function () {
        
        return 0;
    }
    
    /**
     * Create a custom Table and return table object
     * 
     * @param string $name
     * @param [] $cols Array of sql_colspec
     * @param boolean $ifNotExists Throws error if table exists //Default: true
     * @param boolean $temp If true table is only temporary (in memory) //Default: false
     * @return sql_table
     */
    var _createTable
    = this.createTable = function ($name, $cols, $ifNotExists/* = true*/, $temp/* = false*/) {
        
        log.error('Not implemented yet');
    }
    
    /**
     * Get Server Type
     * 
     * @return string
     */
    var _getServerType
    = this.getServerType = function () {
        
        return _dbType;
    }
    
    /**
     * Return table object
     * 
     * @param string $name
     * @return sql_table
     */
    var _openTable
    = this.openTable = function ($name) {
        
        return new sql_table(this, $name);
    }
    
    /**
     * Return last SQL Query as string
     * 
     * @return string
     */
    var _getLastQuery
    = this.getLastQuery = function () {
        
        return _lastQuery;
    }
    
    /**
     * Return last error
     * 
     * @return string
     */
    var _getLastError
    = this.getLastError = function () {
        
        return '';
    }
    
    /**
     * Get all results
     * 
     * @return Array of sql_resultrow
     */
    var _fetchResult 
    = this.fetchResult = function () {
        
        return [];
    }
    
    /**
     * Get one result row
     * 
     * @return sql_resultrow
     */
    var _fetchRow
    = this.fetchRow = function () {
        
        _fetchIndex++;
        return _resultRows[_fetchIndex];
    }
    
    var _free =
    this.free = function f_sql_SQL_free() {
        
        _sqlConnectionPool[_makePoolName($dbConfig)].release($connection);
        _free = true;
    };
    
    var _getDB 
    = mp.getDB =
    this.getDB = function f_sql_getDB() {
    
        return $dbConfig.name.value;
    };
    
    var _getPrefix 
    = mp.getPrefix =
    this.getPrefix = function f_sql_getPrefix() {
    
        return $dbConfig.prefix.value;
    };
    
    /**
     * CONSTRUCTOR
     */
    switch ($dbConfig.type.value) {

        case SHPS_SQL_MYSQL: {

            _query('SET NAMES \'UTF8\';').then().done();
            _dbType = SHPS_SQL_MYSQL;
            _query('SELECT VERSION();').then(function ($res) {
                
                if ($res['VERSION()'].strpos('MariaDB') !== false) {
                    
                    _dbType |= SHPS_SQL_MARIA;
                }
            }).done();

            break;
        }

        default: {

            _dbType = $dbConfig.type.value;
        }
    }

    _free = true;
}


/**
 * Get connection count
 * 
 * @return integer
 */
var _getConnectionCount 
= me.getConnectionCount = function f_sql_getConnectionCount($requestState) {
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    
}

var _makePoolName = function f_sql_makePoolName($dbConfig) {

    return $dbConfig.host.value +
        $dbConfig.port.value +
        $dbConfig.name.value +
        $dbConfig.user.value +
        $dbConfig.prefix.value;
}

/**
 * Create new managed SQL connection from alias (see config file)
 * 
 * @param string $alias //Default: 'default'
 * @param $requestState requestState Object
 * @return _SQL
 */
var _newSQL 
= me.newSQL = function f_sql_newSQL($alias, $requestState) {
    $alias = (typeof $alias !== 'undefined' ? $alias : 'default');
    if (typeof $requestState === 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    var defer = q.defer();
    var config = $requestState.config;
    var dbConfig = config.databaseConfig[$alias];
    var poolName = _makePoolName(dbConfig);

    var nPool = _sqlConnectionPool[poolName];
    if (typeof nPool === 'undefined') {
        
        switch (dbConfig.type.value) {

            case SHPS_SQL_MYSQL: {
                
                _sqlConnectionPool[poolName] = nPool = mysql.createPool({
                    
                    connectionLimit: dbConfig.connectionLimit.value,
                    host: dbConfig.host.value,
                    port: dbConfig.port.value,
                    user: dbConfig.user.value,
                    password: dbConfig.pass.value,
                    database: dbConfig.name.value,
                    charset: 'utf8mb4_general_ci',
                    timezone: config.generalConfig.timezone.value,
                    multipleStatements: true
                });
                
                q.resolve(new _SQL(dbConfig, nPool.getConnection()));

                break;
            }

            case SHPS_SQL_MSSQL: {
                
                _sqlConnectionPool[poolName] = nPool = pooling.Pool({
                        
                    name: poolName,
                    create: function f_sql_newSQL_create_MSSQL_pool($cb) {
                            
                        $cb(null, new mssql.Connection({
                                
                            server: dbConfig.host.value,
                            port: dbConfig.port.value,
                            user: dbConfig.user.value,
                            password: dbConfig.pass.value,
                            database: dbConfig.name.value
                        }, function ($err) {
                                
                            
                        }));
                    },
                    destroy: function f_sql_newSQL_destroy_MSSQL_pool($res) {
                        
                        if (typeof $res.connection !== 'undefined') {

                            $res.connection.close();
                        }
                    },
                    max: dbConfig.connectionLimit.value,
                    min: 1,
                    idleTimeoutMillis: 30000,
                    log: false
                });

                nPool.acquire(function ($err, $client) {
                    
                    if ($err === null) {

                        defer.resolve(new _SQL(dbConfig, new mssql.Request($client)));
                    }
                    else {

                        defer.reject($err);
                    }
                    
                });

                break;
            }

            default: {

                log.error('Database type not supported!');
            }
        }
    }
    else {

        nPool.acquire(function ($err, $client) {
            
            defer.resolve(new _SQL(dbConfig, $client));
        });
    }

    return defer.promise;
};

/**
 * SHPS_sql_colspec
 * 
 * @param $table sql_table Object
 * @param $col string
 */
var sql_colspec = function f_sql_sql_colspec($table, $col) {
    if (typeof $table !== typeof sql_table || typeof $col !== 'string') {
        
        log.error('Wrong parameters: ' + typeof $table + ' / ' + typeof $col + '!');
        return;
    }
    
    
    /**
     * Columne as SQL string
     * 
     * @return string
     */
    var _toString =
    this.toString = function f_sql_sql_colspec_toString() {
        
        return $table.getSQL().standardizeName($table.getSQL().getDB()) +
                '.'.$table.getSQL().standardizeName($table.getFullName()) +
                '.'.$table.getSQL().standardizeName($col);
    }
    
    /**
     * Get table
     * 
     * @return SHPS_sql_table
     */
    var _getTable = 
    this.getTable = function f_sql_sql_colspec_getTable() {
        
        return $table;
    }
    
    /**
     * Get Columne name
     * 
     * @return string
     */
    var _getColName =
    this.getColName = function f_sql_sql_colspec_getColName() {
        
        return $col;
    }
    
    var _getSQL =
    this.getSQL = function f_sql_sql_colspec_getSQL() {
        
        return $table.getSQL();
    }
};


/**
 * Focus all DB actions on a given requestState
 * Basically this is a wrapper so web developers don't have to worry about which domain their scripts are served to
 *
 * @param requestState $requestState
 */
var _focus 
= me.focus = function c_sql_focus($requestState) {
    if (typeof $requestState !== 'undefined') {

        log.error('Cannot focus undefined requestState!');
    }

    /**
     * Get connection count
     * 
     * @return integer
     */
    var getConnectionCount = function f_sql_focus_getConnectionCount() {
        
        return _getConnectionCount($requestState);
    };
    
    /**
     * Create new managed SQL connection from alias (see config file)
     * 
     * @param string $alias //Default: 'default'
     * @return sql
     */
    this.newSQL = function f_sql_focus_newSQL($alias) {

        return _newSQL($alias, $requestState);
    };

    var _newTable =
    this.newTable = function ($name) {
        
        table.newTable(this, $name);
    };
};