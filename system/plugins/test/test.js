'use strict';

var me = module.exports;

var q = require('q');
var libs = require('node-mod-load').libs;


var _onDirectCall 
= me.onDirectCall = function ($requestState) {
    
    var defer = q.defer();
    
    var langs = libs.lang.getAcceptLanguageList();
    $requestState.responseBody = 'Hello from TEST PLUGiN<br>' + JSON.stringify(langs);
    $requestState.responseStatus = 200;
    defer.resolve();

    return defer.promise;
};
