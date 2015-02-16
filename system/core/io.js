'use strict';

var me = module.exports;

var helper = require('./helper.js');

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