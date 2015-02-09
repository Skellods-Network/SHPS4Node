'use strict';

var me = module.exports;

var path = require('path');
var _ = require('lodash');

var helper = require('./helper.js');

var mp = {
    self: this
};


var _cleanStr
= me.cleanStr = function ($dirty) {

    return $dirty;
}

/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_SFFM_hug($h) {
    
    return helper.genericHug($h, mp, function f_SFFM_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * Tries to determine if SHPS is running on io.js or node.js
 * 
 * @return boolean
 */
var _isIOJS 
= me.isIOJS = function f_SFFM_isIOJS() {
    
    f_SFFM_isIOJS.isIOJS = 
        f_SFFM_isIOJS.isIOJS ||
        path.basename(process.title, '.exe') == 'iojs' ||
        _.indexOf(process.argv, 'iojs') >= 0 ||
        _.indexOf(process.argv, 'iojs.exe') >= 0;
    
    return f_SFFM_isIOJS.isIOJS;
};

/**
 * Replaces all occurances in $str with other strings based on $mapObj
 * 
 * @param $str string
 * @param $mapObj object
 *   This is a key:value list of things to replace
 * @return string
 */
var _replaceAll
= me.replaceAll = function f_SFFM_replaceAll($str, $mapObj) {

    var re = new RegExp(Object.keys($mapObj).join("|"), "gi");
    
    return $str.replace(re, function ($matched) {

        return $mapObj[$matched.toLowerCase()];
    });
}