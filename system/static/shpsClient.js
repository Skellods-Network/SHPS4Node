"use strict";

var SHPS = function() f_SHPS {

  if (CryptoJS == null) {

    throw 'CryptoJS missing!';
  }

  var request = function f_SHPS_request() {

    this.ajax = function f_SHPS_request_ajax() {


    };
  };

  if (jQuery != null) {

    request = jQuery;
  }

  var apiGet = function f_SHPS_apiGet($param, $value, $cb) {

    request.ajax({

      'URL': v_SHPSURL + v_SHPSURLcp + 'api',
      'type': 'POST',
      $param: $value,
      'error': function($e) {

        $cb({status:'error', message:$e});
      },
      'success': function($e) {

        $cb($e);
      }
    });
  }

  var getContent =
  this.getContent = function f_SHPS_getContent($name, $onDone) {

    return apiGet('content', $name, $onDone);
  };

  var getTemplate =
  this.getTemplate = function f_SHPS_getTemplate($name, $onDone) {

    return apiGet('template', $name, $onDone);
  };

  var login =
  this.login = function f_SHPS_login($user, $pass) {

    return apiGet('login', $user + ':' + CryptoJS.SHA3($pass), $onDone);
  };


  var request =
  this.request = function f_SHPS_request($name, $param, $onDone) {

    'URL': v_SHPSURL + v_SHPSURLcp + 'request=' + $name,
      'type': 'POST',
      $param: $value,
      'error': function($e) {

        $cb({status:'error', message:$e});
      },
      'success': function($e) {

        $cb($e);
      }
    });
  };


}