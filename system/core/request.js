var e = module.exports;

e.handleRequest = handleRequest = function ($req, $res, $conf) {

    $res.writeHead(200);
    $res.end('SHPS at your service!');
}