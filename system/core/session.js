'use strict';

var me = module.exports;

var crypto = require('crypto');

var helper = require('./helper.js');
var SFFM = require('./SFFM.js');

var mp = {
    self: this
};

var _sessionStorage = {};


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

var _newSession 
= me.newSession = function f_session_startSession($requestState) {
    
    var sid = $requestState.COOKIE.getCookie('SHPSSID');
    if (typeof _sessionStorage[sid] === 'undefined') {
        
        var s = new Session($requestState);
        sid = s.toString();
        _sessionStorage[sid] = s;
    }
    else {
        
        if (!$requestState._session_is_renewed) {
            
            var sssid = _sessionStorage[sid];
            delete _sessionStorage[sssid.toString()];
            sssid.updateRS($requestState);
            sid = sssid.genNewSID();
            _sessionStorage[sid] = sssid;
            $requestState._session_is_renewed = true;
        }
    }

    $requestState.COOKIE.setCookie('SHPSSID', sid, $requestState.config.securityConfig.sessionTimeout.value, true);
    return _sessionStorage[sid];
};

var Session = function c_Session($requestState) {
    
    var _sid = $requestState.COOKIE.getCookie('SHPSSID');
    
    this.data = {};

    this.genNewSID = function f_session_session_genNewSID() {

        var _sha1 = crypto.createHash('sha1');
        _sha1.update(SFFM.getIP($requestState.request), 'ascii');
        _sha1.update(SFFM.randomString(2048), 'ascii');
        _sha1.update((new Date).toISOString(), 'ascii');
        _sid = _sha1.digest('base64');

        return _sid;
    };

    this.updateRS = function f_session_session_updateRS($rs) {

        $requestState = $rs;
    };
    
    this.toString = function f_session_session_toString() {

        return _sid;
    };


    // CONSTRUCTOR
    $requestState.COOKIE.setCookie('SHPSSID', this.genNewSID(), $requestState.config.securityConfig.sessionTimeout.value, true);
};
