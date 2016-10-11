/* global angular */
/* jshint esversion:6 */
angular.module('WifiUCApp').config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'AppController as app',
      templateUrl: '../templates/wuc-loading.html'
    })
    .when('/login', {
      controller: 'LoginController as app',
      templateUrl: '../templates/wuc-login.html'
    })
    .when('/devices', {
      controller: 'DevicesController as app',
      templateUrl: '../templates/wuc-devices.html'
    });
}]);
