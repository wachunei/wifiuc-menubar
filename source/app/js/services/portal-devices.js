/* global angular, _, cheerio */
/* jshint esversion:6 */

angular.module('WifiUCApp')
  .factory('PortalDevices',
    function($http, $q, localStorageService) {
      let _this = this;
      const PORTAL_HOST = 'https://portal.uc.cl';
      const MAC_HOST = PORTAL_HOST + '/LPT028_RegistroMac';
      const URL = {
        login: 'https://sso.uc.cl/cas/login?service=' +
          'https%3A%2F%2Fportal.uc.cl%2Fc%2Fportal%2Flogin',
        logout: PORTAL_HOST + '/c/portal/logout',
        render: PORTAL_HOST + '/c/portal/render_portlet?p_l_id=10229&p_p_id=' +
          'RegistroMac_WAR_LPT028_RegistroMac_INSTANCE_L0Zr&p_p_lifecycle=0&' +
          'p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=1&' +
          'p_p_col_count=2&currentURL=%2Fweb%2Fhome-community%2Finicio',
        getMacList: MAC_HOST + '/GetListaMac_controller',
        edit: MAC_HOST + '/EditarRegistroMac_controller',
        remove: MAC_HOST + '/EliminarRegistroMac_controller',
        add: MAC_HOST + '/AgregarRegistroMac_controller'
      };

      let reqTransform = function(obj) {
        var str = [];
        for (var p in obj) {
          if (!obj.hasOwnProperty(p)) {
            continue;
          }

          str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }

        return str.join('&');
      };

      let reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      let reqConfig = {
        withCredentials: true,
        headers: reqHeaders,
        transformRequest: reqTransform
      };

      let portalErrorPromise = function(response) {
        let deferred = $q.defer();
        let $ = cheerio.load(response.data);
        if ($('.exito').length) {
          deferred.resolve();
        } else {
          deferred.reject({
            error: $('.error').text(),
            portalError: true
          });
        }

        return deferred.promise;
      };

      let logInPortal = function() {
        let username = localStorageService.get('username');
        let password = localStorageService.get('password');

        let paramsSuccess = function(response) {
          let execution;
          let lt;
          let dataObj;
          let parser = new DOMParser();
          let responseDom = parser.parseFromString(
            response.data, 'text/html');

          if (responseDom.querySelectorAll('input[name=execution]')
            .length > 0) {
            execution = responseDom.querySelector('input[name=execution]')
              .getAttribute('value');
            lt = responseDom.querySelector('input[name=lt]')
              .getAttribute('value');
            dataObj = {
              lt, execution, username, password,
              _eventId: 'submit',
              submit: 'Iniciar Sesión'
            };

            let loginPost = $http.post(
              URL.login,
              dataObj,
              _.extend(response.config, reqConfig)
            );
            return loginPost;
          }
        };

        return $http.get(URL.login)
          .then(paramsSuccess)
          .then(function() {
            return $http.post(
              URL.render,
              {},
              reqConfig
            );
          });
      };

      _this.getDevices = function() {
        let devices = [];
        return logInPortal()
        .then(function(response) {
          return $http.post(
            URL.getMacList,
            {},
            _.extend(response.config, reqConfig)
          );
        })
        .then(function(response) {
          var success = $q.defer();
          let $ = cheerio.load(response.data);
          if ($('.listaRegMac').length === 0) {
            return _this.getDevices();
          } else {
            $('.listaRegMac tr[id^=registro_]').each(function(i, el) {
              void(i);
              devices.push({
                name: $(el).find('td div[id^=nombreReg]').text(),
                mac: $(el).find('td div[id^=macReg]').text()
                  .split('-').join('').toLowerCase()
              });
            });
          }

          success.resolve(devices || []);

          return success.promise;

        },

        function() {
          let rejected = $q.defer();
          rejected.reject();
          return rejected.promise;
        });
      };

      _this.editDevice = function(newDevice, oldName) {
        return logInPortal()
          .then(function(response) {
            return $http.post(
              URL.edit,
              {
                macAntes: newDevice.mac,
                macDespues: newDevice.mac,
                nombreDispositivoAntes: oldName,
                nombreDispositivoDespues: newDevice.name
              },
              _.extend(response.config, reqConfig)
            );
          });
      };

      _this.removeDevice = function(device) {
        return logInPortal()
          .then(function(response) {
            return $http.post(
              URL.remove,
              {
                mac: device.mac
              },
              _.extend(response.config, reqConfig)
            );
          }).then(portalErrorPromise);
      };

      _this.addDevice = function(device) {
        return logInPortal()
          .then(function(response) {
            return $http.post(
              URL.add,
              {
                mac: device.mac,
                nombreDispositivo: device.name
              },
              _.extend(response.config, reqConfig)
            );
          }).then(portalErrorPromise);
      };

      _this.logout = function() {
        return $http.post(URL.logout);
      };

      return _this;
    }
  );
