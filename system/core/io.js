'use strict';

var me = module.exports;

var q = require('q');
var fs = require('fs')
var util = require('util');

var auth = require('./auth.js');
var helper = require('./helper.js');
var sql = require('./sql.js');
var main = require('./main.js');

var self = this;


var _handleFile
= me.handleFile = function ($fileName) {

    return '';
}

/**
 * Grouphuggable
 * https://github.com/php-fig/fig-standards/blob/master/proposed/psr-8-hug/psr-8-hug.md
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_io_hug($h) {
    
    return helper.genericHug($h, self, function f_io_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _serveFile
= me.serveFile = function f_io_serveFile($requestState, $name) {

    var defer = q.defer();
    sql.newSQL('default', $requestState).then(function ($sql) {

        var tblMT = $sql.openTable('mimeType');
        var tblU = $sql.openTable('upload');
        $sql.query()
            .get([
                tblU.col('fileName'),
                tblU.col('cache'),
                tblU.col('ttc'),
                tblU.col('lastModified'),
                tblU.col('accessKey'),
                tblMT.col('name')
            ])
            .fulfilling()
            .eq(tblU.col('mimeType'), tblMT.col('ID'))
            .eq(tblU.col('name'), $name)
            .execute()
            .then(function ($rows) {

            if ($rows.length > 0) {
                
                var row = $rows[0];
                var a = auth.newAuth($requestState);
                if (a.hasAccessKey(row.accessKey)) {
                    
                    var tmp = main.getDir(SHPS_DIR_UPLOAD) + row.fileName;
                    fs.readFile(main.getDir(SHPS_DIR_UPLOAD) + row.fileName, { flag: 'r' }, function ($err, $data) {
                        
                        if ($err) {
                            
                            $requestState.httpStatus = 404;
                        }
                        else {
                            
                            $requestState.isResponseBinary = true;
                            $requestState.httpStatus = 200;
                            $requestState.responseType = row.name; // `mimeType`.`name`
                            var headers = {
                                
                                'Content-Disposition': 'attachment;filename="' + row.fileName + '"',
                                'Last-Modified': (new Date(row.lastModified).toUTCString())
                            };
                            
                            if (row.cache == 1) {
                                
                                headers['Cache-Control'] = 'max-age=' + row.ttc;
                            }
                            
                            if (typeof $requestState.responseHeaders !== 'undefined') {
                                
                                $requestState.responseHeaders = util._extend($requestState.responseHeaders, headers);
                            }
                            else {
                                
                                $requestState.responseHeaders = headers;
                            }

                            $requestState.responseBody = $data;
                        }

                        defer.resolve();
                    });
                }
                else {
                    
                    if (a.isClientLoggedIn()) {
                        
                        $requestState.httpStatus = 403; // FORBIDDEN
                    }
                    else {

                        $requestState.httpStatus = 401; // UNAUTHORIZED
                        // TODO add authentication headers
                    }

                    defer.resolve();
                }
            }
            else {

                $requestState.httpStatus = 404;
                defer.resolve();
            }
        }).done();
    }).done();

    return defer.promise;
};
