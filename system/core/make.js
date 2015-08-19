'use strict';

var me = module.exports;

var async = require('vasync');
var q = require('q');
var _ = require('lodash');

var auth = require('./auth.js');
var cache = require('./cache.js');
var cl = require('./componentLibrary.js');
var helper = require('./helper.js');
var __log = null;
__defineGetter__('_log', function () {
    
    if (!__log) {
        
        __log = require('./log.js');
    }
    
    return __log;
});

var main = require('./main.js');
var __nLog = null;
__defineGetter__('log', function () {
    
    if (!__nLog) {
        
        __nLog = _log.newLog();
    }
    
    return __nLog;
});

var sandbox = require('./sandbox.js');
var schedule = require('./schedule.js');
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

/**
 * Execute code
 * 
 * @param $requestState Object()
 * @param $code string|Script()
 * @param $lang integer
 * @param $sb Sandbox() OPTIONAL
 *   Default: null
 * @param $extSB Boolean OPTIONAL
 *   If no sandbox was given, should the created sandbox be extended?
 *   Default: false
 * @return Object(status, result)
 *   Status can be true or false, depending on if the script executed successfully
 */
var _run 
= me.run = function f_make_run($requestState, $code, $lang, $sb, $extSB) {

    var r = {
        
        status: false,
        result: '',
    };

    switch ($lang) {

        case undefined:
        case null:
        case 0: {// No script
            r.status = true;
            r.result = $code;

            break;
        }

        case 1: {// JS
            
            if (typeof $code === 'string') {
                
                $code = sandbox.newScript($code);
            }
            
            if (!$sb) {
                
                $sb = _preparePartialSB($requestState, $extSB);
            }

            try {
                r.result = $sb.run($code, $requestState.config.generalConfig.templateTimeout.value);
                r.status = true;
            }
            catch ($e) {
                
                if (main.isDebug()) {

                    r.result = $e;
                }
                else {

                    r.result = SHPS_ERROR_CODE_EXECUTION;
                }
            }
            
            break;
        }

        case 2: {// Embedded JS
            
            if (!$sb) {
                
                $sb = _preparePartialSB($requestState, $extSB);
            }

            var tmp = _.template($code, {
                
                imports: $sb.getGlobals()
            });
            
            if (typeof tmp === 'function') {
                
                try {
                    r.result = tmp(); //TODO: Put this in a sandbox!
                    r.status = true;
                }
                catch ($e) {
                    
                    if (main.isDebug()) {
                        
                        r.result = $e;
                    }
                    else {
                        
                        r.result = SHPS_ERROR_CODE_EXECUTION;
                    }
                }
            }
            
            break;
        }

        default: {// Call Plugins

            var results = schedule.sendDuplexSignal('onScriptExecuteUnknownLanguage', $requestState, $code, $lang, $sb, $extSB);
            var i = 0;
            var l = results.length;
            while (i < l) {
                
                if (results[i]) {
                    
                    r.result = results[i];
                    break;
                }

                i++;
            }
        }
    }

    return r;
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
            tblCon.col('tls'),
        ])
        .fulfilling()
        .eq(tblCon.col('name'), $contentName)
        .execute()
        .done(function ($rows) {
            
            $sql.free();
            if ($rows.length <= 0) {
                
                defer.reject({
                
                    status: 404,
                    body: '<error>ERROR: Site not found!</error>',
                });

                return;
            }
            
            var row = $rows[0];
            if (row.tls && !SFFM.isHTTPS($requestState.request)) {
                
                $requestState.responseHeaders['Location'] = cl.newCL($requestState).getURL(null, null, true, null).url;
                defer.reject({
                    
                    status: 301,
                    body: '<error>ERROR: TLS mandatory!</error>',
                });
                
                return;
            }

            var a = auth.newAuth($requestState);
            a.hasAccessKeyExt(row.accessKey).done(function ($akExt) {
                
                if (!$akExt.hasAccessKey) {
                    
                    defer.resolve('<error>' + hak.message + '</error>', hak.httpStatus);
                    return;
                }
                
                var sb = _preparePartialSB($requestState, row.extSB);
                var status = 200;
                var body = row.content;
                var tmp = _run($requestState, body, row.language, sb, row.extSB);
                if (tmp.status) {
                    
                    status = tmp.status;
                    body = tmp.result;
                }
                else {

                    status = 500;
                    body = '<error>' + tmp.result + '</error>';
                }

                if (body.then) {

                    body.done(function ($body) {
                                            
                        defer.resolve({

                            body: $body,
                            status: status,
                        });              
                    });
                }
                else {

                    defer.resolve({

                        body: body,
                        status: status,
                    });
                }
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
                'void': $void,
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

                    return defer.promise;
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
                            
                            $requestState.cache.partials[$namespace][$row.partialName] = {};
                            $requestState.cache.partials[$namespace][$row.partialName].namespace = $row.partialNS;
                            $requestState.cache.partials[$namespace][$row.partialName].name = $row.partialName;
                            $requestState.cache.partials[$namespace][$row.partialName].body = $row.partialContent;
                            $requestState.cache.partials[$namespace][$row.partialName].lang = $row.partialSLang;
                            $requestState.cache.partials[$namespace][$row.partialName].extSB = $row.partialExtSB;
                            $cb(null, $row.partialContent);
                        });
                    },
                }, function ($err, $res) {
                    
                    var body = '';
                    if ($requestState.cache.partials[$namespace][$partialName]) {
                        
                        body = $requestState.cache.partials[$namespace][$partialName].body;
                    }
                    else {
                        
                        body = '<error>ERROR: Partial could not be found!</error>';
                        httpStatus = 404;
                    }
                    
                    if ($err) {
                        
                        if (main.isDebug()) {

                            defer.reject($err);
                        }
                        else {

                            defer.reject(SHPS_ERROR_UNKNOWN);
                        }
                    }
                    else {
                        
                        defer.resolve({
                            name: $partialName,
                            namespace: $namespace,
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

var _executeBody = function ($requestState, $nfo, $params) {
    
    var body = $nfo.body.replace(/\$([0-9]+)/g , function ($var) {
        
        if ($params) {
            
            return $params[$var.substr(1)];
        }
        else {
            
            return 'undefined';
        }
    });
    
    body = _run($requestState, body, $nfo.lang, null, $nfo.extSB).result;

    return body;
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
            .substring(1, params.length - 1)
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
                    body: tmp + _executeBody($requestState, $res, params),
                    status: $res.status,
                });
            }, function ($err) {
                
                if ($err.status && $err.body) {
                    
                    $err.body = tmp + $err.body;
                    defer.resolve($err);
                }
                else {
                    
                    var tmpE = {};
                    tmpE.status = 404;
                    tmpE.body = tmp + $err;
                    defer.reject(tmpE);
                }
            });
            
            break;
        }

        // reserved for more tags in the future :)

        default: {
            
            _getPartial($requestState, name, namespace).done(function ($res) {
                
                defer.resolve({
                    body: tmp + _executeBody($requestState, $res.body, params),
                    status: $res.status,
                });
            }, defer.reject);
        }
    }
    
    var r = q.defer();
    defer.promise.done(function ($result) {
        
        _parseTemplate($requestState, $result.body + $template.substring(offset + inc.length)).done(function ($res) {
            
            if ($result.status > $res.status) {

                $res.status = $result.status;
            }

            r.resolve($res);
        }, r.reject);
    });
    
    return r.promise;
};

var _siteResponse 
= me.siteResponse = function f_make_siteResponse($requestState, $siteName, $namespace) {
    $namespace = $namespace || 'default';
    $siteName = typeof $siteName === 'string' && $siteName !== '' ? $siteName : 'index';
    
    var defer = q.defer();
    _getPartial($requestState, $requestState.config.generalConfig.rootTemplate.value, $namespace).done(function ($res) {
        
        _parseTemplate($requestState, _executeBody($requestState, $res)).done(function ($fRes) {
            
            if ($res.status > $fRes.status) {

                $fRes.status = $res.status;
            }

            $requestState.httpStatus = $fRes.status;
            $requestState.responseType = 'text/html';
            $requestState.responseBody = $fRes.body;
            defer.resolve($fRes);
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

            a.hasAccessKeyExt(row.accessKey).done(function ($akExt) {
                
                if (!$akExt.hasAccessKey) {
                    
                    $requestState.httpStatus = $akExt.httpStatus;
                    
                    $requestState.responseBody = JSON.stringify({
                        
                        status: 'error',
                        message: $akExt.message,
                        accessKey: $akExt.key,
                    });
                    
                    defer.resolve();
                }
                else {
                    
                    $requestState.httpStatus = 200;
                    if (row.extSB > 0) {
                        
                        var extSb = sandbox.newSandbox();
                        extSb.reset();
                        extSb.addFeature.all($requestState);
                        
                        try {

                            var r = extSb.run(sandbox.newScript(row.script));
                        }
                        catch ($e) {

                            $requestState.responseBody = JSON.stringify({
                                
                                status: 'error',
                                result: $e,
                            });
                            
                            defer.resolve();
                        }
                        
                        if (typeof r === 'object' && r.done !== undefined) {
                            
                            var rFun;
                            if (r.done !== undefined) {

                                rFun = r.done.bind(r);
                            }
                            else {

                                rFun = r.then.bind(r);
                            }

                            rFun(function ($result) {
                                
                                $requestState.responseBody = JSON.stringify({
                                    
                                    status: 'ok',
                                    result: $result,
                                });
                                
                                defer.resolve();
                            }, function ($e) {
                                                    
                                $requestState.responseBody = JSON.stringify({
                                    
                                    status: 'error',
                                    message: $e,
                                });

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
        }, defer.reject);
    });
    
    return defer.promise;
};
