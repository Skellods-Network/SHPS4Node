var e = module.exports;

var main = require('./main.js');


e.handleRequest = handleRequest = function ($req, $res, $requestState) {

    $res.writeHead(200);
    $res.end(main.make(null, $requestState));
}