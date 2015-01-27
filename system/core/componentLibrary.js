"use strict";

var me = module.exports;

var helper = require('./helper.js');

var self = this;


var _makeHyperlink
= me.makeHyperlink = function($ref, $description, $basicAttributes, $newTab, $namespace, $ssl) {
  $basicAttributes = typeof $basicAttributes !== 'undefined' ? $basicAttributes : null;
  $newTab = typeof $newTab !== 'undefined' ? $newTab : false;
  $namespace = typeof $namespace !== 'undefined' ? $namespace : null;
  $ssl = typeof $ssl !== 'undefined' ? $ssl : true;
  
  if (!$ref.match(/[a-zA-Z_\-]+/)) {
  
    var attr = ' rel="nofollow"';
	var url = $ref;
  }
  else {
  
    var attr = '';
	var param = {};
	var url = _getRawURL(param, $namespace, $ssl);
	url += param.pc + 'site=' + $ref;
  }

  if ($basicAttributes !== null) {
  
    attr += ' ' + $basicAttributes;
  }
  
  if ($newTab) {
  
    attr += ' target="_blank"';
  }
  
  return '<a href="' + url + '"' + attr + '>' + $description + '</a>';
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
= me.hug = function f_componentlibrary_hug($h) {
    
    return helper.genericHug($h, self, function f_componentlibrary_hug_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};