'use strict';

var me = module.exports;

var async = require('vasync');
var q = require('q');
var _ = require('lodash');

var auth = require('./auth.js');
var cache = require('./cache.js');
var helper = require('./helper.js');
var io = require('./io.js');
var log = require('./log.js');
var sandbox = require('./sandbox.js');
var SFFM = require('./SFFM.js');
var sql = require('./sql.js');

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
= me.hug = function f_make_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _preparePartialSB = function ($requestState, $ext) {
    $ext = typeof $ext !== 'undefined' ? $ext : false;
    
    if ($ext) {
        
        if (!$requestState.cache.makePartialSBExt) {
            
            $requestState.cache.makePartialSBExt = sandbox.newSandbox();
            $requestState.cache.makePartialSBExt.addFeature.all($requestState);
        }
        
        return $requestState.cache.makePartialSBExt;
    }
    else {
        
        if (!$requestState.cache.makePartialSB) {
            
            $requestState.cache.makePartialSB = sandbox.newSandbox();
            $requestState.cache.makePartialSB.addFeature.allSHPS($requestState);
        }
        
        return $requestState.cache.makePartialSB;
    }
};

var _getContent = function f_make_getContent($requestState, $contentName, $namespace) {
    
    var defer = q.defer();
    sql.newSQL('default', $requestState).done(function ($sql) {
        
        var tblNS = $sql.openTable('namespace');
        var tblCon = $sql.openTable('content');
        $sql.query()
        .get([
            tblCon.col('content'),
            tblCon.col('accessKey'),
            tblCon.col('extSB'),
            tblCon.col('language'),
            tblCon.col('tls'), // todo: assert HTTPS if this flag is set
        ])
        .fulfilling()
        .eq(tblCon.col('name'), $contentName)
        .execute()
        .done(function ($rows) {
            
            $sql.free();
            if ($rows.length <= 0) {
                
                defer.resolve('<error>ERROR: Site not found!</error>', 404);
                return;
            }
            
            var row = $rows[0];
            var a = auth.newAuth($requestState);
            a.hasAccessKeyExt(row.accessKey).done(function ($akExt) {
                
                if (!$akExt.hasAccessKey) {
                    
                    defer.resolve('<error>' + hak.message + '</error>', hak.httpStatus);
                    return;
                }
                
                var sb = _preparePartialSB($requestState, row.extSB);
                var status = 200;
                var body = row.content;
                switch (row.language) {

                    case 1: {// JS
                        
                        try {
                            var code = sandbox.newScript(body);
                        }
                    catch ($e) {
                            
                            status = 500;
                        }
                        
                        body = sb.run(code, $requestState.config.generalConfig.templateTimeout);
                        
                        break;
                    }

                    case 2: {// Embedded JS
                        
                        var tmp = _.template(body, {
                            
                            imports: sb.getGlobals()
                        });
                        
                        if (typeof tmp === 'function') {
                            
                            body = tmp();
                        }
                        
                        break;
                    }

                    case 3: {// CoffeeScript
                        
                        //Not implemented yet
                        
                        break;
                    }
                }
                
                defer.resolve({
                    body: body,
                    status: status,
                });
            });
        });
    });
    
    return defer.promise;
};

var _getPartial = function f_make_getPartial($requestState, $partialName, $namespace, $void) {
    $namespace = $namespace || 'default';
    
    var defer = q.defer();
    if ($requestState.cache.partials && $requestState.cache.partials[$namespace]) {
        
        if ($requestState.cache.partials[$namespace][$partialName]) {
            
            defer.resolve({
                body: $requestState.cache.partials[$namespace][$partialName],
                status: 200,
                'void': $void,
            });
        }
        else {
            
            defer.reject({
                body: '<error>ERROR: Partial could not be found!</error>',
                status: 404,
                void: $void,
            });
        }
    }
    else {
        
        if (!$requestState.cache.partials) {
            
            $requestState.cache.partials = [];
        }
        
        if (!$requestState.cache.partials[$namespace]) {
            
            $requestState.cache.partials[$namespace] = [];
        }
        
        sql.newSQL('default', $requestState).then(function ($sql) {
            
            var tblNS = $sql.openTable('namespace');
            var tblPar = $sql.openTable('partial');
            $sql.query()
            .get([
                tblPar.col('name', 'partialName'),
                tblPar.col('content', 'partialContent'),
                tblPar.col('accessKey', 'partialAK'),
                tblPar.col('extSB', 'partialExtSB'),
                tblPar.col('language', 'partialSLang'),
                tblPar.col('namespace', 'partialNS'),
            ])
            .fulfilling()
            .eq(tblNS.col('name'), $namespace)
            .eq(tblNS.col('ID'), tblPar.col('namespace'))
            .execute()
            .done(function ($rows) {
                
                $sql.free();
                if ($rows.length <= 0) {
                    
                    defer.resolve({
                        body: '<error>ERROR: Partial could not be found!</error>',
                        status: 404,
                        'void': $void,
                    });
                    return;
                }
                
                var httpStatus = 200;
                var a = auth.newAuth($requestState);
                async.forEachPipeline({
                    
                    inputs: $rows,
                    func: function ($row, $cb) {
                        
                        a.hasAccessKeyExt($row.partialAK).done(function ($akExt) {
                            
                            if (!$akExt.hasAccessKey) {
                                
                                if ($row.partialName === $partialName) {
                                    
                                    httpStatus = $akExt.httpStatus;
                                    $cb($akExt.message, '<error>' + $akExt.message + '</error>');
                                }
                                else {
                                    
                                    $cb();
                                }
                                
                                return;
                            }
                            
                            // params are not implemented yet...
                            var body = $row.partialContent.replace(/\$[0-9]+/g , 'undefined');
                            var sb = _preparePartialSB($requestState, $row.extSB);
                            var code = undefined;
                            switch ($row.partialSLang) {

                                case 1: {// JS
                                    
                                    try {
                                        code = sandbox.newScript(body);
                                        body = sb.run(code, $requestState.config.generalConfig.templateTimeout);
                                    }
                                    catch ($e) {
                                        
                                        body = '<error>ERROR: Could not parse partial ' + $namespace + ':' + $partialName + '</error>';
                                    }
                                    
                                    break;
                                }

                                case 2: {// Embedded JS
                                    
                                    var tmp = _.template(body, {
                                        
                                        imports: sb.getGlobals()
                                    });
                                    
                                    if (typeof tmp === 'function') {
                                        
                                        body = tmp();
                                    }
                                    else {
                                        
                                        body = '<error>ERROR: Could not parse partial ' + $namespace + ':' + $partialName + '</error>';
                                    }
                                    
                                    break;
                                }

                                case 3: {// CoffeeScript
                                    
                                    //Not implemented yet
                                    body = '<error>CoffeeScript not implemented yet!</error>';
                                    
                                    break;
                                }
                            }
                            
                            $requestState.cache.partials[$namespace][$row.partialName] = body;
                            $cb(null, body);
                        });
                    },
                }, function ($err, $res) {
                    
                    var body = '';
                    if ($requestState.cache.partials[$namespace][$partialName]) {
                        
                        body = $requestState.cache.partials[$namespace][$partialName];
                    }
                    else {
                        
                        body = '<error>ERROR: Partial could not be found!</error>';
                        httpStatus = 404;
                    }
                    
                    if ($err) {
                        
                        defer.reject($err);
                    }
                    else {
                        
                        defer.resolve({
                            body: body,
                            status: httpStatus,
                            'void': $void,
                        });
                    }
                });
            });
        });
    }
    
    return defer.promise;
};

var _parseTemplate = function f_make_parseTemplate($requestState, $template) {
    
    var defer = q.defer();
    
    // parse partial-inclusion
    var incPattern = /\{\s*?\$\s*?([\w\-\_\/\:]*?)\:?([\w\-\_\/]+?)?\s*?(\(.+?\))?\s*?\}/; // precompile regex
    var match = incPattern.exec($template);
    if (!match) {
        
        defer.resolve({
            body: $template,
            status: 200,
        });
        
        return defer.promise;
    }
    
    var inc = match[0];
    var namespace = match[1];
    var name = match[2];
    var params = match[3];
    var offset = match.index;
    
    if (!namespace || namespace === '') {
        
        namespace = 'default';
    }
    
    if (params) {
        
        params = params
            .substring(1, params.length - 2)
            .split(',');
    }
    
    var tmp = $template.substring(0, offset - 1);
    switch (name) {

        case 'body': {
            
            name = $requestState.site !== ''
                ? $requestState.site
                : $requestState.config.generalConfig.indexContent.value;
            
            _getContent($requestState, name, namespace).done(function ($res) {
                
                defer.resolve({
                    body: tmp + $res.body,
                    status: $res.status,
                });
            }, defer.reject);
            
            break;
        }

        // reserved for more tags in the future :)

        default: {
            
            _getPartial($requestState, name, namespace).done(function ($res) {
                
                defer.resolve({
                    body: tmp + $res.body,
                    status: $res.status,
                });
            }, defer.reject);
        }
    }
    
    var r = q.defer();
    defer.promise.done(function ($result) {
        
        _parseTemplate($requestState, $result.body + $template.substring(offset + inc.length)).done(r.resolve, r.reject);
    });
    
    return r.promise;
};

var _siteResponse 
= me.siteResponse = function f_make_siteResponse($requestState, $siteName, $namespace) {
    $namespace = $namespace || 'default';
    $siteName = typeof $siteName === 'string' && $siteName !== '' ? $siteName : 'index';
    
    var defer = q.defer();
    _getPartial($requestState, $requestState.config.generalConfig.rootTemplate.value, $namespace).done(function ($res) {
        
        _parseTemplate($requestState, $res.body).done(function ($res) {
            
            
            
            $requestState.httpStatus = 200;
            $requestState.responseType = 'text/html';
            $requestState.responseBody = $res.body;
            defer.resolve($res);
        }, defer.reject);
    }, defer.reject);
    
    return defer.promise;
};

var _requestResponse 
= me.requestResponse = function f_make_requestResponse($requestState, $scriptName, $namespace) {
    $namespace = $namespace || 'default';
    
    var defer = q.defer();
    sql.newSQL('default', $requestState).done(function ($sql) {
        
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
            .done(function ($rows) {
            
            $sql.free();
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
            var hak = a.hasAccessKeyExt(row.accessKey);
            
            throw 'hasAccessKey returns a promise -> have to fix this!';
            
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
                    
                    var sb = sandbox.newSandbox();
                    sb.reset();
                    sb.addFeature.allSHPS($requestState);
                    $requestState.responseBody = JSON.stringify({
                        
                        status: 'ok',
                        result: sb.run(sandbox.newScript(row.script)),
                    });
                    
                    defer.resolve();
                }
            }
        }, defer.reject);
    });
    
    return defer.promise;
};
