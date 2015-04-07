'use strict';

var me = module.exports;

var q = require('q');

var auth = require('./auth.js');
var helper = require('./helper.js');
var log = require('./log.js');
var sandbox = require('./sandbox.js');
var SFFM = require('./SFFM.js');
var sql = require('./sql.js');

var mp = {
    self: this
};

var sb = sandbox.newSandbox();
var extSb = sandbox.newSandbox();


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_make_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _requestResponse 
= me.requestResponse = function f_make_requestResponse($requestState, $scriptName, $namespace) {
    $namespace = $namespace || 'default';

    var defer = q.defer();
    sql.newSQL('default', $requestState).then(function ($sql) {
        
        var tblReq = $sql.openTable('request');
        var tblNS = $sql.openTable('namespace');
        $sql.query()
                .get([
                tblReq.col('script'),
                tblReq.col('accessKey'),
                tblReq.col('tls'),
                tblReq.col('extSB'),
            ])
            .fulfilling()
            .eq(tblNS.col('ID'), tblReq.col('namespace'))
            .eq(tblNS.col('name'), $namespace)
            .eq(tblReq.col('name'), $scriptName)
            .execute()
            .then(function ($rows) {
            
            if ($rows.length <= 0) {
                
                $requestState.httpStatus = 404;
                $requestState.responseBody = JSON.stringify({
                    
                    status: 'error',
                    message: 'Script not found!',
                });

                defer.resolve();

                return;
            }

            var row = $rows[0];
            if (row.tls > 0 && !SFFM.isHTTPS($requestState.request)) {
                
                $requestState.httpStatus = 403;
                $requestState.responseBody = JSON.stringify({
                    
                    status: 'error',
                    message: 'Script can only be invoked over a TLS encrypted connection!',
                });

                defer.resolve();

                return;
            }

            var a = auth.newAuth($requestState);
            if (!a.hasAccessKey(row.accessKey)) {
                
                if (a.isClientLoggedIn()) {
                    
                    $requestState.httpStatus = 403; // FORBIDDEN
                }
                else {
                    
                    $requestState.httpStatus = 401; // UNAUTHORIZED
                }
                
                $requestState.responseBody = JSON.stringify({
                    
                    status: 'error',
                    message: 'Missing access key mandatory!',
                    accessKey: row.accessKey,
                });

                defer.resolve();
            }
            else {
                
                $requestState.httpStatus = 200;
                if (row.extSB > 0) {
                    
                    extSb.reset();
                    extSb.addFeature.all($requestState);
                    $requestState.responseBody = JSON.stringify({
                        
                        status: 'ok',
                        result: extSb.run(sandbox.newScript(row.script)),
                    });
                }
                else {
                    
                    sb.reset();
                    sb.addFeature.allSHPS($requestState);
                    $requestState.responseBody = JSON.stringify({
                        
                        status: 'ok',
                        result: sb.run(sandbox.newScript(row.script)),
                    });
                }

                defer.resolve();
            }
            })
            .done();
    }).done();

    return defer.promise;
};
