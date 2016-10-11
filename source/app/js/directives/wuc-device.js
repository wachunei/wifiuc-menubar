/* global angular */
/* jshint esversion:6 */

angular.module('WifiUCApp')
  .directive('wucDevice', function() {
    return {
      restrict: 'E',
      scope: {
        device: '='
      },
      templateUrl: '../templates/wuc-device.html'
    };
  });

angular.module('WifiUCApp')
  .filter('macAddress', function() {
    return function(plainMac) {
      return plainMac.match(new RegExp('.{1,2}', 'g')).join('-').toUpperCase();
    };
  });
