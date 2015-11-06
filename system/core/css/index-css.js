'use strict';

var me = module.exports;

var async = require('vasync');
var q = require('q');

var libs = require('node-mod-load').libs;


var _CSS 
= me.CSS = function c_CSS($requestState) {
    
    /**
     * Handle a CSS request
     * 
     * @result Promise()
     */
    var _handle =
    this.handle = function f_CSS_handle() {
        
        var defer = q.defer();
        var css = $requestState.GET['css'];
        if (!css) {
            
            defer.resolve();
            return defer.promise;
        }
        
        libs.sql.newSQL('default', $requestState).done(function ($sql) {
            
            var tblCSS = $sql.openTable('css');
            var tblNS = $sql.openTable('namespace');
            $sql.query()
                .get([
                    tblCSS.col('name'),
                    tblCSS.col('content'),
                    tblCSS.col('language'),
                ])
                .fulfilling()
                .eq(tblCSS.col('mediaquery'), 0)
                .eq(tblCSS.col('namespace'), tblNS.col('ID'))
                .eq(tblNS.col('name'), $requestState.namespace)
                .execute()
                .done(function ($rows) {
                
                $sql.free();
                var l = $rows.length;
                if (l <= 0) {
                    
                    libs.log.newLog($requestState).writeWarning('No Rows: ' + $sql.getLastQuery());
                    defer.reject(new Error(SHPS_ERROR_NO_ROWS));
                    return;
                }
                
                var i = 0;
                var row;
                var sb = libs.sandbox.newSandbox($requestState);
                var r;
                var cssFile = '';
                sb.addFeature.allSHPS();
                async.forEachParallel({
                    
                    inputs: $rows,
                    func: function ($arg, $cb) {
                        
                        libs.make.run($requestState, $arg.content, $arg.language, sb, false).done(function ($res) {
                            
                            if ($res.status) {
                                
                                cssFile += $arg.name + '{' + $res.result + '}';
                            }
                            
                            $cb();
                        }, defer.reject);
                    }
                }, function ($err, $res) {
                    
                    if ($err) {

                        defer.reject(new Error($err));
                    }
                    else {

                        $requestState.httpStatus = 200;
                        $requestState.responseType = 'text/css';
                        $requestState.responseBody = cssFile.replace(/[\r\n]/gi, '');
                        defer.resolve();  
                    }
                });

                //TODO: Add Mediaqueries
            });
        });
        
        return defer.promise;
    };
};

var _newCSS
= me.newCSS = function f_css_newCSS($requestState) {
    
    return new _CSS($requestState);
};