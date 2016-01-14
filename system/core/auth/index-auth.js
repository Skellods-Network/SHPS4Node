'use strict';

var me = module.exports;

GLOBAL.SHPS_COOKIE_AUTOLOGINTOKEN = 'SHPSALT';

var q = require('q');
var defer = require('promise-defer');
var oa = require('object-assign');
var async = require('vasync');
var u = require('util');
var crypt = require('crypto');

var libs = require('node-mod-load').libs;

var Auth
= me.focus = function c_Auth($requestState) {
    
    var _session;
    var self = this;
    var log = libs.log.newLog($requestState);

    this.getSession = function f_auth_getSession() {

        return _session;
    }
    
    var _updatePassword = function f_auth_updatePassword($uid, $passwd) {

        libs.sql.newSQL('usermanagement', $requestState).done(function f_auth_updatePassword_newSQL($sql) {
            
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
                }, libs.sql.newConditionBuilder(null)
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
        if (!(crypt = libs.dep.getSCrypt())) {
            
            crypt = libs.dep.getBCrypt();
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
     * @result promise(boolean)
     */
    var _checkPassword =
    this.checkPassword = function f_auth_checkPassword($uid, $passwd, $validPasswd) {
        
        var defer2 = q.defer();
        
        _getIDFromUser($uid).done(function ($uid) {
        
            log.info('Password Check for UID ' + $uid + '...');
            
            var defer = q.defer();

            if (!$validPasswd) {
                
                libs.sql.newSQL('usermanagement', $requestState).done(function f_auth_updatePassword_newSQL($sql) {
                    
                    var tbl = $sql.openTable('user');
                    $sql.query()
                        .get([
                                tbl.col('pass')
                            ])
                        .fulfilling()
                        .equal(tbl.col('ID'), $uid)
                        .execute()
                        .done(function ($rows) {
                        
                        if ($rows.length == 0) {
                            
                            log.error('Could not find user with ID ' + $uid + '!');
                            return;
                        }
                        
                        defer.resolve($rows[0].pass);
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
            
            defer.promise.done(function ($pw) {
                
                if (!(crypt = libs.dep.getSCrypt())) {
                    
                    crypt = libs.dep.getBCrypt();
                }
                
                crypt.compare($passwd, $pw, function ($err, $res) {
                    
                    if (!$err) {
                        
                        //_updatePassword($uid, $passwd); <-- Only needed with multiple selectable pw crypting/hashing algos
                        log.info('Password Check for UID ' + $uid + ': ' + $res);
                        defer2.resolve($res);
                    }
                    else {
                        
                        log.error('Password Check for UID ' + $uid + ': ' + $err);
                        defer2.reject(new Error($err));
                    }
                });
            }, defer2.reject);
        });
        
        return defer2.promise;
    };
    
    var _normalizeAKParams = function f_auth_normalizeAKParams($user, $key, $isGroup) {

        var d = defer();
        var gako = {};
        
        var guSwitch = _getIDFromUser;
        if ($isGroup) {

            guSwitch = _getIDFromGroup;
        }

        guSwitch($user).then(function ($uid) {
            
            gako.uid = $uid;
            return _getIDFromAccessKey($key);
        }, d.reject)
        .done(function ($kID) {
            
            gako.key = $kID;// let's put the kids into gakkou (jp. school)
            d.resolve(gako);
        }, d.reject);

        return d.promise;
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
        
        _normalizeAKParams($uid, $key, $isGroup).then(function ($gako) {
            
            //log.audit('ACCESS KEY GRANT INITIATED ' + $key + ' for ' + ($isGroup ? 'group' : 'user') + ' ' + $uid + ': ' + new Date($from * 1000).toUTCString() + ' - ' + new Date($to * 1000).toUTCString());
            
            libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                var d = q.defer();
                if ($isGroup) {
                    
                    $sql.openTable('groupSecurity')
                    .insert({
                        
                        gid: $gako.uid,
                        accesskey: $gako.key,
                        from: $from,
                        to: $to,
                        authorizer: authorizer
                    }).done($sql.free, $sql.free);
                }
                else {
                    
                    $sql.openTable('userSecurity')
                    .insert({
                        
                        uid: $gako.uid,
                        accesskey: $gako.key,
                        from: $from,
                        to: $to,
                        authorizer: authorizer
                    }).done($sql.free, $sql.free);
                }
            });
        });
    };
    
    var _getFieldFromTable = function f_auth_getFieldFromTable($table, $field, $refCol, $refColValue) {
        
        var defer = q.defer();
        libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {

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
    
    var _getIDFromTable = function f_auth_getIDFromTable($table, $refCol, $refColValue) {

        if (typeof $refColValue == 'number' && $refColValue % 1 == 0) {
            
            var defer = q.defer();
            defer.resolve($refColValue);

            return defer.promise;
        }

        return _getFieldFromTable($table, 'ID', $refCol, $refColValue);
    };
    
    /**
     * Get access key from ID
     * 
     * @param $id integer
     *   ID
     * @result string
     *   Access key name
     */
    var _getAccessKeyFromID =
    this.getAccessKeyFromID = function f_auth_getAccessKeyFromID($id) {
        
        return _getFieldFromTable('accessKey', 'name', 'ID', $id);
    };
    
    /**
     * Get ID from access key
     * 
     * @param $name string
     *   Name
     * @result integer
     *   ID
     */
    var _getIDFromAccessKey =
    this.getIDFromAccessKey = function f_auth_getIDFromAccessKey($name) {
        
        return _getIDFromTable('accessKey', 'name', $name);
    };
    
    /**
     * Get ID from user
     * 
     * @param $name string
     *   Name
     * @result integer
     *   ID
     */
    var _getIDFromUser =
    this.getIDFromUser = function f_auth_getIDFromUser($name) {
        
        return _getIDFromTable('user', 'user', $name);
    };
    
    /**
     * Get ID from mail
     * 
     * @param $mail string
     *   Mail
     * @result integer
     *   ID
     */
    var _getIDFromMail =
    this.getIDFromMail = function f_auth_getIDFromMail($mail) {
        
        return _getIDFromTable('user', 'email', $mail);
    };
    
    /**
     * Get ID from group
     * 
     * @param $name string
     *   Name
     * @result integer
     *   ID
     */
    var _getIDFromGroup =
    this.getIDFromGroup = function f_auth_getIDFromGroup($name) {
        
        return _getIDFromTable('group', 'name', $name);
    };
    
    /**
     * Get user from ID
     * 
     * @param $id integer
     *   ID
     * @result string
     *   Name
     */
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
        
        _normalizeAKParams($user, $key, $isGroup).then(function ($gako) {
            
            //log.audit('ACCESS KEY REVOKE INITIATED ' + $key + ' for ' + ($isGroup ? 'group' : 'user') + ' ' + $uid + ': ' + new Date($from * 1000).toUTCString() + ' - ' + new Date($to * 1000).toUTCString());

            libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {

                if ($isGroup) {
                    
                    var tblGS = $sql.openTable('groupSecurity');
                    var tblG = $sql.openTable('group');
                    tblGS.delete()
                        .eq(tblGS.col('gid'), $gako.uid)
                        .eq(tblGS.col('accesskey'), $gako.key)
                        .execute()
                        .done($sql.free, $sql.free);
                }
                else {
                    
                    var tblGS = $sql.openTable('userSecurity');
                    var tblG = $sql.openTable('user');
                    tblGS.delete()
                        .eq(tblGS.col('uid'), $gako.uid)
                        .eq(tblGS.col('accesskey'), $gako.key)
                        .execute()
                        .done($sql.free, $sql.free);
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
        
        var uPromise = q.defer();
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
        
        uPromise.promise.done(function ($user) {

            libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                var time = (new Date()).getTime() / 1000 | 0;
                var tblAK = $sql.openTable('accessKey');
                async.parallel({
                    
                    funcs: [
                        function ($_p1, $_p2) {
                            
                            var tblUS = $sql.openTable('userSecurity');

                            $sql.query()
                                .get(tblUS.col('uid'))
                                .fulfilling()
                                .eq(tblUS.col('uid'), $user)
                                .eq(tblUS.col('accesskey'), tblAK.col('ID'))
                                .eq(tblAK.col('name'), $key)
                                .between(time, tblUS.col('from'), tblUS.col('to'))
                                .execute()
                                .done(function ($rows) {

                                $_p1(null, $rows.length > 0);
                            }, function ($err) {
                                
                                $sql.free();
                                $_p1($err);
                            });
                        },

                        function ($_p1, $_p2) {
                            
                            var tblGS = $sql.openTable('groupSecurity');
                            var tblGU = $sql.openTable('groupUser');
                            
                            $sql.query()
                                .get(tblGS.col('gid'))
                                .fulfilling()
                                .eq(tblGU.col('gid'), tblGS.col('gid'))
                                .eq(tblGU.col('uid'), $user)
                                .eq(tblGS.col('accesskey'), tblAK.col('ID'))
                                .eq(tblAK.col('name'), $key)
                                .between(time, tblGS.col('from'), tblGS.col('to'))
                                .execute()
                                .done(function ($rows) {
                                
                                $sql.free();
                                $_p1(null, $rows.length > 0);
                            }, function ($err) {
                                
                                $sql.free();
                                $_p1($err);
                            });
                        }
                    ]
                }, function ($err, $results) {
                    
                    var i = 0;
                    var l = $results.operations.length;
                    while (i < l) {
                        
                        if ($results.operations[i].status === 'ok' && $results.operations[i].result) {
                            
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
     * Delays bruteforcing vertically or horizontally
     * 
     * @param $uid integer|string
     *   User ID or password
     * @return
     *   Promise()
     */
    var _delayBruteforce = function f_auth_delayBruteforce($uid) {
        
        var defer = q.defer();
        if (typeof $uid === 'undefined') {

            defer.resolve('No UID provided!');
            return defer.promise;
        }

        libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
            
            if (typeof $uid === 'number') {

                var tblLQ = $sql.openTable('loginQuery');
                var colLQ = 'uid';
            }
            else {

                var tblLQ = $sql.openTable('passQuery');
                var colLQ = 'pass';
            }

            $sql.query()
                .get(tblLQ.col('time'))
                .fulfilling()
                .eq(tblLQ.col(colLQ), $uid)
                .execute()
                .done(function ($rows) {
                
                var now = (Date.now() / 1000) | 0;
                if ($rows.length <= 0) {
                    
                    var objLQ = {

                        time: now + $requestState.config.securityConfig.loginDelay.value
                    };
                    
                    objLQ[colLQ] = $uid;
                    tblLQ.insert(objLQ)
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
                        .eq(tblLQ.col(colLQ), $uid)
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
        
        // ASVS 3.3
        if ($dbRec.isLoggedIn && ((Date.now() / 1000) - $dbRec.lastActivity <= $requestState.config.securityConfig.sessionTimeout.value)) {
            
            return $dbRec.lastSID != 'noSID' ? $dbRec.lastSID : false;
        }
        else {

            //log.audit('USER NOT LOGGED IN OR WAS LOGGED OUT BY FORCE: ' + $dbRec.ID + ' | ' + $dbRec.user);
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
        
        log.info('LOGIN TRY: ' + $user + ' from ' + libs.SFFM.getIP($requestState.request));

        var defer = q.defer();
        async.waterfall([
        
            function ($cb) {
                _getIDFromUser($user).done(function ($id) {
                    
                    $user = $id;
                    $cb();
                }, function ($e) {
                        
                    if ($e === SHPS_ERROR_NO_ROWS) {

                        _getIDFromMail($user).done(function ($id) {
                                                
                            $user = $id;
                            $cb();                
                        }, $cb);
                    }
                    else {
                        
                        $cb($e);
                    }
                });
            },
            function ($cb) {
                
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

                libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                    $cb(null, $sql);
                }, $cb);
            },
            function ($sql, $cb) {
                
                var alt = '';
                if ($autoLogin && libs.SFFM.isHTTPS($requestState.request)) {
                    
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
                    
                    $sql.free();
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
                        
                        if (alt !== '' && alt === ur.autoLoginToken/* && check IP range */) {
                            
                            var newToken = _session.genNewSID();
                            $requestState.COOKIE.setCookie(SHPS_COOKIE_AUTOLOGINTOKEN, newToken, $requestState.config.securityConfig.autoLoginTimeout.value, true);
                            
                            libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                                                    
                                $sql.openTable('user').update({
                                    
                                    autoLoginToken: newToken,
                                    lastIP: libs.SFFM.getIP($requestState.request),
                                    lastActivity: Date.now() / 1000
                                })
                                .eq(tblU.col('ID'), ur.ID)
                                .execute()
                                .done($sql.free, $sql.free);
                            });
                            
                            $cb(null, true);
                            return;
                        }
                        
                        if (ur.isLocked) {

                            $cb(null, false);
                            return;
                        }

                        _checkPassword($user, $pw, ur.password, ur.salt).done(function ($cpR) {
                            
                            if ($cpR) {
                                
                                $requestState.SESSION = oa($requestState.SESSION, ur);
                                
                                var newToken = _session.genNewSID();
                                $requestState.COOKIE.setCookie(SHPS_COOKIE_AUTOLOGINTOKEN, newToken, $requestState.config.securityConfig.autoLoginTimeout.value, true);
                                
                                libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                                    
                                    $sql.openTable('user').update({
                                        
                                        autoLoginToken: newToken,
                                        lastIP: libs.SFFM.getIP($requestState.request),
                                        lastActivity: Date.now() / 1000
                                    })
                                    .eq(tblU.col('ID'), ur.ID)
                                    .execute()
                                    .done($sql.free, $sql.free);

                                });
                            }
                            
                            $cb(null, $cpR);             
                        }, $cb);
                    }
                }, $cb);
            },
        ], function ($err, $res) {
            
            if ($err) {

                defer.reject(new Error($err));
            }
            else {

                defer.resolve($res);
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
    
    var _register =
    this.register = function f_auth_register($user, $password, $mail, $locked) {
        $locked = typeof $locked !== 'undefined' ? $locked : true;

        var d = q.defer();
        
        libs.dep.getBCrypt().hash($password, null, null, function ($err, $hash) {
        
            if ($err) {

                d.reject($err);
                return;
            }

            libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
                
                var tblU = $sql.openTable('user');
                var ip = libs.SFFM.getIP($requestState.request);
                var uts = (new Date()).getTime() / 1000 | 0;
                tblU.insert({
                    
                    user: $user,
                    email: $mail,
                    pass: $hash,
                    host: ip,
                    regDate: uts,
                    lastIP: ip,
                    lastActivity: uts,
                    isLocked: $locked,
                    xForward: '',//TODO
                    uaInfo: 0,//TODO
                }).done(d.resolve, d.reject);
            });
        });

        return d.promise;
    };


    // CONSTRUCTOR
    // TODO: change all "logged-in" checks to `SESSION._loggedIn` and maintain that state info
    _session = libs.session.newSession($requestState);
    $requestState.SESSION = _session.data;
    if ($requestState.SESSION._loggedIn) {

        libs.sql.newSQL('usermanagement', $requestState).done(function ($sql) {
            
            var tblU = $sql.openTable('user');
            tblU.update({
            
                    lastSID: $requestState.SESSION.toString(),
                    lastIP: libs.SFFM.getIP($requestState.request),
                    lastActivity: Date.now()
                })
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
