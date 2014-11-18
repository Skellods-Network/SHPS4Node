"use strict";

var me = module.exports;

GLOBAL.SHPS_SQL_MYSQL = 0;
GLOBAL.SHPS_SQL_MSSQL = 10;


var mysql = require('mysql');
var pooling = require('generic-pool');
var async = require('async');
var Promise = require('promise');

var main = require('./main.js');
var log = require('./log.js');
var helper = require('./helper.js');
var sffm = require('./SFFM.js');


var _sqlConnectionPool = {};



/**
 * SQL string determinators
 * 
 * @var array
 */
var _stringdeterminator = {

    SHPS_SQL_MYSQL: '\'',
    SHPS_SQL_MSSQL: '\'',
};

/**
 * SQL variable determinators
 * 
 * @var array
 */
var _variabledeterminator = {

    SHPS_SQL_MYSQL: ['`','`'],
    SHPS_SQL_MSSQL: ['[',']'],
};

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

/**
 * SQL Query Builder
 */
var sql_queryBuilder = function ($sql) {
    
    /**
     * Contains type of operation
     * 0 = UNDEFINED
     * 1 = GET
     * 2 = INSERT
     * 3 = ALTER
     * 4 = DELETE
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
     * @var \SHPS\sql_table
     */
    var table = null;
    
    /**
     * Column to order by
     * 
     * @var \SHPS\sql_col
     */
    var orderBy = null;
    
    /**
     * Order by ascending?
     * 
     * @var boolean
     */
    var obAscending = true;
    
    /**
     * Limit number of result rows
     * 
     * @var integer
     */
    var limit = 0;
    

    /**
     * Reset Query Builder
     */
    var _reset = function () {
        
        operation = 0;
        buf = [];
    }

    /**
     * Fetch from the DB
     * 
     * @param \SHPS\sql_col
     * @param ... several colspecs can be given, each as new parameter or as [](s)
     * @return \SHPS\sql_queryBuilder
     */
    var _get 
    = this.get = function () {

        _reset();
        operation = 1;
        arguments.foreach(function ($arg) {

            if (sffm.isArray($arg)) {
                
                $arg.foreach(function ($a) {
                    
                    buf[buf.length] = $a;
                });
            }
            else {

                buf[buf.length] = $arg;
            }
        });

        return this;
    }
    
    /**
     * Add conditions to query
     * 
     * @return sql_conditionBuilder
     */
    var _fulfilling
    = this.fulfilling = function () {

        if (operation === 0) {

            throw 'No operation selected!';
        }

        return new sql_conditionBuilder(this);
    }

    var _execute
    = this.execute = function () {

        if (arguments.length > 0) {
            
            var conditions = arguments[0];
        }
        else {
            
            var conditions = null;
        }

        switch (operation) {

            case 1:// SELECT
                
                var query = 'SELECT ';
                var st = $sql.getServerType();
                if (st == 'MSSQL' && limit > 0) {
                    
                    query += 'TOP ' + limit + ' ';
                }
                
                var colCount = buf.length;
                var tables = [];
                var i = 0;
                buf.forEach(function ($buf) {
                    
                    i++;
                    query += $buf.toString();
                    var tmp = $buf.getTable();
                    if (tables.indexOf(tmp) == -1) {
                        
                        tables[tables.length] = tmp;
                    }
                    
                    if (colCount == i) {
                        
                        query += ' ';
                    }
                    else {
                        
                        query += ',';
                    }
                });
                
                if (conditions !== null) {
                    
                    query += 'WHERE ' + conditions.toString();
                }
                
                if (orderBy !== null) {
                    
                    query += 'ORDER BY ' + orderBy.toString() + ' ' + obAscending ? 'ASC ' : 'DESC ';
                }
                
                if ((st == 'MySQL' || st == 'MariaDB') && limit > 0) {
                    
                    query += 'LIMIT ' + limit + ' ';
                }
                
                query += ';';
                $sql.query(query);

                break;


            default:
                
                throw 'UNKNOWN OPERATION';
        }
    }
}

/**
 * SQL Class<br>
 * For SQLite, a new file will be created if the database file is missing
 * 
 * @param \requestState $requestState
 * @param mixed $connection Pooled connection to DB server
 * @param string $alias
 */
var SQL = function ($requestState, $connection, $alias) {

    if (typeof $requestState == 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    if (typeof $connection == 'undefined') {
        
        log.error('No connection available!');
    }
    
    var dbConfig = eval('$requestState.config.databaseConfig.' + $alias);
    
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
    var _dbType = dbConfig.type.value;
    
    /**
     * Database name
     * 
     * @var string
     */
    var _db = dbConfig.name.value;
    
    /**
     * Table prefix
     * 
     * @var string
     */
    var _prefix = dbConfig.pre.value;
    
    /**
     * Database user
     * 
     * @var string
     */
    var _user = dbConfig.user.value;
    
    /**
     * Database password
     * 
     * @var string
     */
    var _passwd = dbConfig.pass.value;
    
    /**
     * Connection
     * 
     * @var Connection
     */
    var _connection = $connection;
    
    /**
     * Connection status
     * 
     * @var boolean
     */
    var _free = true;
    
    /**
     * Containes the last executed query
     * 
     * @var string
     */
    var _lastQuery = '';
    
    /**
     * Result rows
     * 
     * @var Rows
     */
    var _resultRows = [];
    
    /**
     * Index of next row to fetch
     * 
     * @var type 
     */
    var _fetchIndex = 0;
    
    /**
     * Just run the given query<br>
     * It is not recommended to use custom queries!
     * 
     * @param string $query
     * @param []|null $param
     */
    var query
    = this.query = function ($query, $param) {
        
        _free = false;
        _fetchIndex = -1;
        _resultRows = [];

        if (typeof $param !== null) {

            $query = mysql.format($query, $param, true, main.getHPConfig('generalConfig', 'timezone', $requestState.uri));
        }
        
        if (typeof $query !== null) {
            
            _lastQuery = $query;
            _queryCount++;
            var start = process.hrtime();
            
            return new Promise(function ($fulfill, $reject) {
                _connection.query($query, function ($err, $rows, $fields) {
                    
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

        return new sql_queryBuilder(this);
    }
    
    /**
     * Returns all result rows of previous query
     * 
     * @return []
     */
    var _fetchResult
    = this.fetchResult = function () {
        
        return _resultRows;
    }
    
    /**
     * Returns next result row of previous query
     * 
     * @return []
     */
    var _fetchRow
    = this.fetchRow = function () {
        
        _fetchIndex++;
        return _resultRows[_fetchIndex];
    }
    
    /**
     * CONSTRUCTOR
     */
    switch (_dbType) {

        case 'SHPS_SQL_MYSQL': {

            this.query('SET NAMES \'UTF8\';');
            break;
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
= me.getConnectionCount = function ($requestState) {

    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    return _alias_connections.length();
}

/**
 * Create new managed SQL connection from alias (see config file)
 * 
 * @param string $alias //Default: 'default'
 * @return sql
 */
var _newSQL 
= me.newSQL = function ($alias, $requestState) {
    $alias = (typeof $alias !== null ? $alias : 'default');
    if (typeof $requestState === null) {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    var dbConfig = eval('$requestState.config.databaseConfig.' + $alias);
    var poolName = dbConfig.host.value +
        dbConfig.port.value +
        dbConfig.name.value +
        dbConfig.user.value +
        dbConfig.pre.value;

    var nPool = _sqlConnectionPool[poolName];
    if (nPool == null) {
        
        switch (dbConfig.type.value) {

            case "SHPS_SQL_MYSQL": {
                
                _sqlConnectionPool[poolName] = nPool = mysql.createPool({
                    
                    connectionLimit: dbConfig.connectionLimit.value,
                    host: dbConfig.host.value,
                    port: dbConfig.port.value,
                    user: dbConfig.user.value,
                    database: dbConfig.name.value,
                    charset: 'utf8mb4_general_ci',
                    timezone: main.getHPConfig('generalConfig', 'timezone'),
                    multipleStatements: true
                });

                break;
            }

            default: {

                log.error('Database type not supported!');
            }
        }
    }

    var connection = new Promise(function ($resolve, $reject) {
        

        nPool.getConnection(function ($err, $connection) {
            
            if ($err) {
                
                $reject($err.Message);
            }
            else {

                $resolve(new SQL($requestState, $connection, $alias));
            }
        });
    });
    
    return connection;
};

/**
 * Focus all DB actions on a given requestState
 * Basically this is a wrapper so web developers don't have to worry about which domain their scripts are served to
 *
 * @param requestState $requestState
 */
var _focus 
= me.focus = function ($requestState) {
    if (typeof $requestState !== 'undefined') {

        log.error('Cannot focus undefined requestState!');
    }

    var self = this;
    
    /**
     * Get connection count
     * 
     * @return integer
     */
    var getConnectionCount = function () {
        
        return _getConnectionCount($requestState);
    };
    
    /**
     * Create new managed SQL connection from alias (see config file)
     * 
     * @param string $alias //Default: 'default'
     * @return sql
     */
    var newSQL = function ($alias) {

        return _newSQL($alias, $requestState);
    };
};