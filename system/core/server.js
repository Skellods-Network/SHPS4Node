/**
 * Du'h, the current TLS modules out there are no good. I cannot have decent security which will get me A+ on SSL-Labs.
 * That's why I will have to make my own TLS server which is able to automatically implement best practices and get very good security out-of-the-box.
 */
'use strict';

var me = module.exports;

var buf = require('buffer');
var child = require('child_process');
var fs = require('fs');
var net = require('net');
var tls = require('tls');

var helper = require('./helper.js');
var log = require('./log.js');
var main = require('./main.js');

var mp = {
    self: this
};


/**
 * Grouphuggable
 * Breaks after 3 hugs per partner
 * 
 * @param $hug
 *  Huggable caller
 */
var _hug 
= me.hug = function f_log_hug($h) {
    
    return helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

var _newHTTP2Server 
= me.newHTTP2Server = function f_server_newHTTP2Server() {

    return new _HTTP2Server();
};

var _HTTP2Server = function c_HTTP2Server() {

    var privateKey;
    var privateKeyPassphrase;
    var certificate;
    var ca;
    
    var ciphers = [
        'AES128+EECDH',
        'AES128+EDH',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA',
        'ECDHE-RSA-AES128-SHA',
        'DHE-RSA-AES256-SHA256',
        'DHE-RSA-AES128-SHA256',
        'DHE-RSA-AES256-SHA',
        'DHE-RSA-AES128-SHA',
        'ECDHE-RSA-DES-CBC3-SHA',
        'EDH-RSA-DES-CBC3-SHA',
        'AES256-GCM-SHA384',
        'AES128-GCM-SHA256',
        'AES256-SHA256',
        'AES128-SHA256',
        'AES256-SHA',
        'AES128-SHA',
        'DES-CBC3-SHA',
        'HIGH',
        '!aNULL',
        '!eNULL',
        '!EXPORT',
        '!DES',
        '!MD5',
        '!PSK',
        '!RC4'
    ].join(':');
    
    var socket;
    var secureContext;
    var server;

    this.listen = function f_HTTP2Server_listen($port, $cb) {
        
        server = net.createServer(function ($socket) {
            
            // generate Certs if not supplied. At least we can grant automatic encryption to a website.
            // I really hope for a "Let's Encrypt API" which will allow for automatic signing
            if (!privateKey || !certificate || !ca || privateKey == '' || certificate == '' || ca == '') {
                
                var certDir = main.getDir(SHPS_DIR_CERTS);
                privateKey = child.SpawnSync('openssl', ['genrsa', '2048'])['output'][1].toString();
                fs.writeFileSync(certDir + 'insecureKey.pem', privateKey);
                var cerSignReq = child.SpawnSync('openssl', ['req', '-new', '-sha256', '-key', certDir + 'insecureKey.pem', '-batch'])['output'][1].toString();
                fs.writeFileSync(certDir + 'insecureCSR.pem', cerSignReq);
                certificate = child.SpawnSync('openssl', ['x509', '-req', '-in', certDir + 'insecureCSR.pem', '-signkey', certDir + 'insecureKey.pem'])['output'][1].toString();
                fs.writeFileSync(certDir + 'insecureCert.pem', certificate);
                ca = undefined;
            }

            secureContext = tls.createSecureContext({
                
                key: privateKey,
                passphrase: privateKeyPassphrase,
                cert: certificate,
                ca: ca,
                //crl: [], // <-- not in use since we want to use OCSP
                ciphers: ciphers, // <-- add to config
                honorCipherOrder: true
            });

            socket = new tls.TLSSocket($socket, {
            
                credentials: secureContext,
                isServer: true,
                server: server,
                requestCert: false, // <-- add to config. Will enable cert-based login :D
                rejectUnauthorized: false, // <-- this should be true if a cert is requested
                NPNProtocols: ['http/2', 'http/1.1'],
                SNICallback: function ($servername, $cb) {

                    $cb(null, secureContext); // <-- get correct secure context for server
                },
                session: new buf(buf.s),
                requestOCSP: true
            });
        }).listen($port);
    };
};
