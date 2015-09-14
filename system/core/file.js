'use strict';

var me = module.exports;

var crypto = require('crypto');
var q = require('q');
var fs = require('fs')
var oa = require('object-assign');
var optimize = require('./optimize.js');
var stream = require('stream');
var util = require('util');

var libs = require('./perf.js').commonLibs;

var mp = {
    self: this
};

/**
 * Grouphuggable
 * https://github.com/php-fig/fig-standards/blob/master/proposed/psr-8-hug/psr-8-hug.md
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_file_hug($h) {
    
    return libs.helper.genericHug($h, mp, function f_file_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _serveFile 
= me.serveFile = function f_file_serveFile($requestState, $name) {
    
    var defer = q.defer();
    libs.sql.newSQL('default', $requestState).done(function ($sql) {
        
        var tblMT = $sql.openTable('mimeType');
        var tblU = $sql.openTable('upload');
        $sql.query()
            .get([
            tblU.col('fileName'),
            tblU.col('cache'),
            tblU.col('ttc'),
            tblU.col('lastModified'),
            tblU.col('accessKey'),
            tblU.col('compressedSize'),
            tblU.col('size'),
            tblMT.col('name', 'mimeType')
        ])
            .fulfilling()
            .eq(tblU.col('mimeType'), tblMT.col('ID'))
            .eq(tblU.col('name'), $name)
            .execute()
            .done(function ($rows) {
            
            $sql.free();
            if ($rows.length > 0) {
                
                var row = $rows[0];
                var a = libs.auth.newAuth($requestState);
                a.hasAccessKeyExt(row.accessKey).done(function ($result) {
                    
                    if ($result.hasAccessKey) {
                        
                        var fPath = libs.main.getDir(SHPS_DIR_UPLOAD) + row.fileName;
                        
                        var fStat = fs.stat(fPath, function ($err, $stats) {
                            
                            if ($err) {
                                
                                $requestState.httpStatus = 500;
                                $requestState.responseBody = libs.main.isDebug() ? $err
                                                                            : '';

                                defer.resolve();
                            }
                            else {
                                
                                $requestState.isResponseBinary = true;
                                $requestState.httpStatus = 200;
                                $requestState.responseType = row.mimeType;
                                var cd = $requestState.request.headers['Referer'] ? 'attachment'
                                                                                  : 'inline';
                                
                                var canGZIP = libs.SFFM.canGZIP($requestState, $stats.size);
                                $requestState.responseHeaders['Content-Type'] = row.mimeType + ';charset=utf-8';
                                $requestState.responseHeaders['Content-Disposition'] = cd + ';filename="' + row.fileName + '"';
                                $requestState.responseHeaders['Last-Modified'] = (new Date(row.lastModified).toUTCString());
                                if (canGZIP && row.compressedSize > 0) {
                                    
                                     row.compressedSize;
                                }
                                else if (canGZIP) {
                                    
                                    //TODO: Buffer file and then send it.
                                    $requestState.responseHeaders['Content-Length'] = 0;
                                }
                                else if (row.size > 0) {
                                    
                                    $requestState.responseHeaders['Content-Length'] = row.size;
                                }
                                else {
                                    
                                    //TODO: don't get file size if it already exists in the DB
                                    $requestState.responseHeaders['Content-Length'] = $stats.size;
                                }

                                $requestState.responseHeaders['Trailer'] = 'Content-MD5';

                                if (row.cache == 1) {
                                    
                                    $requestState.responseHeaders['Cache-Control'] = 'max-age=' + row.ttc;
                                }

                                $requestState.resultPending = false;
                                defer.resolve();

                                var hash = crypto.createHash('md5');
                                hash.setEncoding('hex');
                                
                                var rs = fs.createReadStream(fPath, { bufferSize: 64 * 1024 });
                                rs.pause();
                                
                                var compSize = 0;
                                var cs = optimize.compressStream($requestState, rs, $stats.size);
                                cs.pause();
                                cs
                                    .on('data', function ($chunk) {
                                    
                                        $requestState.response.write($chunk);
                                        compSize += $chunk.length;
                                        hash.update($chunk, 'binary');
                                    })
                                    .once('end', function () {
                                    
                                        hash.end();
                                        var md5 = hash.read();
                                        $requestState.response.addTrailers({
                                        
                                            'Content-MD5': md5
                                        });
                                    
                                        $requestState.response.end();
                                        libs.sql.newSQL('default', $requestState).done(function ($sql) {
                                        
                                            tblU = $sql.openTable('upload');
                                            var vals = {
                                            
                                                hash: md5,
                                                size: $stats.size,
                                                compressedSize: compSize,
                                            };
                                        
                                            if (canGZIP) {

                                                vals.compressedSize = compSize;
                                            }

                                            $sql.query()
                                                .set(tblU, vals)
                                                .fulfilling()
                                                .eq(tblU.col('name'), $name)
                                                .execute()
                                                .done($sql.free, $sql.free);
                                        });
                                    })
                                ;
                                
                                $requestState.once('headSent', function () {
                                                                                    
                                    rs.resume();
                                    cs.resume();
                                });
                            }
                        });
                    }
                    else {
                    
                        $requestState.httpStatus = $result.httpStatus;
                        $requestState.responseBody = $result.message;
                        defer.resolve();
                    }
                     
                });
            }
            else {

                $requestState.httpStatus = 404;
                defer.resolve();
            }
        });
    });

    return defer.promise;
};

//TODO
var _handleUpload 
= me.handleUpload = function f_file_handleUpload() {

    throw 'not implemented yet';
};