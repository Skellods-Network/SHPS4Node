'use strict';

var me = module.exports;

GLOBAL.SHPS_SQL_MYSQL = 2;
GLOBAL.SHPS_SQL_MSSQL = 16;

GLOBAL.SHPS_SQL_MARIA = SHPS_SQL_MYSQL | 4;
GLOBAL.SHPS_SQL_PERCONA = SHPS_SQL_MYSQL | 8;

GLOBAL.SHPS_ERROR_NO_ROWS = 'No rows were returned!';

var mysql = require('mysql');
var mssql = require('mssql');
var pooling = require('generic-pool');
var async = require('vasync');
var q = require('q');

var libs = require('node-mod-load').libs;

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
= me.newCol = libs.sqlCol.newCol;

var _newRow 
= me.newRow = libs.sqlRow.newRow;

var _newTable 
= me.newTable = libs.sqlTable.newTable;

var _newConditionBuilder 
= me.newConditionBuilder = libs.sqlConditionBuilder.newSQLConditionBuilder;

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
    
    return libs.helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
        
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
= mp.SQL = function ($dbconfig, $connection) {
    
    if (typeof $dbConfig === 'undefined') {
        
        throw ('Cannot work with undefined dbConfig!');
        return;
    }
    
    if (typeof $connection === 'undefined' || $connection === null) {
        
        throw ('Cannot work without connection!');
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
     * Array with results of last query
     * 
     * @var array of sqlRow
     */
    var _resultRows = [];
    
    /**
     * Array with field catalogue of last query
     * 
     * @var array of Object
     */
    var _resultFields = [];
    

    /**
     * Grouphuggable
     * Breaks after 3 hugs per partner
     * 
     * @param $hug
     *  Huggable caller
     */
    var _hug 
    = mp.hug = function f_sql_hug($h) {
        
        return libs.helper.genericHug($h, mp, function f_sql_hug_hug($hugCount) {
            
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
     * @param string $domain Needed for $param
     * @param mixed $param several parameters for SQL statement
     * @return mixed
     *   Promise([]) if a query was given, else a queryBuilder object is returned
     */
    var _query 
    = this.query = function ($query, $domain, $param) {
        
        _free = false;
        _fetchIndex = -1;
        
        
        if (typeof $param !== 'undefined') {
            
            $query = mysql.format($query, $param, true, libs.config.getHPConfig('generalConfig', 'timezone', $domain));
            mysql.createQuery($query, cb);
        }
        
        if (typeof $query !== 'undefined') {
            
            _lastQuery = $query;
            _queryCount++;
            var start = process.hrtime();
            
            var defer = q.defer();
            $connection.query($query, function ($err, $rows, $fields) {
                
                var t = process.hrtime(start);
                _lastQueryTime = t[0] + (t[1] / 1000000000);
                _queryTime += _lastQueryTime;
                
                if ($err) {
                    
                    defer.reject(new Error($err));
                }
                else {
                    
                    _resultRows = $rows;
                    _resultFields = $fields;
                    defer.resolve($rows, $fields);
                }
            });

            return defer.promise;
        }
        
        return libs.sqlQueryBuilder.newSQLQueryBuilder(this);
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
            
            $var = s + libs.SFFM.cleanStr($var) + e;
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
        
        $str = libs.SFFM.cleanStr($str);
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
        
        //TODO
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
        
        return libs.sqlTable.newTable(this, $name);
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
    };
    
    /**
     * Free the SQL connection so it can be reused
     */
    var _free =
    this.free = function f_sql_SQL_free() {
        
        switch ($dbConfig.type.value) {

            case SHPS_SQL_MSSQL: {

                _sqlConnectionPool[_makePoolName($dbConfig)].release($connection);
                break;
            }
            
            case SHPS_SQL_MARIA:
            case SHPS_SQL_MYSQL: {

                $connection.release();
            }
        }
        
        _free = true;
    };
    
    /**
     * Check if the current connection has already been freed.
     * Do never use freed connections, get a new one
     * 
     * @result boolean
     */
    var _isFree =
    this.isFree = function f_sql_isFree() {
        
        return _free;
    };
    
    var _getAlias =
    this.getAlias = function f_sql_getAlias() {
        
        return $alias;
    };
    
    var _getRequestState =
    this.getRequestState = function f_sql_getRequestState() {
        
        return $requestState;
    };
    
    /**
     * Get DB name
     * 
     * @result string
     */
    var _getDB 
    = mp.getDB =
    this.getDB = function f_sql_getDB() {
        
        return $dbConfig.name.value;
    };
    
    /**
     * Get prefix which is currently used for the tables
     * 
     * @result string
     */
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
            
            _query('SET NAMES \'UTF8\';').done();
            _dbType = SHPS_SQL_MYSQL;
            _query('SELECT VERSION();').done(function ($res) {
                
                if ($res[0]['VERSION()'].indexOf('MariaDB') > 0) {
                    
                    _dbType |= SHPS_SQL_MARIA;
                }
            });
            
            break;
        }

        default: {
            
            _dbType = $dbConfig.type.value;
        }
    }
    
    _free = true;
};


/**
 * Get connection count
 * 
 * @todo implement
 * @return integer
 */
var _getConnectionCount 
= me.getConnectionCount = function f_sql_getConnectionCount($requestState) {
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    return -1;
};

var _makePoolName = function f_sql_makePoolName($dbConfig) {

    return $dbConfig.host.value +
        $dbConfig.port.value +
        $dbConfig.name.value +
        $dbConfig.user.value +
        $dbConfig.prefix.value;
};

/**
 * Create new managed SQL connection from alias (see config file)
 * 
 * @param string $alias //Default: 'default'
 * @param $requestState requestState Object
 * @return promise(SQL)
 */
var _newSQL 
= me.newSQL = function f_sql_newSQL($alias, $requestState) {
    $alias = (typeof $alias !== 'undefined' ? $alias : 'default');
    
    var defer = q.defer();
    if (typeof $requestState === 'undefined') {
        
        var str = 'Cannot connect with undefined requestState!';
        defer.reject(str);

        return defer.promise;
    }

    
    if (!$requestState.config.databaseConfig[$alias]) {

        var str = 'Cannot connect with undefined alias `' + $alias + '`!';
        defer.reject(str);
        
        return defer.promise;
    }

    var config = $requestState.config;
    var dbConfig = config.databaseConfig[$alias];
    var poolName = _makePoolName(dbConfig);
    var log = libs.log.newLog($requestState);

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
                
                nPool.getConnection(function ($err, $con) {
                    
                    if (!$err) {

                        defer.resolve(new _SQL(dbConfig, $con));
                    }
                    else {

                        defer.reject(new Error($err));
                    }
                });

                break;
            }

            case SHPS_SQL_MSSQL: {
                
                _sqlConnectionPool[poolName] = nPool = pooling.Pool({
                        
                    name: poolName,
                    create: function f_sql_newSQL_create_MSSQL_pool($cb) {
                        
                        var con = new mssql.Connection({
                            
                            server: dbConfig.host.value,
                            port: dbConfig.port.value,
                            user: dbConfig.user.value,
                            password: dbConfig.pass.value,
                            database: dbConfig.name.value
                        });

                        con.connect(function ($err) {

                            $cb($err, con);
                        });
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

                        defer.reject(new Error($err));
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
        
        switch (dbConfig.type.value) {

            case SHPS_SQL_MYSQL:
            case SHPS_SQL_MARIA: {

                nPool.getConnection(function ($err, $con) {
                    
                    if ($err) {

                        defer.reject(new Error($err));
                    }
                    else {

                        defer.resolve(new _SQL(dbConfig, $con));
                    }
                });

                break;
            }

            case SHPS_SQL_MSSQL: {

                nPool.acquire(function ($err, $client) {
                    
                    if ($err) {
                        
                        defer.reject(new Error($err));
                    }
                    else {
                        
                        if (!$client.query) {

                            $client.query = function ($query, $cb) {

                                var req = new mssql.Request($client);
                                req.query($query, $cb);
                            };
                        }
                        
                        defer.resolve(new _SQL(dbConfig, $client));
                    }
                });

                break;
            }
        }
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
        
        throw('Wrong parameters: ' + typeof $table + ' / ' + typeof $col + '!');
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

        throw ('Cannot focus undefined requestState!');
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
    var _newSQL =
    this.newSQL = function f_sql_focus_newSQL($alias) {

        return me.newSQL($alias, $requestState);
    };
};
