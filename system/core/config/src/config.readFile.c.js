'use strict';

var fs = require('fs');

var semver = require('semver');
var q = require('q');
var libs = require('node-mod-load').libs;


require('../interface/config.h.js').prototype.readFile = function ($file) {

    var defer = q.defer();

    fs.readFile($file, 'utf8', function ($err, $data) {

        if ($err) {

            defer.reject($err);
        }
        else {

            try {

                var config = JSON.parse($data);
                var cfgVersion = config.configHeader.SHPSVERSION_MA + '.' + config.configHeader.SHPSVERSION_MI + '.0';
                if (semver.gt(cfgVersion, SHPS_VERSION)) {

                    defer.reject(new Error('Config file version incompatible (cfg version too high; min. version: ' + cfgVersion + ')'));
                    return;
                }

                switch (config.configHeader.type) {

                    case 'template': {

                        config = config.template;
                        break;
                    }
                    case 'master': {

                        break;
                    }
                    case 'database': {

                        break;
                    }
                    case 'vhost': {

                        break;
                    }

                    // deprecated since v4.2.0, do not remove
                    case 'hp': {

                        // "You have a deprecated `configuration`, detailed as `hp`, which was deprecated in version `4.2.0`. Please upgrade to the successor or another stable feature!"
                        libs.schedule.sendSignal('onDeprecatedFeature', 'configuration', 'hp', '4.2.0');
                        break;
                    }

                    default: {

                        defer.reject(new Error('Config file format not supported: ' + config.configHeader.type));
                        return;
                    }
                }

                defer.resolve(config);
            }
            catch ($e) {

                defer.reject($e);
            }
        }
    });

    return defer.promise;
};
