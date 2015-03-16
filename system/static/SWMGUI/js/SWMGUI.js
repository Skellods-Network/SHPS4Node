(function () {

    SWMGUI = typeof SWMGUI !== 'undefined' ? SWMGUI : new (function () {
        

        var _inclT = inclT =
        this.inclT = function f_inclT($name) {
            
            var tmp = _.template(_dlTemplate($name, false), {});
            if (typeof tmp === 'function') {
                
                tmp = tmp();
            }
            
            return tmp;
        };
        
        var _dlTemplate =
        this.dlTemplate = function f_dlTemplate($name, $async) {
            $async = typeof $async !== 'undefined' ? $async : true;
            
            if (!_dlTemplate.tmpl_cache) {
                _dlTemplate.tmpl_cache = {};
            }
            
            if ($async) {
                
                var defer = Q.defer();
            }
            else {
                
                var r = '';
            }
            
            if (!_dlTemplate.tmpl_cache[$name]) {
                
                $.ajax({
                    url: '?SWMGUI&path=partials/' + $name + '.jtp',
                    method: 'GET',
                    async: $async
                })
                .success(function ($r) {
                    
                    _dlTemplate.tmpl_cache[$name] = $r;
                    if ($async) {
                        
                        defer.resolve($r);
                    }
                    else {
                        
                        r = $r;
                    }
                })
                .error(function ($e) {
                    
                    if ($async) {
                        
                        defer.reject($e);
                    }
                });
            }
            else {
                
                if ($async) {
                    
                    defer.resolve(_dlTemplate.tmpl_cache[$name]);
                }
                else {
                    
                    r = _dlTemplate.tmpl_cache[$name];
                }
            }
            
            if ($async) {
                
                return defer.promise;
            }
            else {
                
                return r;
            }
        };
    })();
})();