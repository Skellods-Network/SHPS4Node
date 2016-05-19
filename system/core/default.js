'use strict';

var me = module.exports;


me.master = {
    "workers": {
        "description": "Spawns {%value} workers to handle work. Workers are working even closer together than clustered SHPSs. Makes use of multiple cores. Even with 0 workers there will always be a master process. Insert -1 for smart worker regulation",
        "value": -1
    }
}

me.config = {
    "generalConfig": {
        
        "URL"            : {
            
            "description": "Your domain",
            "value": "localhost"
        },
        "staticResourcesURL"    : {
            
            "description": "Your resource URL",
            "value": "localhost"
        },
        "dirUpload"        : {
            
            "description": "Directory for uploaded data",
            "value": "uploads"
        },
        "mail"            : {
            
            "description": "Mail used as `FROM` address",
            "value": "support@example.com"
        },
        "logCount"        : {
            
            "description": "Number of log entries stored in the DB",
            "value": 50
        },
        "templateTimeout": {

            "description": "Maximum amount of time in seconds a template (partial or content) can take before excution is stopped",
            "value": 60
        },
        "timezone"        : {
            
            "description": "Timezone of the server",
            "value": "Europe/Berlin"
        },
        "uploadQuota"        : {
            
            "description": "Maximum amount of data which can be uploaded from this website instance (0=infinite)",
            "value": 0
        },        
        "displayStats"          : {
            
            "description": "Display speed and resource stats in the homepage's source",
            "value": false
        },        
        "indexContent"          : {
            
            "description": "Content which will be used when nothing else is specified",
            "value": "index"
        },
        "rootTemplate"          : {
            
            "description": "Template which will contain the raw structure",
            "value": "site"
        },
        "useHTTP1"              : {
            "description": "Start HTTP/1.1 server",
            "value": true
        },
        "useHTTP2"              : {
            "description": "Start HTTP/2.0 server",
            "value": false
        },
        "HTTP1Port"              : {
            "description": "Port to serve HTTP/1.1 on",
            "value": 1280
        },
        "HTTP2Port"              : {
            "description": "Port to serve HTTP/2.0 on",
            "value": 12443
        }
    },
    "TLSConfig": {
        "key"                   : {
            "description": "",
            "value": "mysite.key"
        },
        "cert"                   : {
            "description": "",
            "value": "mysite.crt"
        },
        "ca"                   : {
            "description": "",
            "value": "ca-bundle.pem"
        },
        "keypin": {
            "description": "This will be used for HPKP (advanced security). If left blank, SHPS will generate the keypin",
            "value": ""
        }
    },
    "databaseConfig": {
        
        "default": {
            
            "host"           : {
                
                "description": "DB host",
                "value": "localhost"
            },
            "port"           : {
                
                "description": "DB port",
                "value": 3306
            },
            "name"           : {
                
                "description": "Name of schema",
                "value": ""
            },
            "user"           : {
                
                "description": "DB user",
                "value": ""
            },
            "pass"           : {
                
                "description": "User's password",
                "value": ""
            },
            "prefix"            : {
                
                "description": "Table prefix",
                "value": "HP_"
            },
            "type"           : {
                
                "description": "Type of DB",
                "value": 0,
                "options": {
                    "MySQL": 0,
                    "MSSQL": 10
                }
            },
            "connectionLimit": {
                
                "description": "Maximum number of simultaneous connections to the DB server",
                "value": 100
            }
        },
        "logging": {
            
            "host"           : {
                
                "description": "DB host",
                "value": "localhost"
            },
            "port"           : {
                
                "description": "DB port",
                "value": 3306
            },
            "name"           : {
                
                "description": "Name of schema",
                "value": ""
            },
            "user"           : {
                
                "description": "DB user",
                "value": ""
            },
            "pass"           : {
                
                "description": "User's password",
                "value": ""
            },
            "prefix"            : {
                
                "description": "Table prefix",
                "value": "HP_"
            },
            "type"           : {
                
                "description": "Type of DB",
                "value": 0,
                "options": {
                    "MySQL": 0,
                    "MSSQL": 10
                }
            },
            "connectionLimit": {
                
                "description": "Maximum number of simultaneous connections to the DB server",
                "value": 100
            }
        },
        "usermanagement": {
            
            "host"            : {
                
                "description": "DB host",
                "value": "localhost"
            },
            "port"           : {
                
                "description": "DB port",
                "value": 3306
            },
            "name"           : {
                
                "description": "Name of schema",
                "value": ""
            },
            "user"           : {
                
                "description": "DB user",
                "value": ""
            },
            "pass"           : {
                
                "description": "User's password",
                "value": ""
            },
            "prefix"            : {
                
                "description": "Table prefix",
                "value": "HP_"
            },
            "type"           : {
                
                "description": "Type of DB",
                "value": 0,
                "options": {
                    "MySQL": 0,
                    "MSSQL": 10
                }
            },
            "connectionLimit": {
                
                "description": "Maximum number of simultaneous connections to the DB server",
                "value": 100
            }
        }
    },
    "securityConfig": {
        
        "sessionTimeout": {
            
            "description": "Seconds after which a session is destroyed",
            "value": 1800
        },
        "autoLoginTimeout": {
            
            "description": "Seconds after which an auto login token is invalid",
            "value": 2592000
        },
        "loginDelay": {
            
            "description": "Login result delivery delay to add to the next try when a user login fails in seconds",
            "value": 1
        },
        "maxLoginDelay": {
            
            "description": "Maximum delay for the login result delivery delay",
            "value": 3600
        },
        "STSTimeout": {
            
            "description": "Maximum age for the HTTPS strict-transport-security. Will only be available for HTTPS",
            "value": 60000
        },
        "STSIncludeSubDomains": {
            
            "description": "Set HTTPS strict-transport-security for subdomains, too (recommended)",
            "value": true
        }
    }
};

me.fileTree = {
    '.isDir': true,
    '.canHazFiles': true,
    '.canHazFolders': true,
    cache: {
        '.isDir': true
    },
    cert: {
        '.isDir': true,
        '.canHazFiles': true
    },
    config: {
        '.isDir': true,
        '.canHazFiles': true
    },
    logs: {
        '.isDir': true,
        '.canHazFiles': true
    },
    node_modules: {
        '.isDir': true,
        '.canHazFiles': true,
        '.canHazFolders': true
    },
    system: {
        '.isDir': true,
        '.canHazFolders': true,
        core: {
            '.isDir': true,
            _files: [
                'commandline.js',
                'componentLibrary.js',
                'default.js',
                'helper.js',
                'io.js',
                'log.js',
                'main.js',
                'optimize.js',
                'plugin.js',
                'request.js',
                'schedule.js',
                'SFFM.js',
                'sql.js',
                'sqlCol.js',
                'sqlConditionBuilder.js',
                'sqlQueryBuilder.js',
                'sqlRow.js',
                'sqlTable.js'
            ]
        },
        plugins: {
            '.isDir': true,
            '.canHazFiles': true,
            '.canHazFolders': true
        },
        static: {
            '.isDir': true,
            '.canHazFiles': true
        }
    },
    _files: [
        'LICENCE.md',
        'package.json',
        'README.md',
        'SHPS.js'
    ]
};
