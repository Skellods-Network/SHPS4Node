'use strict';

var me = module.exports;

var vm = require('vm');

var helper = require('./helper.js');
var log = require('./log.js');

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

var _executeScript 
= mp.executeScript = function f_make_executeScript($language, $script) {
    
    // convert other languages to JS
    //switch ($language) {
    
        //case 'php':
        //case 'python':
        //case 'go':
    //}
    
    var options = {
        
        sandbox: {
            
            log: log,
        },
        language: $language,
    };
    
    if (typeof $allowedNativeModules !== 'undefined') {

        options.requireNative = $allowedNativeModules;
    }

    var sb = new vm.VM(options);
    return sb.run($script);
};

var _extExecuteScript 
= mp.extExecuteScript = function f_make_extExecuteScript($language, $script, $allowConsole, $enRequire, $enExtRequire, $allowedNativeModules) {
    $allowConsole = typeof $allowConsole !== 'undefined' ? $allowConsole : false;
    $enRequire = typeof $enRequire !== 'undefined' ? $enRequire : false;
    $enExtRequire = typeof $enExtRequire !== 'undefined' ? $enExtRequire : false;
    
    // convert other languages to JS
    //switch ($language) {
    
    //case 'php':
    //case 'python':
    //case 'go':
    //}
    
    var options = {
        
        sandbox: {
            
            log: log,
        },
        console: $allowConsole ? 'inherit' : 'off',
        language: $language,
        require: $enRequire,
        requireExternal: $enExtRequire,
    };

    if (typeof $allowedNativeModules !== 'undefined') {
        
        options.requireNative = $allowedNativeModules;
    }
    
    var sb = new vm.NodeVM(options);
    return sb.run($script);
};

var _execute
= me.execute = function f_make_execute($script) {
    
    var context = vm.createContext({ });
    return vm.runInContext($line, context);
};
