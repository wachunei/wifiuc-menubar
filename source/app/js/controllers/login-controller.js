/* global angular */
/* jshint esversion:6 */
angular.module('WifiUCApp')
  .controller('LoginController', function($scope, $http,
    $location, localStorageService) {
    let _this = this;

    _this.cleanUsername = function() {
      if ($scope.credentials.username.length > 0) {
        let userInput = $scope.credentials.username;
        let ucSuffix = '@uc.cl';
        let index = userInput.indexOf(
            ucSuffix,
            userInput.length - ucSuffix.length
        );
        if (index !== -1) {
          $scope.credentials.username = userInput.substr(0, index);
        }
      }
    };

    _this.cleanAlert = function() {
      $scope.loginAlert = false;
    };

    _this.login = function() {
      $scope.loadingForm = true;
      $http.post(
        'http://webcurso.uc.cl/direct/session',
        {},
        {
          params: {
            _username: $scope.credentials.username,
            _password: $scope.credentials.password
          }
        }
      ).then(
        function successfulLogin() {
          localStorageService.set('validUser', true);
          localStorageService.set('username', $scope.credentials.username);
          localStorageService.set('password', $scope.credentials.password);
          $location.path('/devices');
        },

        function failedLogin() {
          $scope.loginAlert = true;
        }
      ).finally(function() {
        $scope.loadingForm = false;
      });
    };

  });
