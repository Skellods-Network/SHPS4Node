'use strict';

var me = module.exports;

var crypto = require('crypto');
var q = require('q');
var fs = require('fs')
var oa = require('object-assign');
var stream = require('stream');
var util = require('util');

var libs = require('node-mod-load').libs;

var serveMod = require('./serve.js');

var _serveFile = me.serveFile = serveMod.serveFile;

//TODO
var _handleUpload 
= me.handleUpload = function f_file_handleUpload() {

    // Idea:
    // File uploads will be handled in a content pipeline (in-request-stream)
    // Consequently, file uploads will not be implemented in version 4.0.0
    throw 'not implemented yet';
};