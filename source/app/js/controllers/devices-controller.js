/* global angular, dialog, _*/
/* jshint esversion:6 */
angular.module('WifiUCApp')
  .controller('DevicesController', function(
      $scope, $location, $filter, $q, $timeout,
      localStorageService, PortalDevices) {
    var _this = this;
    if (!localStorageService.get('validUser')) {
      $location.path('/');
    }

    const MSG = {
      activateError: 'Hubo un error al intentar activar este dispositivo',
      deactivateError: 'Hubo un error al intentar desactivar este dispositivo',
      deleteError: 'Hubo un error al intentar eliminar este dispositivo',
      updateError: 'Hubo un error al actualizar los dispositivos',
      alreadyExists: 'Ya existe dispositivo con esa MAC',
      logoutError: 'Hubo un error al intentar cerrar sesión'
    };

    $scope.localDevices = localStorageService.get('devices') || [];
    $scope.currentUser = localStorageService.get('username');
    $scope.barTitle = 'Dispositivos';
    $scope.deviceList = [];
    $scope.isLoading = true;
    $scope.isEditing = false;
    $scope.editingModel = {};
    $scope.formAction = null;
    $scope.deviceFormAlert = null;
    $scope.macRegex = /^([0-9a-fA-F]{2}[:-]?){5}([0-9a-fA-F]{2})$/;

    _this.updateDevices = function() {
      $scope.isLoading = true;
      let portalListPromise = PortalDevices.getDevices();
      portalListPromise.then(function(portalDevices) {
        let updatedDevices = [];
        portalDevices.forEach(function(portalDevice) {
          let localMatch = _.findWhere($scope.localDevices,
            _.pick(portalDevice, 'mac'));
          if (localMatch) {
            updatedDevices.push(_.extend(localMatch, {
              name: portalDevice.name,
              active: true
            }));
          } else {
            updatedDevices.push(_.extend(portalDevice, { active: true }));
          }
        });

        $scope.localDevices.forEach(function(localDevice) {
          let localMatch = _.findWhere(
            updatedDevices,
            _.pick(localDevice, 'mac'));
          if (!localMatch) {
            updatedDevices.push(_.extend(localDevice, { active: false }));
          }
        });

        $scope.localDevices = updatedDevices;
        _this.saveLocalDevices();
      },

      function() {
        _this.showAlert(MSG.updateError);
      }).finally(() => { $scope.isLoading = false; });
    };

    _this.updateDevices();

    $scope.formatMac = function() {
      if ($scope.editingModel.mac) {
        $scope.editingModel.mac = $filter('macAddress')
          ($scope.editingModel.mac.replace(/-|:/g, ''));
      }
    };

    _this.addDevice = function() {
      if ($scope.isLoading) {
        return;
      }

      $scope.formAction = 'add';
      $scope.barTitle = 'Agregar Dispositivo';
      $scope.isEditing = true;
    };

    _this.processAddDevice = function(newDevice) {
      let deferred = $q.defer();
      let exists = _.findWhere($scope.localDevices, _.pick(newDevice, 'mac'));
      if (exists) {
        deferred.reject(MSG.alreadyExists);
      } else {
        $scope.localDevices.push(newDevice);
        _this.saveLocalDevices();
        deferred.resolve('Success!');
      }

      return deferred.promise;
    };

    $scope.toggleStatus = function(device) {
      $scope.deviceLoading = device.mac;
      if (device.active) {
        PortalDevices.removeDevice(device)
          .then(function() {
            let index = _.indexOf(
              _.pluck($scope.localDevices, 'mac'),
              device.mac
            );
            $scope.localDevices[index].active = false;
          },

          (response) => {
            _this.showAlert(response.portalError ?
              response.error || MSG.deactivateError : MSG.deactivateError);
          }).finally(() => { $scope.deviceLoading = null; });
      } else {
        PortalDevices.addDevice(device)
          .then(function() {
            let index = _.indexOf(
              _.pluck($scope.localDevices, 'mac'),
              device.mac
            );
            $scope.localDevices[index].active = true;
          },

          (response) => {
            _this.showAlert(response.portalError ?
              response.error || MSG.activateError : MSG.activateError);
          }).finally(() => { $scope.deviceLoading = null; });
      }
    };

    $scope.editDevice = function(device) {
      $scope.originalEditingModel = device;
      $scope.editingModel = _.clone(_.pick(device, 'name', 'mac', 'active'));
      $scope.editingModel.mac = $filter('macAddress')($scope.editingModel.mac);
      $scope.formAction = 'edit';
      $scope.barTitle = 'Editar Dispositivo';
      $scope.isEditing = true;
    };

    _this.processEditDevice = function(newDevice) {
      let deferred = $q.defer();

      if (newDevice.active) {
        return PortalDevices.editDevice(newDevice,
          $scope.originalEditingModel.name)
          .then(
            function() {
              let success = $q.defer();
              $scope.originalEditingModel.name = newDevice.name;
              _this.saveLocalDevices();
              success.resolve();
              return success;
            },

            function(response) {
              let rejected = $q.defer();
              rejected.reject(response.statusText);
              return rejected.promise;
            }
          );
      } else {
        $scope.originalEditingModel.name = newDevice.name;
        _this.saveLocalDevices();
        deferred.resolve();
      }

      return deferred.promise;
    };

    $scope.removeDevice = function(device) {
      let removeResult = dialog.showMessageBox({
        type: 'question',
        buttons: ['Cancelar', `Eliminar ${device.name}`],
        cancelId: 0,
        defaultId: 1,
        title: 'Eliminar Dispositivo',
        message:
          `¿Estás seguro que quieres eliminar el dispositivo ${device.name}?`
      });

      if (removeResult) {
        if (device.active) {
          $scope.isLoading = true;
          PortalDevices.removeDevice(device)
          .then(
            function() {
              console.log('removeSucces');
              let index = _.indexOf(
                _.pluck($scope.localDevices, 'mac'),
                device.mac
              );

              $scope.localDevices.splice(index, 1);
            },

            function() {
              _this.showAlert(MSG.deleteError);
            }
          ).finally(() => { $scope.isLoading = false;});
        } else {
          $scope.localDevices = _.reject($scope.localDevices,
            (el) => el.mac === device.mac);
        }

        _this.saveLocalDevices();
      }

    };

    $scope.resetForm = function() {
      $scope.formAction = null;
      $scope.originalEditingModel = {};
      $scope.editingModel = {};
      $scope.isEditing = false;
      $scope.isLoading = false;
      $scope.formLoading = false;
      $scope.deviceFormAlert = null;
      $scope.barTitle = 'Dispositivos';
    };

    $scope.clearFormAlert = () => { $scope.deviceFormAlert = null;};

    $scope.processFormAction = function() {
      $scope.formLoading = true;
      let formModel = _.clone($scope.editingModel);
      formModel.mac = formModel.mac.split('-').join('').toLowerCase();
      let processPromise;
      if ($scope.formAction === 'add') {
        processPromise = _this.processAddDevice(formModel);
      } else if ($scope.formAction === 'edit') {
        processPromise = _this.processEditDevice(formModel);
      }

      processPromise.then(
        () => { $scope.resetForm(); },

        function rejected(reason) {
          $scope.deviceFormAlert = reason;
          $scope.formLoading = false;
        }
      ).finally(() => {$scope.isLoading = false;});
    };

    $scope.$watch('localDevices', function() {
      $scope.localDevices = _.sortBy($scope.localDevices,
        (device) => device.active === false);
    }, true);

    _this.showAlert = function(message) {
      $timeout.cancel($scope.currentAlert);
      $scope.devicesAlertMessage = message;
      $scope.devicesAlert = true;
      $scope.currentAlert = $timeout(() => {
        $scope.devicesAlert = false; }, 2500);
    };

    _this.saveLocalDevices = () => {
      localStorageService.set('devices', $scope.localDevices);
    };

    _this.logout = function() {
      let logoutResult = dialog.showMessageBox({
        type: 'warning',
        buttons: ['Cancelar', 'Cerrar Sesión'],
        defaultId: 1,
        cancelId: 0,
        title: 'Cerrar Sesión',
        message: `Al cerrar sesión olvidaremos todos tus dispositivos no activos.

¿Estás seguro que quieres cerrar sesión?`
      });
      if (logoutResult) {
        PortalDevices.logout()
          .then(function() {
            localStorageService.clearAll();
            $scope.portalList = [];
            $location.path('/');
          },

          (error) => {
            _this.showAlert(error || MSG.logoutError);
          });
      }
    };

    require('electron').ipcRenderer.on('after-show', () => {
      if ($location.path() === '/devices') {
        _this.updateDevices();
      }
    });

  });
