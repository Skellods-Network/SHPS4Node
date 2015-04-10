/**
 * This module will make sure all dependencies have been installed or install missing things.
 */
'use strict';

var schedule = require('./schedule.js');
var SFFM = require('./SFFM.js');

var me = module.exports;
var bcryptModule = undefined;
var scryptModule = undefined;


var _getBCrypt 
= me.getBCrypt = function f_dependency_getBCrypt() {
    
    if (bcryptModule != undefined) {

        return require(bcryptModule);
    }
};

var _getSCrypt 
= me.getSCrypt = function f_dependency_getSCrypt() {
    
    if (scryptModule != undefined) {
        
        return require(scryptModule);
    }
};


/**
 * Vars
 */
var preferredModule;
var preferredModuleName;
var description = undefined;


/**
 * Check for openssl
 * 
 * Requirements:
 *   openssl:
 *   - binaries version 1.0.1
 *   
 * It should not be too difficult to just download openssl via HTTP.
 * I only need internet access to do so. This might be the biggest problem for automatization.
 * Then I will need to get the correct OS. I see potential wrong detections here.
 * If openssl is not installed, 
 */


/**
 * Check for bcrypt
 * 
 * Requirements:
 *   1) Node-BCrypt:
 *      - node-gyp
 *      - ~1.5 - 2 GB of compilers and SDKs on Windows
 *      
 *   2) BCypt-NodeJS:
 *      - nothing external :)
 *      
 * Block 1 should be prefered as it will be significantly more performant.
 * But the installation overhead on Windows might make it a less preferred option there.
 * On *nix, most dependencies might be installed anyway (make, gcc, python2.7)
 * Block 2 is a JS-only variant which works exactly the same, but does not need to be compiled.
 */
preferredModule = 'bcrypt';
preferredModuleName = 'node-bcrypt';
if (SFFM.isModuleAvailable(preferredModule)) {
    
    bcryptModule = preferredModule;
}
else {

    bcryptModule = 'bcrypt-nodejs';
    description = 'The alternative module is less performant.';
}

// TODO: Make this more generic
if (bcryptModule !== preferredModule) {

    schedule.sendSignal('onPreferredModuleMissing', preferredModuleName, bcryptModule, description);
}

description = undefined;


/**
 * Check for scrypt
 * 
 * Requirements:
 *   Node-SCrypt:
 *   - node-gyp
 *   - ~1.5 - 2 GB of compilers and SDKs on Windows
 *   
 * SCrypt is rather optional. It will improve security greatly as a third component to crack before the password can be retrived from the hash.
 * I will keep it optional. On *nix it should be easy to install since most gyp-dependencies might be installed either way, but companies will probably prefer Windows.
 */
preferredModule = 'scrypt';
preferredModuleName = 'node-scrypt';
if (SFFM.isModuleAvailable(preferredModule)) {
    
    bcryptModule = preferredModule;
}
else {
    
    preferredModule = 'node-' + preferredModule;
    description = 'The module increases security of stored password hashes.';
    schedule.sendSignal('onOptionalModuleMissing', preferredModuleName, description);
}

description = undefined;
