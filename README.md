# SHPS

[![Join the chat at https://gitter.im/Skellods-Network/SHPS4Node](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Skellods-Network/SHPS4Node?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What exactly is SHPS?

SHPS is a homepage management system which assists you with making a homepage or web application in general!
SHPS comes as a core system (no Admin GUI or additional features) which can be extended with many useful plugins.
Plugins are what make SHPS special. They are very separated from your site, but can be integrated seemlessly into your site with exactly the theming and placement you need and want.
Plugins can be anything; a forum, a blog, analysis tools for admins,...

- Security is a big point and SHPS tries to automatically make your software save from hackers.
- SHPS is fast and tries to limit resources. We are constantly working on the algorithms to improve their calculation and transfer speed - every millisecond counts!
- No matter, if you make a small website or a huge MMORPG, SHPS always tries to be scalable.
- SHPS defines a rough way of splitting your big problem into many trivial ones.
- SHPS adds a huge set of helpful functions, like user/rights management.
- Making software portable by making you as a developer independant from the OS, web server and even database is a thing we are working on
- SHPS is opensource since we want to gain your trust. Only a well informed community will help make SHPS big.
- Easing the process of making rich Web Applications is a major aim of SHPS

This is only a very rough feature set and the principles SHPS is based on. Please take a look at the detailed feature overview and download SHPS for free to test it out.
Build your site with SHPS and see if it fits your needs. If your project is non-commercial, SHPS is completely free as in gratuit, but always consider giving us a small donation as we put a lot of money and time into improving SHPS every day :)


## TODO List until release of version 4 (and start of SemVer)

- make sure that authentication mechanisms actually work (not necessary for RC status)
- replace custom body parser with FOSS modules from npm (`busboy`) (not necessary for RC status)
- ~~ implement file upload ~~ Will be implemented later (content pipelines)
- log to DB (not necessary for RC status)
- ~~ remove dumb plugin-loading in favor of meta-files in module-packages ~~ (loading needs more work later on and a more modular version of `node-mod-load`)
- ~~ read files from subdirectories in `/upload` ~~
- ~~ remove hugging ~~


## TODO List after release

- move TODO list to github's open issues (make branches/forks and a resulting pull request for each issue)
- GUI. Let's be honest, a GUI is a game-changer and will make SHPS accessible for more people and especially beginners
- work on feature list
- implement domain/user-states which cache certain objects (e.g. log, auth, permissions-array,...)
- pack source in modules into automatically executing function wraps
- only load plugins which are enabled by configurations
- only use explicitly enabled plugins for defined requests
- improve querystring parser with FOSS modules from npm (`qs`)
- add log to disk with FOSS modules from npm (`logrotate-stream`)
- add timeout for sandboxes
- replace default.js with template files
- guided setup
- include dependency checks into init flow
- remove JS modules from CORE directory and pack them into the module-packages
- organize the module packages in a way which optimizes overview
- add config file encryption
- add ipc in local cluster to improve collaboration between processes
- improve cluster-collaboration by assigning specific tasks to different processes
- add possibility of npm-modules which are loaded as plugins
- add auto dependency installation (e.g. download openssl binaries and install them next to SHPS if missing)
- improve sandbox security
- better error detection and management
- improve HTTPS security
- stabilize HTTP/2 server
- certificate based login
- improve commandline
- cache requestState cached structures
- re-enable gzip compression
- remove Q and use native promisses instead (bundled with `promise-defer` for easy rewrite)
- separate module-interface and code by moving all implementation code away from index files
- cache DB in local variables on startup; add cache-tools to commandline in order to invalidate cache manually
- add websocket support for server-requests (create or implement existing protocol)
- extract commandline module into own project + glue and action handler for SHPS (creating the SHPS console "Look 'n Feel")
- enable site-specific plugin (interesting for plugin version as well) by adding subdirectories to /system/plugin
- implement file upload
- clean up classes (constructors are crowded with methods at the moment)
- check if plugin is loaded or physically available before trying to use it (e.g. calling event)
- rewrite function-classes in modules to be real (ES6-)Classes
