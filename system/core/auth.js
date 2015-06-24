'use strict';

var me = module.exports;

GLOBAL.SHPS_COOKIE_AUTOLOGINTOKEN = 'SHPSALT';

var dep = require('./dependency.js');
var q = require('q');
var oa = require('object-assign');
var async = require('vasync');
var u = require('util');
var crypt = require('crypto');

var helper = require('./helper.js');
var session = require('./session.js');
var SFFM = require('./SFFM.js');
var sql = require('./sql.js');
var log = require('./log.js');

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
= me.hug = function f_auth_hug($h) {
    
    return helper.genericHug($h, mp, function f_main_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var Auth
= me.focus = function c_Auth($requestState) {
    
    var _session;
    var self = this;

    this.getSession = function f_auth_getSession() {

        return _session;
    }
    
    var _updatePassword = function f_auth_updatePassword($uid, $passwd) {

        sql.newSQL('usermanagement', $requestState).done(function f_auth_updatePassword_newSQL($sql) {
            
            var tbl = $sql.openTable('user');
            $sql.query()
                .get(tbl.col('salt'))
                .fulfilling()
                .equal(tbl.col('ID'), $uid)
                .execute()
                .done(function f_auth_updatePassword_newSQL_query($rows) {
                    
                if ($rows.length == 0) {
                
                    log.error('Could not find user with ID ' + $uid + '!');
                    return;
                }

                tbl.update({

                    password: _makeSecurePassword($passwd, $rows[0].salt)
                }, sql.newConditionBuilder(null)
                    .eq(tbl.col('ID'), $uid)
                ).done($sql.free, $sql.free);
            }, $sql.free);
        });
    }
    
    /**
     * Generates a secure password hash from a password
     * 
     * @param string $passwd
     * @result string Hash
     */
    var _makeSecurePassword = function f_auth_makeSecurePassword($passwd) {
        
        var crypt;
        if (!(crypt = dep.getSCrypt())) {
            
            crypt = dep.getBCrypt();
        }
        
        var defer = q.defer();
        crypt.genSalt($requestState.config.securityConfig.saltRounds.value, function ($err, $salt) {
            
            if ($err) {

                defer.reject(new Error($err));
            }
            else {

                crypt.hash($passwd, $salt, function ($err, $hash) {
                    
                    if ($err) {

                        defer.reject(new Error($err));
                    }
                    else {
                    
                        defer.resolve($hash);
                    }
                });
            }
        });

        return defer.promise;
    };
    
    /**
     * Check if supplied password is correct. Either the database is used or a valid password/salt pair can be used
     * 
     * @param $uid integer|string
     *   User ID or name
     * @param $passwd string
     * @param $validPasswd string
     *   Optional valid password
     * @param $validSalt string
     * @result promise(err, boolean)
     */
    var _checkPassword =
    this.checkPassword = function f_auth_checkPassword($uid, $passwd, $validPasswd) {
        
        $uid = _getIDFromUser($uid);
        var defer = q.defer();
        
        if (!$validPasswd) {
            
            sql.newSQL('usermanagement', $requestState).done(function f_auth_updatePassword_newSQL($sql) {
                
                var tbl = $sql.openTable('user');
                $sql.query()
                .get(
                    tbl.col('password')
                )
                .fulfilling()
                .equal(tbl.col('ID'), $uid)
                .execute()
                .done(function ($rows) {
                    
                    if ($rows.length == 0) {
                        
                        log.error('Could not find user with ID ' + $uid + '!');
                        return;
                    }
                    
                    defer.resolve($rows.password);
                    $sql.free();
                }, function ($err) {
                    
                    $sql.free();
                    defer.reject($err);
                });
            }, defer.reject);
        }
        else {

            defer.resolve($validPasswd);
        }
        
        var defer2 = q.defer();
        defer.promise.done(function ($pw) {
            
            if (!(crypt = dep.getSCrypt())) {
                
                crypt = dep.getBCrypt();
            }
            
            crypt.compare($passwd, $pw, function ($err, $res) {
                
                if (!$err) {

                    //_updatePassword($uid, $passwd); <-- Only needed with multiple pw crypting/hashing algos
                    defer2.resolve($res);
                }
                else {

                    defer2.reject(new Error($err));
                }
            });
        }, defer2.reject);

        return defer2.promise;
    };
    
    /**
     * Grant an access key to a user or a group
     * 
     * @param $uid integer|string
     *   User or group ID or name
     * @param $key string
     * @from integer
     *   UNIX timestamp
     * @to integer
     *   UNIX timestamp
     * @isGroup boolean
     *   is the supplied ID a group ID? // Default: false
     */
    var _grantAccessKey =
    this.grantAccessKey = function f_auth_grantAccessKey($uid, $key, $from, $to, $isGroup) {
        $isGroup = $isGroup || false;
        
        var authorizer = 0;
        if (_isClientLoggedIn()) {
            
            authorizer = _session.data['ID'];
        }
        
        sql.newSQL('usermanagement', $requestState).done(function ($sql) {

            var d = q.defer();
            if ($isGroup) {
                
                $sql.openTable('groupSecurity')
                    .insert({
                    
                    gid: _getIDFromGroup($user),
                    key: _getIDFromAccessKey($key),
                    from: $from,
                    to: $to,
                    authorizer: authorizer
                }).done($sql.free, $sql.free);
            }
            else {
                
                $sql.openTable('userSecurity')
                    .insert({
                    
                    gid: _getIDFromUser($user),
                    key: _getIDFromAccessKey($key),
                    from: $from,
                    to: $to,
                    authorizer: authorizer
                }).done($sql.free, $sql.free);
            }
        });
    };
    
    var _getFieldFromTable = function f_auth_getFieldFromTable($table, $field, $refCol, $refColValue) {
        
        var defer = q.defer();
        sql.newSQL('usermanagement', $requestState).done(function ($sql) {

            var tbl = $sql.openTable($table);
            $sql.query()
                .get(tbl.col($field))
                .fulfilling()
                .equal(tbl.col($refCol), $refColValue)
                .execute()
                .done(function ($rows) {
                
                if ($rows.length <= 0) {

                    defer.reject(SHPS_ERROR_NO_ROWS);
                }
                else {

                    defer.resolve($rows[0].ID);
                }

                $sql.free();
            }, function ($err) {
                
                defer.reject(new Error($err));
                $sql.free();
            });
        }, defer.reject);

        return defer.promise;
    };
    
    var _getIDFromTabel = function f_auth_getIDFromTable($table, $refCol, $refColValue) {

        if (typeof $refColValue == 'number' && $refColValue % 1 == 0) {
            
            return $refColValue;
        }

        return _getFieldFromTable($table, 'ID', $refCol, $refColValue);
    };
    
    var _getAccessKeyFromID =
    this.getAccessKeyFromID = function f_auth_getAccessKeyFromID($id) {
        
        return _getFieldFromTable('accessKey', 'name', 'ID', $id);
    };

    var _getIDFromAccessKey =
    this.getIDFromAccessKey = function f_auth_getIDFromAccessKey($name) {
        
        return _getIDFromTable('accessKey', 'name', $name);
    };
    
    var _getIDFromUser =
    this.getIDFromUser = function f_auth_getIDFromUser($name) {
        
        return _getIDFromTable('user', 'user', $name);
    };
    
    var _getIDFromGroup =
    this.getIDFromGroup = function f_auth_getIDFromGroup($name) {
        
        return _getIDFromTable('group', 'name', $name);
    };
    
    var _getUserFromID =
    this.getUserFromID = function f_auth_getUserFromID($id) {
        
        if (typeof $refColValue == 'string') {
            
            return $refColValue;
        }
        else if (typeof $refColValue == 'number' && $refColValue % 1 == 0) {
            
            return _getFieldFromTable('user', 'user', 'ID', $id);
        }
        
        return;
    };
    
    /**
     * Revoke access key from user or group
     * 
     * @param $user integer|string
     *   User or group ID/name
     * @param key integer|string
     *   Access key ID or name
     * @param isGroup boolean
     *   Is the supplied $user a group? // Default: false
     */
    var _revokeAccessKey =
    this.revokeAccessKey = function f_auth_revokeAccessKey($user, $key, $isGroup) {
        $isGroup = $isGroup || false;
        
        _getIDFromAccessKey($key).done(function ($key) {
            
            sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                if ($err) {
                    
                    return;
                }

                if ($isGroup) {
                    
                    $user = _getIDFromGroup($user);
                    var tblGS = $sql.openTable('groupSecurity');
                    var tblG = $sql.openTable('group');
                    tblGS.delete(sql.newConditionBuilder(null)
                        .eq(tblGS.col('gid'), $user)
                        .eq(tblGS.col('key'), $key)
                    ).done($sql.free, $sql.free);
                }
                else {
                    
                    $user = _getIDFromUser($user);
                    var tblGS = $sql.openTable('userSecurity');
                    var tblG = $sql.openTable('user');
                    tblGS.delete(sql.newConditionBuilder(null)
                        .eq(tblGS.col('uid'), $user)
                        .eq(tblGS.col('key'), $key)
                    ).done($sql.free, $sql.free);
                }
            });
        });
    };

    /**
     * Check if a user has an access key
     * 
     * @param $key integer|string
     *   Access key ID or name
     * @param $user integer|string
     *   User ID or name. OPTIONAL. If unset, currently logged in user is used
     * @return
     *   promise({ [boolean]hasAccessKey, [string]message, [string]key, [integer]httpStatus })
     */
    var _hasAccessKeyExt =
    this.hasAccessKeyExt = function f_auth_hasAccessKeyExt($key, $user) {
        
        return _hasAccessKey($key, $user).then(function ($ak) {
            
            var defer = q.defer();
            
            var r = {
                
                hasAccessKey: $ak,
                message: 'ERROR: Unknown Problem in `f_auth_hasAccessKeyExt`',
                key: '',
                httpStatus: 500,
            };
                        
            if (r.hasAccessKey) {
                
                r.message = 'OK';
                r.httpStatus = 200;
                defer.resolve(r);
            }
            else {
                
                if (_isClientLoggedIn()) {
                    
                    r.httpStatus = 403; // FORBIDDEN
                }
                else {
                    
                    r.httpStatus = 401; // UNAUTHORIZED
                }
                
                _getAccessKeyFromID($key).done(function ($key) {

                    r.key = $key;
                    r.message = 'ERROR: Missing Authorization Key: ' + r.key;
                    defer.resolve(r);
                }, defer.reject);
            }

            return defer.promise;
        }, function ($err) {
            
            var defer = q.defer();
            defer.reject(new Error($err));

            return defer.promise;
        });
    };
    
    /**
     * Checks if current client is logged in
     * 
     * @result
     *   { [boolean]isLoggedIn, [string]message, [integer]httpStatus }
     */
    var _isClientLoggedInExt =
    this.isClientLoggedInExt = function f_auth_isClientLoggedInExt() {
        
        var r = {
            
            isLoggedIn: _isClientLoggedIn(),
            message: 'ERROR: Unknown Problem in `f_auth_isClientLoggedInExt`',
            httpStatus: 500,
        };

        if (r.isLoggedIn) {

            r.message = 'OK';
            r.httpStatus = 200;
        }
        else {

            r.message = 'ERROR: Please log in!';
            r.httpStatus = 401;
        }

        return r;
    };

    /**
     * Check if a user has an access key
     * 
     * @param $key integer|string
     *   Access key ID or name
     * @param $user integer|string
     *   User ID or name. OPTIONAL. If unset, currently logged in user is used
     * @return
     *   promise(boolean)
     */
    var _hasAccessKey =
    this.hasAccessKey = function f_auth_hasAccessKey($key, $user) {
        
        var defer = q.defer();
        if ($key == 0 || $key === 'SYS_NULL') {
            
            defer.resolve(true);
            return defer.promise;
        }
        
        var uPromise = q.promise();
        if (typeof $user === 'undefined') {
            
            if (!_isClientLoggedIn()) {
                
                defer.resolve(false);
                return defer.promise;
            }

            uPromise.resolve(_session.data['ID']);
        }
        else {
            
            _getIDFromUser($user).done(function ($user) {
            
                uPromise.resolve($user);
            }, uPromise.reject);
        }
        
        uPromise.done(function ($user) {

            sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                async.parallel({
                    
                    funcs: [
                        function ($_p1, $_p2) {
                            
                            var tblUS = $sql.openTable('userSecurity');
                            $sql.query()
                                .get(tblUS.col('uid'))
                                .fulfilling()
                                .eq(tblUS.col('uid'), $user)
                                .between(time(), tblUS.col('from'), tblUS.col('to'))
                                .execute()
                                .done(function ($rows) {
                                
                                $sql.free();
                                $_p1(null, $rows.length > 0);
                            }, $_p1);
                        },

                        function ($_p1, $_p2) {
                            
                            var tblGS = $sql.openTable('groupSecurity');
                            var tblGU = $sql.openTable('groupUser');
                            $sql.query()
                                .get(tblGS.col('gid'))
                                .fulfilling()
                                .eq(tblGU.col('gid'), tblGS.col('gid'))
                                .eq(tblGU.col('uid'), $user)
                                .between(time(), tblGS.col('from'), tblGS.col('to'))
                                .execute()
                                .done(function ($rows) {
                                
                                $sql.free();
                                $_p1(null, $rows.length > 0);
                            }, $_p1);
                        }
                    ]
                }, function ($results) {
                    
                    var i = 0;
                    var l = $results.length;
                    while (i < l) {
                        
                        if ($results[i]) {
                            
                            defer.resolve(true);
                            return;
                        }
                        
                        i++;
                    }
                    
                    defer.resolve(false);
                }, defer.reject);
            }, defer.reject);
        }, defer.reject);
        
        return defer.promise;
    };
    
    /**
     * Delays bruteforcing vertically
     * 
     * @param $uid integer
     * @return
     *   promise(err)
     */
    var _delayBruteforce = function f_auth_delayBruteforce($uid) {
        
        var defer = q.defer();
        if (typeof $uid === 'undefined') {

            defer.resolve('No UID provided!');
            return defer.promise;
        }

        sql.newSQL('usermanagement', $requestState).done(function ($sql) {
            
            if ($err) {
                
                defer.resolve($err);
                return;
            }

            var tblLQ = $sql.openTable('loginQuery');
            $sql.query()
                .get(tblLQ.col('time'))
                .fulfilling()
                .eq(tblLQ.col('uid'), $uid)
                .execute()
                .done(function ($rows) {
                

                var now = (Date.now() / 1000) | 0;
                if ($rows.length <= 0) {

                    tblLQ.insert({
                    
                        uid: $uid,
                        time: now + $requestState.config.securityConfig.loginDelay.value
                        })
                        .done($sql.free, $sql.free);

                    defer.resolve();
                }
                else {
                    
                    var det = $rows[0].time;
                    if (det <= now) {

                        det = now;
                    }

                    tblLQ.update({
                        
                        time: det + $requestState.config.securityConfig.loginDelay.value
                    })
                        .eq(tblLQ.col('uid'), $uid)
                        .execute()
                        .done($sql.free, $sql.free);

                    setTimeout(function () {

                        defer.resolve();
                    }, (det - now) * 1000);
                }
            }, function ($err) {
                
                $sql.free();
                defer.reject(new Error($err));
            });
        }, defer.reject);

        return defer.promise;
    };
    
    /**
     * Checks if user is logged in from DB record
     * If user is logged in, the last SID is returned
     * Else false is returned
     * 
     * @param $dbRec Object
     * @result false|string
     */
    var _isLoggedInFromDBRecord = function ($dbRec) {

        $dbRec = $dbRec || {};
        $dbRec.isLoggedIn = $dbRec.isLoggedIn || false;
        $dbRec.lastActivity = $dbRec.lastActivity || 0;
        $dbRec.lastSID = $dbRec.lastSID || 'noSID';
        
        // ASVS V2 3.3
        if ($dbRec.isLoggedIn && ((Date.now() / 1000) - $dbRec.lastActivity <= $requestState.config.securityConfig.sessionTimeout.value)) {

            return $dbRec.lastSID != 'noSID' ? $dbRec.lastSID : false;
        }

        return false;
    };
    
    /**
     * Login a user with a password
     * Autologin is supported for HTTPS only
     * 
     * @TODO Certificate-Based login
     * @param $user integer|string
     *   User ID or name
     * @param $pw string
     * @param $autoLogin boolean
     *   // Default: false
     * @result boolean
     */
    var _login =
    this.login = function f_auth_login($user, $pw, $autoLogin) {
        $autoLogin = $autoLogin || false;
        
        var defer = q.defer();
        async.waterfall([
        
            function ($cb) {
                _getIDFromUser($user).done(function ($id) {
        
                    $cb(null, $id);
                }, $cb);
            },
            function ($cb, $u) {
                
                $user = $u;
                
                /* ASVS V2 2.20 VERTICAL PROTECTION */
                _delayBruteforce($user).done(function () {
                        
                    $cb();
                }, $cb);
            },
            function ($cb) {
                
                /* ASVS V2 2.20 HORIZONTAL PROTECTION */
                _delayBruteforce($pw).done(function () {
                
                    $cb();
                }, $cb);
            },
            function ($cb) {

                sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                    $cb(null, $sql);
                }, $cb);
            },
            function ($cb, $sql) {
                
                var alt = '';
                if ($autoLogin && SFFM.isHTTPS($requestState.request)) {
                    
                    alt = $requestState.COOKIE.getCookie(SHPS_COOKIE_AUTOLOGINTOKEN) || '0';
                }
                
                var tblU = $sql.openTable('user');
                $sql.query()
                    .get(tblU.col('*'))
                    .fulfilling()
                    .or(function ($sqb) {
                    
                        return $sqb.eq(tblU.col('ID'), $user);
                    }, function ($sqb) {
                    
                        return $sqb.eq(tblU.col('autoLoginToken'), alt);
                    })
                    .execute()
                    .done(function ($rows) {
                    
                    if ($rows.length <= 0) {
                        
                        $cb(new Error(SHPS_ERROR_NO_ROWS, false));
                    }
                    else {
                        
                        var ur = $rows[0];
                        if ($rows.length > 1) {
                            
                            var i = 0;
                            var l = $rows.length;
                            while (i < l) {
                                
                                if ($rows[i].autoLoginToken === alt) {
                                    
                                    ur = $rows[i];
                                    break;
                                }
                                
                                i++;
                            }
                        }
                        
                        // ASVS V2 3.16
                        var lastSID = _isLoggedInFromDBRecord(ur);
                        if (lastSID !== false && lastSID !== _session.toString()) {
                            
                            _session.closeSession(lastSID);
                        }
                        
                        if (alt === ur.autoLoginToken/* && check IP range */) {
                            
                            var newToken = _session.genNewSID();
                            $requestState.COOKIE.setCookie(SHPS_COOKIE_AUTOLOGINTOKEN, newToken, $requestState.config.securityConfig.autoLoginTimeout.value, true);
                            $sql.query()
                                .set({
                                
                                    autoLoginToken: newToken,
                                    lastIP: SFFM.getIP($requestState),
                                    lastActive: Date.now() / 1000
                                })
                                .fulfilling()
                                .eq(tblU.col('ID'), ur.ID)
                                .execute()
                                .done($sql.free, $sql.free);
                            
                            $cb(null, true);
                            
                            return;
                        }
                        
                        _checkPassword($user, $pw, ur.password, ur.salt).done(function ($cpR) {
                            
                            if (cpR) {
                                
                                $requestState.SESSION = oa($requestState.SESSION, ur);
                                
                                var newToken = _session.genNewSID();
                                $requestState.COOKIE.setCookie(SHPS_COOKIE_AUTOLOGINTOKEN, newToken, $requestState.config.securityConfig.autoLoginTimeout.value, true);
                                $sql.query()
                                    .set({
                                    
                                        autoLoginToken: newToken,
                                        lastIP: SFFM.getIP($requestState),
                                        lastActive: Date.now() / 1000
                                    })
                                    .fulfilling()
                                    .eq(tblU.col('ID'), ur.ID)
                                    .execute()
                                    .done($sql.free,$sql.free());
                            }
                            
                            $cb(null, $cpR);             
                        }, $cb);
                    }
                }, $cb);
            },
        ], function ($err) {
            
            if ($err) {

                defer.reject(new Error($err));
            }
            else {

                defer.resolve();
            }
            
        });
        
        return defer.promise;
    };
    
    /**
     * Checks if current client is logged in
     * 
     * @result boolean
     */
    var _isClientLoggedIn =
    this.isClientLoggedIn = function f_auth_isClientLoggedIn() {

        return typeof $requestState.SESSION['user'] !== 'undefined';
    };
    
    /**
     * Checks if $user is logged in
     * 
     * @param $user integer|string
     *   User ID or name
     * @result
     *   promise(err, boolean)
     */
    var _isLoggedIn =
    this.isLoggedIn = function f_auth_isLoggedIn($user) {
        
        var defer = q.defer();
        $user = _getIDFromUser($user).done(function ($user) {
            
            if ($user === $requestState.SESSION['ID']) {
                
                defer.resolve(null, _isClientLoggedIn());
                return;
            }

            //check DB
            defer.resolve(false);
            return;
        }, defer.reject);
        
        return defer.promise;
    };


    // CONSTRUCTOR
    _session = session.newSession($requestState);
    $requestState.SESSION = _session.data;
    if ($requestState.SESSION.user) {

        sql.newSQL('usermanagement', $requestState).done(function ($sql) {
            
            var tblU = $sql.openTable('user');
            $sql.query()
                .set(tblU, {
            
                    lastSID: $requestState.SESSION.toString(),
                    lastIP: SFFM.getIP($requestState),
                    lastActivity: Date.now()
                })
                .fulfilling()
                .eq(tblU.col('ID'), $requestState.SESSION.ID)
                .execute()
                .done($sql.free, $sql.free);
        });
    }
};

var _newAuth
= me.newAuth = function f_auth_newAuth($requestState) {
    
    return new Auth($requestState);
};
