var e = module.exports;

var sql = require('./sql.js');
var log = require('./log.js');
var main = require('./main.js');

e.handleRequest = handleRequest = function ($req, $res, $requestState) {

    $res.writeHead(200);
    main.make(null, $requestState);

    /*
    $tmp = sql.newSQL('default', $requestState)
    $tmp.then(function ($sql) {

        $sql.query('SELECT 1 + 1 AS ADDRESULT;').then(function ($result) {

            $res.end('SHPS at your service! ' + $result[0].ADDRESULT);
        }, function ($p1) {
            
            $res.end('FAIL intern ' + $p1);
        });
    }, function ($p1) {

        $res.end('FAIL ' + $p1);
    });
    */
}