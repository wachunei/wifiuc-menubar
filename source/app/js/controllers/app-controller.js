/* global angular, app, dialog, BrowserWindow */
/* jshint esversion:6 */

angular.module('WifiUCApp')
  .controller('AppController', function($location, localStorageService) {
    let _this = this;
    if (localStorageService.get('validUser')) {
      $location.path('/devices');
    } else {
      $location.path('/login');
    }

    _this.closeWindow = function() {
      BrowserWindow.getFocusedWindow().hide();
    };

    _this.quit = function() {
      let quitResult = dialog.showMessageBox({
        type: 'question',
        buttons: ['Cancelar', 'Cerrar Wifi UC'],
        cancelId: 0,
        defaultId: 1,
        title: 'Cerrar Wifi UC',
        message: `¿Estás seguro que quieres cerrar la aplicación?`
      });
      if (quitResult) {
        app.quit();
      }
    };
  });
