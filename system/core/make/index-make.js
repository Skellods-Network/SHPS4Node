'use strict';

//TODO: bundle this to c_Make class and cache c_Auth object. Or maybe cache c_Auth object inside requestState.cache?
//Maybe also cache sandboxes in there?

var me = module.exports;

var async = require('vasync');
var q = require('q');
var _ = require('lodash');

var libs = require('node-mod-load').libs;


var _preparePartialSB = function ($requestState, $ext) {
    $ext = typeof $ext !== 'undefined' ? $ext : false;
    
    if ($ext) {
        
        if (!$requestState.cache.makePartialSBExt) {
            
            $requestState.cache.makePartialSBExt = libs.sandbox.newSandbox($requestState);
            $requestState.cache.makePartialSBExt.addFeature.all();
        }
        
        return $requestState.cache.makePartialSBExt;
    }
    else {
        
        if (!$requestState.cache.makePartialSB) {
            
            $requestState.cache.makePartialSB = libs.sandbox.newSandbox($requestState);
            $requestState.cache.makePartialSB.addFeature.allSHPS();
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
 * @return Promise({status, result})
 *   Status can be true or false, depending on if the script executed successfully
 */
var _run 
= me.run = function f_make_run($requestState, $code, $lang, $sb, $extSB) {
    
    var defer = q.defer();
    var r = {
        
        status: false,
        result: '',
    };

    switch ($lang) {

        case undefined:
        case null:
        case 0: {// No script
            r.status = true;
            defer.resolve($code);

            break;
        }

        case 1: {// JS
            
            if (typeof $code === 'string') {
                
                $code = libs.sandbox.newScript($code);
            }
            
            if (!$sb) {
                
                $sb = _preparePartialSB($requestState, $extSB);
            }

            try {
                $sb.run($code).done(function ($res) {
                    
                    defer.resolve($res);
                    r.status = true;
                }, defer.reject);
            }
            catch ($e) {
                
                if (libs.main.isDebug()) {

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
            
            $sb.flushContext().done(function () {
                
                var tmp = _.template($code, {
                    
                    imports: $sb.getGlobals(),
                });
                
                if (typeof tmp === 'function') {
                    
                    try {
                        defer.resolve(tmp()); //TODO: Put this in a sandbox!
                        r.status = true;
                    }
                    catch ($e) {
                        
                        defer.reject($e);
                    }
                }
            });
            
            break;
        }

        default: {// Call Plugins

            var results = libs.schedule.sendDuplexSignal('onScriptExecuteUnknownLanguage', $requestState, $code, $lang, $sb, $extSB);
            var i = 0;
            var l = results.length;
            while (i < l) {
                
                if (results[i]) {
                    
                    defer.resolve(results[i]);
                    break;
                }

                i++;
            }
        }
    }

    return defer.promise.then(function ($res) {
        
        var defer = q.defer();
        
        r.result = $res;
        defer.resolve(r);

        return defer.promise;
    });
};

var _getContent = function f_make_getContent($requestState, $contentName, $namespace) {
    
    var defer = q.defer();
    libs.sql.newSQL('default', $requestState).done(function ($sql) {
        
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
            if (row.tls && !libs.SFFM.isHTTPS($requestState.request)) {
                
                $requestState.responseHeaders['Location'] = libs.cl.newCL($requestState).getURL(null, null, true, null).url;
                defer.reject({
                    
                    status: 301,
                    body: '<error>ERROR: TLS mandatory!</error>',
                });
                
                return;
            }

            var a = libs.auth.newAuth($requestState);
            a.hasAccessKeyExt(row.accessKey).done(function ($akExt) {
                
                if (!$akExt.hasAccessKey) {
                    
                    defer.resolve({

                        body: '<error>' + $akExt.message + '</error>',
                        status: $akExt.httpStatus,
                    });
                    
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

                if (q.isPromise(tmp)) {

                    tmp.done(function ($body) {
                                            
                        defer.resolve({

                            body: $body.result,
                            status: $body.status,
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
        
        libs.sql.newSQL('default', $requestState).then(function ($sql) {
            
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
                var a = libs.auth.newAuth($requestState);
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
                        
                        if (libs.main.isDebug()) {

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
            }, function ($e) {
                    
                $sql.free();
                defer.reject($e);
            });
        }, defer.reject);
    }
    
    return defer.promise;
};

/**
 * @result
 *   Promise({result: string, status: boolean})
 */
var _executeBody = function ($requestState, $nfo, $params) {
    
    var body = $nfo.body.replace(/\$([0-9]+)/g , function ($var) {
        
        if ($params) {
            
            return $params[$var.substr(1)];
        }
        else {
            
            return 'undefined';
        }
    });
    
    body = _run($requestState, body, $nfo.lang, null, $nfo.extSB);

    return body;
};

var _parseTemplate = 
this.parseTemplate = function f_make_parseTemplate($requestState, $template) {
    
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
    
    var tmp = $template.substring(0, offset);
    var conlib = libs.cl.newCL($requestState);
    var basicURL = conlib.buildURL();
    switch (name) {

        case 'body': {
            
            name = $requestState.site !== ''
                ? $requestState.site
                : $requestState.config.generalConfig.indexContent.value;
            
            var siteNotFound = false;
            var errFun = function ($err) {
                
                siteNotFound = true;
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
            };
            
            var status = 500;
            _getContent($requestState, name, namespace).then(function ($res) {
                
                status = $res.status;
                return _executeBody($requestState, $res, params);
            }, errFun)
            .done(function ($body) {
                
                if (siteNotFound) {
                    
                    return;
                }
                
                //TODO Standardize this
                var body = $body.body || $body.result;
                defer.resolve({
                    body: tmp + body,
                    status: status,
                });
            }, errFun);
            
            break;
        }

        case 'css': {
            
            libs.sql.newSQL('default', $requestState).done(function ($sql) {
                
                var tblInclude = $sql.openTable('include');
                var tblFT = $sql.openTable('filetype');
                var tblUp = $sql.openTable('upload');
                $sql.query()
                    .get([
                        tblUp.col('name', 'file'),
                        tblInclude.col('namespace'),
                        tblUp.col('accesskey'),
                    ])
                    .fulfilling()
                    .eq(tblInclude.col('filetype'), tblFT.col('ID'))
                    .eq(tblFT.col('name'), 'css')
                    .eq(tblInclude.col('namespace'), $requestState.namespace)
                    .eq(tblInclude.col('file'), tblUp.col('ID'))
                    .execute()
                    .done(function ($rows) {
                    //TODO: accesskey
                    $sql.free();
                    
                    var r = '';
                    var i = 0;
                    var l = $rows.length;
                    while (i < l) {
                        
                        r += '<link rel="stylesheet" href="' + conlib.getFileURL($rows[i].file).url + '">';
                        i++;
                    }
                    
                    defer.resolve({
                        body: tmp + r + '<link rel="stylesheet" href="' + basicURL.url + basicURL.paramChar + 'css=' + $requestState.site + '">',
                        status: 200,
                    });
                }, function ($e) {
                    
                    $sql.free();
                    if (libs.main.isDebug()) {
                        
                        tmp += $e;
                    }

                    defer.reject({
                        body: tmp,
                        status: 500,
                    });
                });
            });

            break;
        }

        case 'js': {
            
            libs.sql.newSQL('default', $requestState).done(function ($sql) {
                
                var tblInclude = $sql.openTable('include');
                var tblFT = $sql.openTable('filetype');
                var tblUp = $sql.openTable('upload');
                $sql.query()
                    .get([
                        tblUp.col('name', 'file'),
                        tblUp.col('accesskey'),
                    ])
                    .fulfilling()
                    .eq(tblInclude.col('file'), tblUp.col('ID'))
                    .eq(tblInclude.col('filetype'), tblFT.col('ID'))
                    .eq(tblFT.col('name'), 'js')
                    .eq(tblInclude.col('namespace'), $requestState.namespace)
                    .execute()
                    .done(function ($rows) {
                    //TODO: accesskey
                    $sql.free();
                    
                    var r = '';
                    var i = 0;
                    var l = $rows.length;
                    while (i < l) {

                        r += '<script src="' + conlib.getFileURL($rows[i].file).url +'"></script>';
                        i++;
                    }
                    
                    defer.resolve({
                        body: tmp + r,
                        status: 200,
                    });
                }, function ($e) {
                    
                    $sql.free();
                    if (libs.main.isDebug()) {

                        tmp += $e;
                    }

                    defer.reject({
                        body: tmp,
                        status: 500,
                    });
                });
            });

            break;
        }

        // reserved for more tags in the future :)

        default: {
            
            var res = null;
            async.waterfall([

                $cb => {

                    _getPartial($requestState, name, namespace).done($cb.bind(null, null), $cb);
                },
                ($res, $cb) => {

                    res = $res;
                    _executeBody($requestState, $res.body, params).done($cb.bind(null, null), $cb);
                }
            ], ($err, $res) => {

                if ($err) {

                    var msg = $err.body ? $err.body : $err.result;
                    defer.resolve({

                        body: tmp + msg,
                        status: $err.status,
                    });

                    return;
                }

                defer.resolve({

                    body: tmp + $res.result,
                    status: res.status,
                });
            });
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

    async.waterfall([
    
        function ($cb) {

            _getPartial($requestState, $requestState.config.generalConfig.rootTemplate.value, $namespace).done($cb.bind(undefined, null), $cb);
        },
        function ($res, $cb) {

            _executeBody($requestState, $res).done($cb.bind(undefined, null), $cb);
        },
        function ($res, $cb) {
            
            _parseTemplate($requestState, $res.result).done($cb.bind(undefined, null), $cb);//TODO: Check status
        },
        function ($res, $cb) {

            if (q.isPromise($res.body)) {
                
                $res.body.done($cb.bind(undefined, null), $cb);
            }
            else {
                
                $cb(null, $res);
            }
        },
    ], function ($err, $res) {
        
        if ($err) {
            
            defer.reject($err);
        }
        else {
            
            $requestState.httpStatus = $res.status;
            $requestState.responseType = 'text/html';
            $requestState.responseBody = $res.body;
            defer.resolve($res);
        }
    });
    
    return defer.promise;
};

var _requestResponse 
= me.requestResponse = function f_make_requestResponse($requestState, $scriptName, $namespace) {
    $namespace = $namespace || 'default';
    
    var defer = q.defer();
    libs.sql.newSQL('default', $requestState).done(function ($sql) {
        
        var tblReq = $sql.openTable('request');
        var tblNS = $sql.openTable('namespace');
        $sql.query()
            .get([
                tblReq.col('script'),
                tblReq.col('language'),
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
            if (row.tls > 0 && !libs.SFFM.isHTTPS($requestState.request)) {
                
                $requestState.httpStatus = 403;
                $requestState.responseBody = JSON.stringify({
                    
                    status: 'error',
                    message: 'Script can only be invoked over a TLS encrypted connection!',
                });
                
                defer.resolve();
                
                return;
            }
            
            var a = libs.auth.newAuth($requestState);

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
                    var errorFun = function ($e) {
                        
                        $requestState.responseBody = JSON.stringify({
                            
                            status: 'error',
                            message: $e.toString(),//TODO: Don't give away error
                        });
                        
                        defer.resolve();
                    };
                    
                    var handleFun = function ($result) {
                        
                        if (q.isPromise($result)) {
                            
                            $result.done(handleFun, errorFun);
                        }
                        else {
                            
                            $requestState.responseBody = JSON.stringify({
                                
                                status: 'ok',
                                result: $result,
                            });
                            
                            defer.resolve();
                        }
                    };
                    
                    _run($requestState, row.script, row.language, null, row.extSB).done(function ($res) {
                        
                        if ($res.status) {

                            $requestState.responseBody = JSON.stringify({
                                
                                status: 'ok',
                                result: $res.result,
                            });
                        }
                        else {

                            $requestState.responseBody = JSON.stringify({
                                
                                status: 'error',
                                message: $res.result,
                            });
                        }

                        defer.resolve();
                    }, function ($err) {
                                        
                        if ($err.message) {

                            $err = $err.message;
                        }
                            
                        $requestState.responseBody = JSON.stringify({
                            
                            status: 'error',
                            message: $err,
                        });

                        defer.resolve();
                    });
                }
            }, defer.reject);
        }, defer.reject);
    });
    
    return defer.promise;
};
