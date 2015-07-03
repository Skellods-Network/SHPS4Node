'use strict';

var me = module.exports;

var q = require('q');

var lang = require('../core/language.js');
var log = require('../core/log.js');
var sffm = require('../core/SFFM.js');
var sql = require('../core/sql.js');

var auth = require('../core/auth.js');
var compLib = require('../core/componentLibrary.js');


var _info 
= me.info = {
    
    get name() {
        
        return 'SHPS internal testing';
    },
    
    get author() {
        
        return 'Marco Alka';
    },
    
    get version() {
        
        return [1, 0, 0];
    },
    
    get website() {
        
        return 'http://shps.io';
    },
    
    get GUID() {
        
        return '';
    }
}

var _onDirectCall 
= me.onDirectCall = function ($requestState) {
    
    var defer = q.defer();
    
    // LANGUAGE TEST
    lang.newLang($requestState).getStrings('test').done(function ($strings) {
    
        $requestState.responseBody = JSON.stringify($strings);
        $requestState.responseType = 'application/json';
        $requestState.httpStatus = 200;
        defer.resolve();
    });
    
    return defer.promise;

    // CL Test
    /*$requestState.responseType = 'text/html';
    $requestState.httpStatus = 200;
    $requestState.responseBody = compLib.newCL($requestState).makeHyperlink('//google.de', 'Test Descr.');
    
    process.nextTick(defer.resolve);

    return defer.promise;*/

    x.y();

    // SESSION TEST
    $requestState.responseType = 'text/plain';
    $requestState.httpStatus = 200;
    $requestState.responseBody = 'TEST - äÖüß日本語; ';

    var a = auth.newAuth($requestState);
    if ($requestState.SESSION['sth'] === undefined) {

        $requestState.SESSION['sth'] = 0;
    }
    else {

        $requestState.SESSION['sth']++;
    }

    $requestState.responseBody += $requestState.SESSION['sth'];
    
    lang.getString($requestState, 'test', 'test0').then(function ($string) {
    
        $requestState.responseBody += '\n' + $string;
        defer.resolve();
    }).done();

    
    return defer.promise;
    
    
    // SQL TEST
    var s;
    if (s = sql.newSQL('default', $requestState)) {
        
        s.then(function ($sql) {
            
            var tbl = sql.newTable($sql, 'HP_template');
            $sql.query()
                .get(tbl.col('name'))
                .fulfilling()
                .ne(tbl.col('ID'), 1)
                .execute()
                .then(function ($rows) {
                
                    var r = '';
                    var i = 0;
                    var l = $rows.length;
                    while (i < l) {
                    
                        r += $rows[i].name + '<br>';
                        i++;
                    }
                
                    $requestState.responseType = 'text/html';
                    $requestState.httpStatus = 200;
                    $requestState.responseBody = r;
                
                    $sql.free();
                    defer.resolve();
                }).done();
        }).done();
    }
    else {

        $requestState.httpStatus = 500;
        $requestState.responseBody = JSON.stringify({
            
            status: 'ERROR',
            message: 'Could not connect to DB!'
        });
    }

    return defer.promise;
};