'use strict';

var me = module.exports;

var q = require('q');

var libs = require('node-mod-load').libs;


var _Language 
= me.Language = function c_language($requestState) {
    
    /**
     * Get language to use
     * 
     * @return promise
     */
    var _getLanguage =
    this.getLanguage = function f_language_getLanguage() {
        
        var defer = q.defer();
        if (typeof $requestState.cache.language !== 'undefined') {
            
            defer.resolve($requestState.cache.language);
        }
        else {
            
            libs.sql.newSQL('default', $requestState).done(function ($sql) {
                
                var tblLang = $sql.openTable('language');
                $sql.query()
                    .get([
                    tblLang.col('name'),
                    ])
                    .orderBy(tblLang.col('ID'))
                    .execute()
                    .done(function ($rows) {
                    
                    $sql.free();
                    var ll = _getAcceptLanguageList();
                    if ($rows.length <= 0) {
                        
                        if (ll.length <= 0) {
                            
                            $fulfill('en');
                        }
                        else {
                            
                            defer.resolve(ll[0][0]);
                        }
                    }
                    else {
                        
                        if (ll.length <= 0) {
                            
                            defer.resolve($rows[0].name);
                        }
                        else {
                            
                            var i = 0;
                            var l = $rows.length;
                            var lll = ll.length;
                            var done = false;
                            while (i < lll && !done) {
                                
                                var j = 0;
                                while (j < l) {
                                    
                                    if ($rows[j].name === ll[i][0]) {
                                        
                                        defer.resolve(ll[i][0]);
                                        done = true;
                                        break;
                                    }
                                    
                                    j++;
                                }
                                
                                i++;
                            }
                            
                            if (!done) {
                                
                                defer.resolve('en');
                            }
                        }
                    }
                });
            });
        }
        
        return defer.promise;
    };
    
    /**
     * Get enumerator over languages
     * Languages are sorted by quality. Important languages come first.
     * 
     * @return [[]] Array of arrays with 2 values
     * 0: language name
     * 1: language quality
     */
    var _getAcceptLanguageList =
    this.getAcceptLanguageList = function f_language_getAcceptLanguageList() {
        
        if (typeof $requestState.cache.languages === 'undefined') {
            
            if (typeof $requestState.request.headers['accept-language'] === 'undefined') {
                
                $requestState.cache.languages = [];
            }
            else {
                
                var langs = $requestState.request.headers['accept-language'].split(',');
                var cleanArray = [];
                var keys = [];
                
                var updateQuality = function ($lang, $qual) {
                    
                    var i = 0;
                    var l = cleanArray.length;
                    while (i < l) {
                        
                        if (cleanArray[i][0] == $lang) {
                            
                            if (cleanArray[i][1] < $qual) {
                                
                                cleanArray[i][1] = $qual;
                            }
                            
                            break;
                        }
                        
                        i++;
                    }
                };
                
                var i = 0;
                var l = langs.length;
                while (i < l) {
                    
                    var entry = langs[i].split(';');
                    var lang = entry[0].substr(0, 2);
                    var quality;
                    if (entry.length == 1) {
                        
                        quality = 1;
                    }
                    else {
                        
                        quality = +entry[1].replace(/^q=/, ''); // + used to convert string to float
                    }
                    
                    if (keys.indexOf(lang) < 0) {
                        
                        cleanArray.push([lang, quality]);
                        keys.push(lang);
                    }
                    else {
                        
                        updateQuality(lang, quality);
                    }
                    
                    i++;
                }
                
                langs = cleanArray;
                langs = langs.sort(function ($a, $b) {
                    
                    return $b[1] - $a[1];
                });
                
                $requestState.cache.languages = langs;
            }
        }
        
        return $requestState.cache.languages;
    }
    
    /**
     * Get enumerator over languages
     * Languages are sorted by quality. Important languages come first.
     * 
     * @return Object Enumerator with next() and currentLanguage and currentQuality
     */
    var _getAcceptLanguageEnumerator =
    this.getAcceptLanguageEnumerator = function f_language_getAcceptLanguageEnumerator() {
        
        return {
            
            _langs: _getAcceptLanguageList(),
            _index: -1,
            currentLanguage: '',
            currentQuality: 0,
            
            next: function () {
                
                this._index++;
                var r = this._index < this._langs.length;
                if (r) {
                    
                    this.currentLanguage = this._langs[this._index][0];
                    this.currentQuality = this._langs[this._index][1];
                }
                
                return r;
            }
        };
    };
    
    /**
     * Get all strings of a group in the preferred browser language or in an available language
     * The language with the smallest ID is always the first preferred language
     * 
     * @param $group string Language group
     * @param $namespace string //Default: 'default'
     * @return Promise({}) With key->value object
     */
    var _getStrings =
    this.getStrings = function f_language_getStrings($group, $namespace) {
        $namespace = typeof $namespace === 'string' ? $namespace : 'default';

        var defer = q.defer();
        _getLanguage($requestState).done(function ($lang) {
            
            libs.sql.newSQL('default', $requestState).done(function ($sql) {
                
                var tblLang = $sql.openTable('language');
                var tblString = $sql.openTable('string');
                var tblSG = $sql.openTable('stringGroup');
                var tblNS = $sql.openTable('namespace');
                $sql.query()
                .get([
                    tblString.col('key'),
                    tblString.col('value'),
                    tblLang.col('name', 'lang')
                ])
                .fulfilling()
                .eq(tblString.col('namespace'), tblNS.col('ID'))
                .eq(tblNS.col('name'), $namespace)
                .eq(tblSG.col('ID'), tblString.col('group'))
                .eq(tblSG.col('name'), $group)
                .eq(tblLang.col('ID'), tblString.col('langID'))
                .execute()
                .done(function ($rows) {
                    
                    $sql.free();
                    
                    var ll = _getAcceptLanguageList();
                    var r = {};
                    var i = 0;
                    var j = 0;
                    var l = $rows.length;
                    var lll = ll.length;
                    while (i < l) {
                        
                        var row = $rows[i];
                        if (!r[row.key]) {

                            r[row.key] = {
                                
                                lang: row.lang,
                                value: row.value,
                                toString: function () {

                                    return this.value;
                                },
                            };
                        }
                        else {

                            j = 0;
                            while (j < lll) {

                                if (r[row.key].lang === ll[j][0]) {

                                    break;
                                }

                                if (row.lang === ll[j][0]) {

                                    r[row.key].lang = row.lang;
                                    r[row.key].value = row.value;
                                    break;
                                }

                                j++;
                            }
                        }

                        i++;
                    }
                    
                    defer.resolve(r);
                });
            });
        });

        return defer.promise;
    };
    
    /**
     * Get string in the preferred browser language or in an available language
     * The language with the smallest ID is always the alternative language
     * 
     * @param $group string Language group
     * @param $key string String key
     * @param $namespace string //Default: 'default'
     * @return Promise(string)
     */
    var _getString =
    this.getString = function f_language_getString($group, $key, $namespace) {
        $namespace = typeof $namespace === 'string' ? $namespace : 'default';
        
        var defer = q.defer();
        
        _getLanguage($requestState).done(function ($lang) {
            
            libs.sql.newSQL('default', $requestState).done(function ($sql) {
                
                var tblLang = $sql.openTable('language');
                var tblString = $sql.openTable('string');
                var tblSG = $sql.openTable('stringGroup');
                var tblNS = $sql.openTable('namespace');
                $sql.query()
                .get([
                    tblString.col('value'),
                    tblLang.col('name', 'lang')
                ])
                .fulfilling()
                .eq(tblString.col('namespace'), tblNS.col('ID'))
                .eq(tblNS.col('name'), $namespace)
                .eq(tblSG.col('ID'), tblString.col('group'))
                .eq(tblSG.col('name'), $group)
                .eq(tblLang.col('ID'), tblString.col('langID'))
                .eq(tblString.col('key'), $key)
                .execute()
                .done(function ($rows) {
                    
                    $sql.free();
                    
                    if ($rows.length <= 0) {
                        
                        defer.resolve('N/A');
                    }
                    else {
                        
                        var l = $rows.length;
                        var found = false;
                        if (l > 1) {

                            var i = 0;
                            while (i < l) {

                                if ($rows[i].lang === $lang) {

                                    libs.make.parseTemplate($requestState, $rows[i].value).done(function ($res) {
                                        
                                        defer.resolve($res.body);
                                    }, function ($res) {
                                        
                                        defer.resolve($rows[i].value);
                                    });

                                    found = true;
                                }
                                i++;
                            }
                        }
                        
                        if (!found) {
                            
                            var ll = _getAcceptLanguageList();
                            var i = 0;
                            var j = 0;
                            var lll = ll.length;
                            var r = '';
                            while (i < lll) {
                                
                                j = 0;
                                while (j < l) {
                                    
                                    if (ll[i][0] === $rows[j].lang) {

                                        r = $rows[j].value;
                                        found = true;
                                        break;
                                    }
                                    j++;
                                }
                                
                                if (found) {

                                    break;
                                }

                                i++;
                            }
                            
                            if (found) {

                                defer.resolve(r);
                            }
                            else {
                                
                                libs.make.parseTemplate($requestState, $rows[0].value).done(function ($res) {
                                    
                                    defer.resolve($res.body);
                                }, function ($res) {
                                    
                                    defer.resolve($rows[0].value);
                                });
                            }
                        }
                    }
                });
            });
        });
        
        return defer.promise;
    };
};

var _newLang 
= me.newLang = function f_language_newLang($requestState) {

    return new _Language($requestState);
};