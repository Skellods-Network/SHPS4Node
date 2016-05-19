'use strict';

var me = module.exports;

var q = require('q');
var libs = require('node-mod-load').libs;


me.onDirectCall = function ($requestState) {
    
    var defer = q.defer();
    
    var nosql = new libs.nosql('nedb', $requestState);
    nosql.init().done(() => {

        var table = nosql.openTable('accesskey');

        table.insert({

            name: 'Hellow',
            description: 'World',
        }).done(($res) => {

            var nosql2 = new libs.nosql('nedb', $requestState);
            nosql2.init().done(() => {

                var table = nosql.openTable('accesskey');

                table.insert({

                    name: 'Hellow2',
                    description: 'World2',
                }).done(($res) => {

                    $requestState.responseStatus = 200;
                    $requestState.responseBody = JSON.stringify($res);
                    defer.resolve();
                }, $err => {

                    $requestState.responseStatus = 500;
                    $requestState.responseBody = $err;
                    defer.reject($err);
                });
            }, defer.reject);
        }, $err => {

            $requestState.responseStatus = 500;
            $requestState.responseBody = $err;
            defer.reject($err);
        });
    }, defer.reject);
    return defer.promise;
};
