# SHPS

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

- make sure that authentication mechanisms actually work
- replace custom body parser with FOSS modules from npm (`busboy`)
- implement file upload
- log to DB
- remove dumb plugin-loading in favor of meta-files in module-packages


## TODO List after release

- GUI. Let's be honest, a GUI is a game-changer and will make SHPS accessible for more people and especially beginners
- work on feature list
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
