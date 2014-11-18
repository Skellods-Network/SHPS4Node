"use strict";

var me = module.exports;

var _isArray
= me.isArray = function ($obj) {

    return Object.prototype.toString.call($obj) === '[object Array]';
}