'use strict';

var me = module.exports;

var q = require('q');

var auth = require('./auth.js');
var cache = require('./cache.js');
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

var _siteResponse 
= me.siteResponse = function f_make_siteResponse($requestState, $siteName, $namespace) {
    $namespace = $namespace || 'default';
    $siteName = typeof $siteName === 'string' && $siteName !== '' ? $siteName : 'index';

    var defer = q.defer();
    sql.newSQL('default', $requestState).then(function ($sql) {
       
        var tblNS = $sql.openTable('namespace');
        var tblCon = $sql.openTable('content');
        var tblPar = $sql.openTable('partial');
        var tblSL = $sql.openTable('scriptLanguage');
        $sql.query()
            .get([
                tblPar.col('content'),
                tblPar.col('eval'),
                tblPar.col('accessKey'),
                tblPar.col('extSB'),
                tblNS.col('name'),
                tblSL.col('name'),
            ])
            .fulfilling()
            .eq(tblNS.col('name'), $namespace)
            .eq(tblNS.col('ID'), tblPar.col('namespace'))
            .eq(tblPar.col('name'), $requestState.config.generalConfig.rootTemplate.value)
            .execute()
            .then(function ($rows) {
            
            if ($rows.length <= 0) {

                defer.resolve('<strong>ERROR: Root template could not be found</strong>');
                return;
            }
            
            var row = $rows[0];
            var a = auth.newAuth($requestState);
            var hak = a.hasAccessKeyExt(row.accessKey)
            if (!hak.hasAccessKey) {

                $requestState.httpStatus = hak.httpStatus;
                defer.resolve('<strong>' + hak.message + '</strong>');

                return;
            }
            
            // Maybe add a feature to add parameters to the initial partial?
            // I cannot see any use case for now, so I will just set them all to undefined for more stability... 
            var body = row.content.replace(/\$[0-9]+/g ,'undefined');

            if (row.evaluate > 0) {

                var code = sandbox.newScript(body);
                var sb = sandbox.newSandbox();
                if (row.extSB > 0) {

                    sb.addFeature.all($requestState);
                }
                else {

                    sb.addFeature.allSHPS($requestState);
                }

                body = sb.run(code, $requestState.config.generalConfig.templateTimeout)
            }
            
            // parse partial-inclusion
            var incPattern = /\{\s*?\$\s*?([\w\-\_\/\:]*?)\:?([\w\-\_\/]+?)?\s*?(\(.+?\))?\s*?\}/g; // precompile regex
            var foundPattern = false;
            do {

                foundPattern = false;
                body = body.replace(incPattern, function ($match, $namespace, $name, $params, $offset, $string) {
                        
                    foundPattern = true;
                    if (!$namespace || $namespace === '') {

                        $namespace = 'default';
                    }
                    
                    if ($params) {

                        $params = $params
                            .substring(0, $params.length - 1)
                            .split(',');
                    }

                    switch ($name) {

                        case 'body': {
                            
                            // PLACEHOLDER
                            return '### BODY GOES HERE ###';
                            // /PLACEHOLDER

                            // get content from cache, on miss from DB
                            // execute content
                            
                            break;
                        }

                        // reserved for more tags in the future :)

                        default: {

                            // PLACEHOLDER
                            return '[[[' + $namespace + '::' + $name + ']]]';
                            // /PLACEHOLDER

                            // query cache, then DB for partial
                            // execute partial
                        }
                    }
                });
            } 
            while (foundPattern);

            $sql.free();
            $requestState.httpStatus = 200;
            $requestState.responseType = 'text/html';
            $requestState.responseBody = body;

            defer.resolve(body);
        }).done();
    });

    return defer.promise;
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
            var hak = a.hasAccessKeyExt(row.accessKey)
            if (!hak.hasAccessKey) {

                $requestState.httpStatus = hak.httpStatus;
                
                $requestState.responseBody = JSON.stringify({
                    
                    status: 'error',
                    message: hak.message,
                    accessKey: hak.key,
                });

                defer.resolve();
            }
            else {
                
                $requestState.httpStatus = 200;
                if (row.extSB > 0) {
                    
                    extSb.reset();
                    extSb.addFeature.all($requestState);
                    try {
                        var r = extSb.run(sandbox.newScript(row.script));
                        
                        if (typeof r === 'object' && r.then !== undefined) {
                            
                            r.then(function ($result) {
                                
                                $requestState.responseBody = JSON.stringify({
                                    
                                    status: 'ok',
                                    result: $result,
                                });
                                
                                if (r.done !== undefined) {
                                    
                                    r.done();
                                }
                                
                                defer.resolve();
                            });
                        }
                        else {
                            
                            $requestState.responseBody = JSON.stringify({
                                
                                status: 'ok',
                                result: r,
                            });
                            
                            defer.resolve();
                        }
                    }
                    catch ($e) {

                        log.writeError($e);
                    }
                    
                }
                else {
                    
                    sb.reset();
                    sb.addFeature.allSHPS($requestState);
                    $requestState.responseBody = JSON.stringify({
                        
                        status: 'ok',
                        result: sb.run(sandbox.newScript(row.script)),
                    });

                    defer.resolve();
                }
            }
            })
            .done();
    }).done();

    return defer.promise;
};
