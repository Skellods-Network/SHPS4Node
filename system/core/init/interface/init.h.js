'use strict';

/**
 * Booststrapper module for SHPS
 */
module.exports = class Init {

    /**
     * The Init Module initializes itself on creation
     */
    constructor() {

        Init.init();
    }

    /**
     * Initialize all SHPS modules
     *
     * @result QPromise
     */
    boot() { throw 'Not Implemented'; }

    /**
     * Shuts SHPS down
     * !!! ATTENTION !!!
     * SHPS will stop! It will no longer serve any content and it will not restart on its own
     * Only call this method when you really want to exit SHPS
     * Don't come running the me. I warned you!
     *
     * @result QPromise
     */
    shutdown() { throw 'Not Implemented'; }

    /**
     * Initializes this module
     * Must safely initialize the module, even after restarts
     * Attention: Module might not work when not initialized
     *
     * @result QPromise
     */
    static init() { throw 'Not Implemented'; }

    /**
     * Shuts the module down
     * Must safely shut down the module so that it works even when restarted
     * Attention: Module might not work when shut down!
     *
     * @result QPromise
     */
    static halt() { throw 'Not Implemented'; }
};
