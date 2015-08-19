'use strict';

var me = module.exports;

var q = require('q');

var helper = require('./helper.js');
var make = require('./make.js');
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
        
        sql.newSQL('default', $requestState).done(function ($sql) {
            
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
                    
                    defer.reject(new Error(SHPS_ERROR_NO_ROWS));
                    return;
                }
                
                var i = 0;
                var row;
                var sb = sandbox.newSandbox();
                var r;
                var cssFile = '';
                sb.addFeature.allSHPS($requestState);
                while (i < l) {
                    
                    row = $rows[i];
                    r = make.run($requestState, row.content, row.language, sb, false);
                    if (r.status) {
                        
                        cssFile += row.name + '{' + r.result + '}';
                    }
                    
                    i++;
                }
                
                $requestState.httpStatus = 200;
                $requestState.responseType = 'text/css';
                $requestState.responseBody = cssFile.replace(/[\r\n ]/gi, '');
                defer.resolve();

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