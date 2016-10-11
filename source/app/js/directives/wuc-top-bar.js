/* global angular */
/* jshint esversion:6 */

angular.module('WifiUCApp')
  .directive('wucTopBar', function() {
    return {
      restrict: 'E',
      scope: {
        title: '@topBarTitle',
        currentUser: '='
      },
      templateUrl: '../templates/wuc-top-bar.html',
      transclude: true
    };
  });
