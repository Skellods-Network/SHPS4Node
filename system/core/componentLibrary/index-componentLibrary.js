'use strict';

var me = module.exports;

var libs = require('node-mod-load').libs;

var mp = {
    self: this
};


var _CL 
= me.CL = function c_CL($requestState) {
    
    /**
     * Get content URL
     * @deprecated Please use getURL() with $resource set to false
     * 
     * @param $content string Name of content
     * @param $namespace string|null
     *   Name of namespace. null can be used to stay in the currently used namespace
     *   Default: null
     * @param $ssl boolean|null
     *   Set if transport encryption should be used or not.
     *   Null keeps the current protocol
     *   Default: null
     * @return Object(url, paramChar)
     */
    var _getContentURL =
    this.getContentURL = function ($content, $namespace, $ssl) {

        return _getURL($content, $namespace, $ssl, false, true);
    };
    
    /**
     * Get file URL
     * @deprecated Please use getURL() with $resource set to true
     * 
     * @param $resource string Name of file
     * @param $namespace string|null
     *   Name of namespace. null can be used to stay in the currently used namespace
     *   Default: null
     * @param $ssl boolean|null
     *   Set if transport encryption should be used or not.
     *   Null keeps the current protocol
     *   Default: null
     * @return Object(url, paramChar)
     */
    var _getFileURL =
    this.getFileURL =
    this.getResourceURL = function ($resource, $namespace, $ssl) {

        return _getURL($resource, $namespace, $ssl, true, true);
    };
    
    /**
     * Get URL for a file or a content
     * 
     * @param $name string|null
     *   Name of resource or content
     *   In case of null, the current file or site will be used
     *   Default: null
     * @param $namespace string|null
     *   Name of namespace. null can be used to stay in the currently used namespace
     *   Default: null
     * @param $tls boolean|null
     *   Set if transport encryption should be used or not.
     *   Null keeps the current protocol
     *   Default: null
     * @param $resource boolean|null
     *   True for files, false for content
     *   null works like false, except it will automatically determine the URL, but only if $name was also set to null
     *   Default: null
     * @param boolean $minimal
     *   If activated, the result URL might be cut very very short in certain cases
     *   Default: false
     * @return Object(url, paramChar)
     */
    var _getURL =
    this.getURL = function ($name, $namespace, $tls, $resource, $minimal) {
        
        if ($name === null || $name === undefined) {

            if ($requestState.GET['file']) {

                $name = $requestState.GET['file'];
                if ($resource === null || $resource === undefined) {

                    $resource = true;
                }
            }
            else {

                $name = $requestState.site;
                if ($resource === null || $resource === undefined) {
                    
                    $resource = false;
                }
            }
        }

        var rawURL = _buildURL($namespace, $tls, $resource, $minimal);
        if (!$resource && $name !== $requestState.config.generalConfig.URL.value) {
            
            rawURL.url += rawURL.paramChar + 'site=' + $name;
            rawURL.paramChar = '&';
        }
        else if ($resource) {

            rawURL.url += rawURL.paramChar + 'file=' + $name;
            rawURL.paramChar = '&';
        }
        
        return rawURL;
    };
    
    /**
     * Make a HTML anchor
     * 
     * @param $ref string
     *   Name of content or URL to external address
     * @param $description string
     *   Description for the anchor which will be visible on the site later on.
     *   You can put anything here, even HTML
     * @param $basicAttributes Object(toString())
     *   Object which serializes to HTML attributes
     *   Default: null
     * @param $newTab boolean|null
     *   Should a new tab be opened
     *   If set to null, new tabs will be opened for external urls, else the site will be opened in the same tab
     *   Default: null
     * @param $namespace string|null
     *   Name of namespace. null can be used to stay in the currently used namespace
     *   Default: null
     * @param $ssl boolean|null
     *   Set if transport encryption should be used or not.
     *   Null keeps the current protocol
     *   Default: null
     * @return string
     * 
     * @example 1:
     *   <%= makeHyperlink('//shps.io', 'SHPS'); %>
     */
    var _makeHyperlink =
    this.makeHyperlink = function ($ref, $description, $basicAttributes, $newTab, $namespace, $ssl) {
        $basicAttributes = typeof $basicAttributes !== 'undefined' ? $basicAttributes : null;
        $newTab = typeof $newTab !== 'undefined' ? $newTab : null;
        $namespace = typeof $namespace !== 'undefined' ? $namespace : null;
        $ssl = typeof $ssl !== 'undefined' ? $ssl : null;
        
        var url;
        var attr = '';
        var ext = false;
        if ($ref.match(/(^\/\/.+)|(.+:\/\/.+)|(mailto:.+)/i)) {
            
            attr = ' rel="nofollow"';
            url = $ref;
            ext = true;
        }
        else {
            
            url = _getURL($ref, $namespace, $ssl, false, true).url;
        }
        
        if ($basicAttributes !== null) {
            
            attr += ' ' + $basicAttributes;
        }
        
        if ($newTab === true || ($newTab === null && ext)) {
            
            attr += ' target="_blank"';
        }
        
        return '<a href="' + url + '"' + attr + '>' + $description + '</a>';
    };
    
    /**
     * Get raw URL<br>
     * This is handy, if just lang and the like etc. is needed which will not
     * change the site
     * 
     * @param string|null $namespace
     *   If namespace is null, the currently used namespace is inserted //Default: null
     * @param boolean|null $ssl
     *   Should SSL be used? If null, the current protocol will be used //Default: null
     * @param boolean $resourceURL
     *   Should the static resource URL be used? //Default: false
     * @param boolean $minimal
     *   If activated, the result URL might be cut very very short in certain cases
     *   Default: false
     * @return Object(url, paramChar, toString()->url)
     */
    var _buildURL =
    this.buildURL = function f_componentLibrary_buildURL($namespace, $ssl, $resourceURL, $minimal) {
        $namespace = typeof $namespace !== 'undefined' ? $namespace : null;
        $ssl = typeof $ssl !== 'undefined' ? $ssl : null;
        $resourceURL = typeof $resourceURL !== 'undefined' ? $resourceURL : false;
        
        var url = '';
        var pc = '/?';
        if (($resourceURL && $requestState.config.generalConfig.staticResourcesURL.value !== $requestState.config.generalConfig.URL.value) || $ssl !== null || !$minimal) {

            if ($ssl === null) {
            
                url = '//';
            }
            else if ($ssl) {
            
                url = 'https://';
            }
            else {
            
                url = 'http://';
            }
        
            if ($resourceURL) {
            
                url += $requestState.config.generalConfig.staticResourcesURL.value;
            }
            else {
            
                url += $requestState.config.generalConfig.URL.value;
            }
        
            if ($ssl === null && $requestState._domain.port) {
            
                url += ':' + $requestState._domain.port
            }
            else if ($ssl && $requestState.config.generalConfig.HTTP2Port.value !== 443) {

                url += ':' + $requestState.config.generalConfig.HTTP2Port.value;
            }
            else if ($requestState.config.generalConfig.HTTP1Port.value !== 80) {

                url += ':' + $requestState.config.generalConfig.HTTP1Port.value;
            }
        }
        
        if (typeof $requestState.GET['lang'] !== 'undefined') {
            
            url += pc + 'lang=' + $requestState.GET['lang'];
            pc = '&';
        }
        
        if ($namespace === null) {
            
            if ($requestState.namespace !== 'default') {
                
                url += pc + 'ns=' + $requestState.namespace;
                pc = '&';
            }
        }
        else {
            
            url += pc + 'ns=' + $namespace;
            pc = '&';
        }

        return {
            
            url: url,
            paramChar: pc,
            toString: function () { return url; },
        };
    };
    
    /**
     * Make a HTML anchor to an other language
     * 
     * @param $lang string The target language
     * @param $description The anchor description whih will be visible on the website
     * @param $basicAttributes Object(toString())
     *   Object which serializes to HTML attributes
     *   Default: null
     * @return string
     */
    var _makeLangLink =
    this.makeLangLink = function ($lang, $description, $basicAttributes) {

        var rawUrl = _buildURL(null, null, false, true);
        var url = rawUrl.url + rawUrl.paramChar + 'lang=' + $lang;
        rawUrl.paramChar = '&';

        return '<a href="' + url + '"' + ($basicAttributes !== null ? ' ' + $basicAttributes.toString() : '') + '>' + $description + '</a>';
    };
};

var _newCL 
= me.newCL = function f_componentLibrary_newCL($requestState) {
    
    return new _CL($requestState);
};
