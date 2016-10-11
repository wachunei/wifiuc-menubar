/* global angular */
/* jshint esversion:6 */
angular.module('WifiUCApp', ['ngRoute', 'ngCookies', 'LocalStorageModule'])
  .config(function(localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('WifiUCAppStorage');
  });
