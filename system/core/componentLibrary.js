"use strict";

var me = module.exports;


var _makeHyperlink
= me.makeHyperlink ($ref, $description, $basicAttributes, $newTab, $namespace, $ssl) {
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
}