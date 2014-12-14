var e = module.exports;

var main = require('./main.js');
var io = require('./io.js');


e.handleRequest = handleRequest = function ($req, $res, $requestState) {

    var request = $requestState.path.split('?');
    var reqPath = request[0];
    if (reqPath[0] == '/') {
    
        reqPath = reqPath.substring(1);
    }
    
    var reqParams = reqPath.split('/');
    var i = 0;
    
    var httpStatus = -1;
    var responseBody = '';
    var modus = -1;
    
    while (true) {

        // while with if-typeof is the fastest loop.
        if (typeof reqParams[i] === 'undefined') {

            break;
        }
        
        switch (reqParams[i]) {
        
            case 'site': {
            
                i++;
                responseBody = main.make(reqParams[i]);
                
                break;
            }
            
            case 'request': {
            
                i++;
                responseBody = io.handleScript(reqParams[i]);
                
                break;
            }
            
            case 'file': {
            
                i++;
            }
            
            case 'favicon.ico': {
                
                responseBody = io.handleFile(reqParams[i]);
                if (httpStatus == -1) {
                
                    httpStatus = 200;
                }
                
                break;
            }
            
            case 'HTCPCP': {
            
                if ($requestState.config.generalConfig.eastereggs.value) {
                
                    httpStatus = 418;
                    responseBody = 'ERROR 418: This is a teapot!';
                    
                    break;
                }
            }
        }
        
        i++;
    }
    
    if (httpStatus == -1) {
    
        httpStatus = 200;
        responseBody = main.make($requestState.config.generalConfig.indexContent.value);
    }
    
    $res.writeHead(httpStatus);
    $res.end(responseBody);
}