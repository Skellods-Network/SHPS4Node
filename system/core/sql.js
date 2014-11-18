"use strict";

me = module.exports;

GLOBAL.SHPS_SQL_MYSQL = 0;
GLOBAL.SHPS_SQL_MSSQL = 10;


var mysql = require('mysql');
var pooling = require('generic-pool');

var main = require('./main.js');
var log = require('./log.js');


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
var SQL = function ($user,
                    $passwd,
                    $database,
                    $host,
                    $port,
                    $prefix,
                    $dbType,
                    $mcServers,
                    $requestState) {

    $host = (typeof $host !== 'undefined' ? $host : 'localhost');
    $port = (typeof $port !== 'undefined' ? $port : 3306);
    $prefix = (typeof $prefix !== 'undefined' ? $prefix : 'HP_');
    $dbType = (typeof $dbType !== 'undefined' ? $dbType : GLOBAL.SHPS_SQL_MYSQL);
    $mcServers = (typeof $mcServers !== 'undefined' ? $mcServers : []);
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
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
    var _dbType = $dbType;
    
    /**
     * Database host
     * 
     * @var string
     */
    var _host = $host;
    
    /**
     * Database server port
     * 
     * @var integer
     */
    var _port = $port;
    
    /**
     * Database name
     * 
     * @var string
     */
    var _db = $database;
    
    /**
     * Table prefix
     * 
     * @var string
     */
    var _prefix = $prefix;
    
    /**
     * Database user
     * 
     * @var string
     */
    var _user = $user;
    
    /**
     * Database password
     * 
     * @var string
     */
    var _passwd = $passwd;
    
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
    
    
}

/**
 * Create new managed SQL connection from alias (see config file)
 * 
 * @param string $alias //Default: 'default'
 * @return sql
 */
var _newSQL 
= me.newSQL = function ($alias, $requestState) {
    $alias = (typeof $alias !== 'undefined' ? $alias : 'default');
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    var dbConfig = $requestState.Database_Config[$alias];
    var poolName = dbConfig.DB_Host +
        dbConfig.DB_Port +
        dbConfig.DB_Name +
        dbConfig.DB_User +
        dbConfig.DB_Pre;

    var nPool = _sqlConnectionPool[poolName];
    if (nPool === 'undefined') {
        
        switch (dbConfig.DB_Type) {

            case "SHPS_SQL_MYSQL": {
                
                _sqlConnectionPool[poolName] = nPool = mysql.createPool({
                    
                    connectionLimit: dbConfig.DB_ConnectionLimit,
                    host: dbConfig.DB_Host,
                    port: dbConfig.DB_Port,
                    user: dbConfig.DB_User,
                    database: dbConfig.DB_Name,
                    charset: 'utf8mb4_general_ci',
                    timezone: $requestState.General_Config.timezone,
                    multipleStatements: true
                });
            }

            default: {

                log.error('Database type not supported!');
            }
        }
    }

    return new SQL($requestState, nPool.getConnection());
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