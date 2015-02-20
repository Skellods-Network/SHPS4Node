'use strict';

var me = module.exports;

var q = require('q');
var promise = require('promise');

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
                });

                $sql.free();
            }).done();
        }).done();
    }
    
    var _makeSecurePassword = function f_auth_makeSecurePassword($passwd, $salt) {

        //bcrypt
    };
    
    var _checkPassword = 
    this.checkPassword = function f_auth_checkPassword($uid, $passwd, $validPasswd, $validSalt) {
        
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


    // CONSTRUCTOR
    _session = session.newSession($requestState);
    $requestState.SESSION = _session.data;
};

var _newAuth
= me.newAuth = function f_sqlCol_newAuth($requestState) {
    
    return new Auth($requestState);
};
