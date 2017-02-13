'use strict';

const url = require('url');


module.exports = class RequestState {

    /**
     * Constructor
     * @param {ClientRequest} $req
     * @param {ServerResponse} $res
     * @param {Config} $config
     * @param {Session} $session
     * @param {string} $namespace
     */
    constructor(
        $req,
        $res,
        $config = undefined,
        $session = undefined,
        $namespace = 'default'
    ) {
        this.auth = {};     //todo: Auth object
        this.cache = {};    // cache for different modules; only request-specific data and objects are cached here!
        this.namespace = $namespace;// global namespace is use
        this.request = {

            _raw: $req,       // raw request provided by server
            url: url.parse($req.url, true, true),        // UrlObject with options { parseQueryString: true, slashesDenoteHost: true }
        };

        this.config = $config;   //todo: create new config object from url
        this.response = {

            _raw: $res,       // raw response object provided by server
        };

        //todo: auto-create new session if not set
        this.session = $session;  // Session object for this request
    };
};
