"use strict";

var me = module.exports;

var _isArray
= me.isArray = function($var) {

  return $var.constructor === Array;
}

var _cleanStr
= me.cleanStr = function ($dirty) {

    return $dirty;
}