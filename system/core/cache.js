'use strict';

var me = module.exports;

var q = require('q');

var libs = require('./perf.js').commonLibs;

var memoryStorage = {};
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
= me.hug = function f_make_hug($h) {
    
    return libs.helper.genericHug($h, mp, function f_helper_log_hug($hugCount) {
        
        if ($hugCount > 3) {
            
            return false;
        }
        
        return true;
    });
};

/**
 * Cache value
 * Depending on the config, usage frequency, data size and available memory,
 * the data is either stored in memory, in a cache-DB (e.g. memcached or redis) or in the normal DB
 * 
 * @param Object $requestState
 * @param string $key
 * @param mixed $value Will be JSON-stringified for storage in a SQL DB
 * @param boolean $forcePerformance If set to true, even large/less frequently used data will be stored in a more performant way (memory or cache-DB)
 */
var _save
= me.save = function f_cache_save($requestState, $key, $value, $forcePerformance) {
    $forcePerformance = typeof $forcePerformance !== 'undefined' ? $forcePerformance : false;
    
    if (!memoryStorage[$requestState.config.generalConfig.URL.value]) {

        memoryStorage[$requestState.config.generalConfig.URL.value] = {};
    }
    
    memoryStorage[$requestState.config.generalConfig.URL.value][$key] = $value;
};

/**
 * Load cached value
 * If no value was found, nothing is returned
 * 
 * @param Object $requestState
 * @param string $key
 * @result mixed
 */
var _load
= me.load = function f_cache_load($requestState, $key) {
    
    if (!memoryStorage[$requestState.config.generalConfig.URL.value]) {
        
        return;
    }
    
    return memoryStorage[$requestState.config.generalConfig.URL.value][$key];
};

/**
 * Invalidate cached value
 * 
 * @param Object $requestState
 * @param string $key
 * @result mixed
 */
var _invalidate 
= me.invalidate = function f_cache_invalidate($requestState, $key) {
    
    if (memoryStorage[$requestState.config.generalConfig.URL.value]) {
        
        memoryStorage[$requestState.config.generalConfig.URL.value][$key] = undefined;
    }
};
