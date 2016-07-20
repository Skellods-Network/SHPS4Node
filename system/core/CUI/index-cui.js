/**
 * CoreUI: Console UI part of SHPS
 * CoreUI is only available in ANSI-Consoles
 */
'use strict';

var me = module.exports;

var os = require('os');
var sd = require('string_decoder').StringDecoder;

var libs = require('node-mod-load').libs;
var q = require('q');


var _init 
= me.init = function f_cui_init() {
    
    //TODO: Check if terminal supports ANSI instead of discriminating against Windows
    //Sidenote: Microsoft is annoying in so many ways and I keep finding more and more problems with their products lately :/
    if (os.platform() === 'win32' || os.type() === 'Windows_NT') {

        return q.promise($res => { $res(); });
    }
    
    if (!libs.main.isDebug()) {

        return q.promise($res => { $res(); }); // CUI is too unstable atm!
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    // Set DOS screen mode
    process.stdout.write('\u001b[19h');

    // Enable mouse
    process.stdout.write('\u001b[?1000h');
    process.stdout.write('\u001b[?1002h');

    // Set up events
    process.stdin.on('keypress', function ($c, $key) {

        //log.write('keypress :D');
    });

    process.stdin.on('data', function ($data) {
        
        var regKeyCode = /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;
        
        var sdec = new sd('utf8');
        var buf = sdec.write($data);
        var parts = regKeyCode.exec(buf);

        // Mouse events
        //if ($data[0] === '\u001b' && $data[1] === '\u005b' && $data[2] === '\u004d') {

            //log.write('MOUSE EVENT');
        //}
    });
    
    process.stdout.write('\u001b[6n');

    return q.promise($res => { $res(); });
};