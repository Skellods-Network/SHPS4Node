'use strict';

var me = module.exports;

GLOBAL.SHPS_SQL_MYSQL = 0;
GLOBAL.SHPS_SQL_MSSQL = 10;

var mysql = require('mysql');
var pooling = require('generic-pool');
var async = require('vasync');
var Promise = require('promise');

var main = require('./main.js');
var log = require('./log.js');
var helper = require('./helper.js');
var sffm = require('./SFFM.js');

var _sqlConnectionPool = {};
var self = this;


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
 * @param string $user
 * @param string $passwd
 * @param string $database
 * @param string $host
 * @param string $prefix
 * @param array $mcServers [[(Sting)'Host',(Integer)['Port']],[...]]
 */
var SQL = function ($dbConfig, $connection) {

    if (typeof $dbConfig === 'undefined') {
        
        log.error('Cannot work with undefined dbConfig!');
    }
    
    if (typeof $connection === 'undefined') {
        
        log.error('Cannot work without connection!');
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
    var _dbType = eval('return ' + $dbConfig.type.value + ';');
    
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

        return new _sql_queryBuilder(this);
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
            && $str.substring(r, -1) != s) {

            $str = s + $str + $s;
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
        
        return 'MySQL';
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
= me.getConnectionCount = function f_sql_getConnectionCount($requestState) {
    if (typeof $requestState !== 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    
}

/**
 * Create new managed SQL connection from alias (see config file)
 * 
 * @param string $alias //Default: 'default'
 * @param $requestState requestState Object
 * @return sql
 */
var _newSQL 
= me.newSQL = function f_sql_newSQL($alias, $requestState) {
    $alias = (typeof $alias !== 'undefined' ? $alias : 'default');
    if (typeof $requestState === 'undefined') {
        
        log.error('Cannot connect with undefined requestState!');
    }
    
    var config = $requestState.config;
    var dbConfig = config.databaseConfig[$alias];
    var poolName = dbConfig.host.value +
        dbConfig.port.value +
        dbConfig.name.value +
        dbConfig.user.value +
        dbConfig.prefix.value;

    var nPool = _sqlConnectionPool[poolName];
    if (typeof nPool === 'undefined') {
        
        switch (dbConfig.type.value) {

            case "SHPS_SQL_MYSQL": {
                
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

                break;
            }

            default: {

                log.error('Database type not supported!');
            }
        }
    }

    return new SQL($requestState, nPool.getConnection());
};

var _sql_queryBuilder = function f_sql_sql_queryBuilder($sql) {
    if (typeof $sql !== typeof SQL) {

        log.error('The queryBuilder needs a valid sql object!');
        return;
    }


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
    var $operation = 0;
    
    /**
     * Data to work with
     * GET: cols to get
     * SET: col=>value to set
     * 
     * @var [] of sql_col
     */
    var $buf = [];
    
    /**
     * Table to use for set or delete operations
     * 
     * @var \SHPS\sql_table
     */
    var $table = null;


}

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
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_sql_hug($h) {
    
    return helper.genericHug($h, self, function f_sql_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
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
};