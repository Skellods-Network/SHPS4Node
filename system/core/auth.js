'use strict';

var me = module.exports;

GLOBAL.SHPS_COOKIE_AUTOLOGINTOKEN = 'SHPSALT';

var dep = require('./dependency.js');
var q = require('q');
var oa = require('object-assign');
var promise = require('promise');
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

        sql.newSQL('usermanagement', $requestState).then(function f_auth_updatePassword_newSQL($sql) {
            
            var tbl = $sql.openTable('user');
            $sql.query()
                .get(tbl.col('salt'))
                .fulfilling()
                .equal(tbl.col('ID'), $uid)
                .execute()
                .then(function f_auth_updatePassword_newSQL_query($rows) {
                    
                if ($rows.length == 0) {
                
                    log.error('Could not find user with ID ' + $uid + '!');
                    return;
                }

                tbl.update({

                    password: _makeSecurePassword($passwd, $rows[0].salt)
                }, sql.newConditionBuilder(null)
                    .eq(tbl.col('ID'), $uid)
                ).done();

              $sql.free();
            }).done();
        }).done();
    }
    
    /**
     * Generates a secure password hash from a password
     * 
     * @param string $passwd
     * @result string
     */
    var _makeSecurePassword = function f_auth_makeSecurePassword($passwd) {
        
        var crypt;
        if (crypt = dep.getSCrypt()) {

            // Do the crypt
        }
        else {

            crypt = dep.getBCrypt();
            // Do the crypt
        }
    };
    
    /**
     * Check if supplied password is correct. Either the database is used or a valid password/salt pair can be used
     * 
     * @param $uid integer|string
     *   User ID or name
     * @param $passwd string
     * @param $validPasswd string
     * @param $validSalt string
     * @result boolean
     */
    var _checkPassword =
    this.checkPassword = function f_auth_checkPassword($uid, $passwd, $validPasswd, $validSalt) {
        
        $uid = _getIDFromUser($uid);
        var defer = q.defer();
        
        if (!$validPasswd || !$validSalt) {
            
            sql.newSQL('usermanagement', $requestState).then(function f_auth_updatePassword_newSQL($sql) {
                
                var tbl = $sql.openTable('user');
                $sql.query()
                .get(
                    tbl.col('salt'),
                    tbl.col('password')
                )
                .fulfilling()
                .equal(tbl.col('ID'), $uid)
                .execute()
                .then(function ($rows) {
                    
                    if ($rows.length == 0) {
                        
                        log.error('Could not find user with ID ' + $uid + '!');
                        return;
                    }

                    defer.resolve(pw);
                }).done();
            }).done();
        }
        else {

            defer.resolve({
            
                password: $validPasswd,
                salt: $validSalt
            });
        }
        
        var p = new Promise(function ($fulfill, $reject) {

            defer.promise.then(function ($pw) {
                
                var r = false;
                if ($pw.password == _makeSecurePassword($passwd, $pw.salt)) {

                    r = true;
                    //_updatePassword($uid, $passwd); <-- Only needed with multiple pw crypting/hashing algos
                }

                $fulfill(r);
            }).done();
        });

        return p.then(function ($result) {
        
            return $result;
        });
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
        
        sql.newSQL('usermanagement', $requestState).then(function ($sql) {
            var d = q.defer();
            if ($isGroup) {
                
                $sql.openTable('groupSecurity')
                    .insert({
                    
                    gid: _getIDFromGroup($user),
                    key: _getIDFromAccessKey($key),
                    from: $from,
                    to: $to,
                    authorizer: authorizer
                }).done();
            }
            else {
                
                $sql.openTable('userSecurity')
                    .insert({
                    
                    gid: _getIDFromUser($user),
                    key: _getIDFromAccessKey($key),
                    from: $from,
                    to: $to,
                    authorizer: authorizer
                }).done();
            }
            
            $sql.free();
        }).done();
    };
    
    var _getFieldFromTable = function f_auth_getFieldFromTable($table, $field, $refCol, $refColValue) {
        
        var p = new promise(function ($res, $rej) {
        
            sql.newSQL('usermanagement', $requestState).then(function ($sql) {

                var tbl = $sql.openTable($table);
                $sql.query()
                    .get(tbl.col($field))
                    .fulfilling()
                    .equal(tbl.col($refCol), $refColValue)
                    .execute()
                    .then(function ($rows) {
                
                    if ($rows.length <= 0) {

                        $res(undefined);
                    }
                    else {

                        $res($rows[0].ID);
                    }

                    $sql.free();
                }).done();
            }).done();
        });
        
        return p.then(function ($r) {

            return $r;
        });
    };
    
    var _getIDFromTabel = function f_auth_getIDFromTable($table, $refCol, $refColValue) {

        if (typeof $refColValue == 'number' && $refColValue % 1 == 0) {
            
            return $refColValue;
        }

        return _getFieldFromTable($table, 'ID', $refCol, $refColValue);
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
        
        $key = _getIDFromAccessKey($key);
        sql.newSQL('usermanagement', $requestState).then(function ($sql) {
            
            if ($isGroup) {
                
                $user = _getIDFromGroup($user);
                var tblGS = $sql.openTable('groupSecurity');
                var tblG = $sql.openTable('group');
                tblGS.delete(sql.newConditionBuilder(null)
                    .eq(tblGS.col('gid'), $user)
                    .eq(tblGS.col('key'), $key)
                ).done();
            }
            else {
                
                $user = _getIDFromUser($user);
                var tblGS = $sql.openTable('userSecurity');
                var tblG = $sql.openTable('user');
                tblGS.delete(sql.newConditionBuilder(null)
                    .eq(tblGS.col('uid'), $user)
                    .eq(tblGS.col('key'), $key)
                ).done();
            }

            $sql.free();
        }).done();
    };
    
    /**
     * Check if a user has an access key
     * 
     * @param $key integer|string
     *   Access key ID or name
     * @param $user integer|string
     *   User ID or name. OPTIONAL. If unset, currently logged in user is used
     */
    var _hasAccessKey =
    this.hasAccessKey = function f_auth_hasAccessKey($key, $user) {

        if ($key == 0 || $key === 'SYS_NULL') {

            return true;
        }

        if (typeof $user === 'undefined') {

            if (!_isClientLoggedIn()) {

                return false;
            }

            $user = _session.data['ID'];
        }
        else {

            $user = _getIDFromUser($user);
        }
        
        var p = new promise(function ($res, $rej) {

            sql.newSQL('usermanagement', $requestState).then(function ($sql) {

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
                                .then(function ($rows) {
                                
                                $_p1(null, $rows.length > 0);
                            }).done();
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
                                .then(function ($rows) {
                                
                                $_p1(null, $rows.length > 0);
                            }).done();
                        }
                    ]
                }, function ($err, $results) {
                
                    var i = 0;
                    var l = $results.length;
                    while (i < l) {

                        if ($results[i]) {

                            $res(true);
                            return;
                        }

                        i++;
                    }

                    $res(false);
                });
            }).done();
        })
        
        return p.then(function ($r) {
        
            return $r;
        });
    };
    
    var _delayBruteforce = function f_auth_delayBruteforce($uid) {
        
        var defer = q.defer();
        if (typeof $uid === 'undefined') {

            defer.resolve();
            return defer.promise;
        }

        sql.newSQL('usermanagement', $requestState).then(function ($sql) {
        
            var tblLQ = $sql.openTable('loginQuery');
            $sql.query()
                .get(tblLQ.col('time'))
                .fulfilling()
                .eq(tblLQ.col('uid'), $uid)
                .execute()
                .then(function ($rows) {
                
                var now = (Date.now() / 1000) | 0;
                if ($rows.length <= 0) {

                    tblLQ.insert({
                    
                        uid: $uid,
                        time: now + $requestState.config.securityConfig.loginDelay.value
                    })
                        .done();

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
                        .done();

                    setTimeout(function () {

                        defer.resolve();
                    }, (det - now) * 1000);
                }
            }).done();
        }).done();

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

        $user = _getIDFromUser($user);
        var p = new promise(function ($res, $rej) {
            
            // ASVS V2 2.20 VERTICAL PROTECTION
            _delayBruteforce($user).then(function () {
                
                // ASVS V2 2.20 HORIZONTAL PROTECTION
                _delayBruteforce($pw).then(function () {
                    
                    sql.newSQL('usermanagement', $requestState).then(function ($sql) {
                        
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
                        .then(function ($rows) {
                            
                            if ($rows.length <= 0) {
                                
                                $res(false);
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
                                    .then(function () {
                                        
                                        $sql.free();
                                    }).done();
                                    
                                    $res(true);
                                    
                                    return;
                                }
                                
                                var cpR = _checkPassword($user, $pw, ur.password, ur.salt);
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
                                        .then(function () {
                                        
                                        $sql.free();
                                    }).done();
                                }
                                
                                $res(cpR);
                            }
                        }).done();
                    }).done();
                }).done();
            }).done();
        });

        return p.then(function ($r) {
        
            return $r;
        });
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
     * @result boolean
     */
    var _isLoggedIn =
    this.isLoggedIn = function f_auth_isLoggedIn($user) {
        
        $user = _getIDFromUser($user);
        if ($user === $requestState.SESSION['ID']) {
        
            return _isClientLoggedIn();
        }

        //check DB
    };


    // CONSTRUCTOR
    _session = session.newSession($requestState);
    $requestState.SESSION = _session.data;
    if ($requestState.SESSION.user) {

        sql.newSQL('usermanagement', $requestState).then(function ($sql) {
            
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
                .then(function () {
                    
                    $sql.free();
                })
                .done();
        }).done();
    }
};

var _newAuth
= me.newAuth = function f_auth_newAuth($requestState) {
    
    return new Auth($requestState);
};
