(function (angular, undefined) {
  
  "use strict";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var _config = function ($injector) {
    // no-op
  };
  
  /**
   * Called in a _run block, $injector belongs to the calling module.
   */
  var _run = function ($injector) {
    
    var $rootScope = $injector.get("$rootScope");
    var $ionicHistory = $injector.get("$ionicHistory");
    var $log = $injector.get("$log");
    
    var clearCache = false;
    var clearHistory = false;
    
    $rootScope.$on("$stateChangeSuccess", function (event, toState) {
      if (toState.name) {
        if (toState.clearCache) {
          clearCache = true;
        }
        if (toState.clearHistory) {
          $ionicHistory.nextViewOptions({
            historyRoot: true
          });
          clearHistory = true;
        }
      }
    });
    
    $rootScope.$on("$ionicView.enter", function () {
      if (clearCache) {
        clearCache = false;
        $ionicHistory.clearCache().then(function () {
          $log.debug("Cache cleared");
          $rootScope.$broadcast("cacheCleared");
        });
      }
      if (clearHistory) {
        clearHistory = false;
        $log.debug("History cleared");
        $rootScope.$broadcast("historyCleared");
      }
    });
    
    var $ionicPlatform = $injector.get("$ionicPlatform");
    var History = $injector.get("History");
    
    $ionicPlatform.registerBackButtonAction(function () {
      History.goBack();
    }, 101);
    
  };
  
  /**
   * jrestful.core.ionic module, requires <code>jrestul.core</code>.
   */
  angular.module("jrestful.core.ionic", ["jrestful.core"])
  
  /**
   * Allows to short-circuit $ionicHistory.
   */
  .factory("History", ["$ionicHistory", "$rootScope",
  function ($ionicHistory, $rootScope) {
    
    var _history = {};
    
    $rootScope.$on("historyCleared", function () {
      _history = {};
    });
    
    return {
      
      push: function (value) {
        var currentStateName = $ionicHistory.currentStateName();
        if (!_history.hasOwnProperty(currentStateName)) {
          _history[currentStateName] = [value];
        } else {
          _history[currentStateName].push(value);
        }
      },
      
      goBack: function () {
        var currentStateName = $ionicHistory.currentStateName();
        if (_history.hasOwnProperty(currentStateName)) {
          var stateHistory = _history[currentStateName];
          stateHistory.pop()();
          if (!stateHistory.length) {
            delete _history[currentStateName];
          }
        } else if (!$ionicHistory.backView()) {
          ionic.Platform.exitApp();
        } else {
          $ionicHistory.goBack();
        }
      }
      
    };
    
  }])
  
  /**
   * Utility based on $ionicLoading that displays an overlay to indicate activity while blocking user interaction.
   */
  .factory("LoadingOverlay", ["$ionicLoading", "$rootScope",
  function ($ionicLoading, $rootScope) {
    
    var _loading = false;
    $rootScope.loading = false;
    
    return {
      
      show: function (flagRootScope) {
        if (typeof flagRootScope === "undefined") {
          flagRootScope = true;
        }
        if (!_loading) {
          $ionicLoading.show({
            template: '<ion-spinner icon="spiral" class="spinner-light"></ion-spinner>',
            hideOnStateChange: true
          });
          _loading = true;
          if (flagRootScope) {
            $rootScope.loading = true;
          }
        }
      },
      
      hide: function () {
        if (_loading) {
          $ionicLoading.hide();
          _loading = false;
          $rootScope.loading = false;
        }
      }
      
    };
    
  }])
  
  /**
   * Utility based on $ionicPopup to display popups.
   */
  .factory("Popup", ["$ionicPopup", "$q", "$rootScope",
  function ($ionicPopup, $q, $rootScope) {
    
    var _alert = function (title, content, scope, okType) {
      var popup = $ionicPopup.alert({
        title: title,
        template: content,
        scope: angular.extend($rootScope.$new(), {
          close: function () {
            popup.close();
          }
        }, scope),
        okType: okType
      });
      return popup;
    };
    
    var _confirm = function (title, content, scope, okType) {
      var deferred = $q.defer();
      var popup = $ionicPopup.confirm({
        title: title,
        template: content,
        scope: angular.extend($rootScope.$new(), {
          close: function () {
            popup.close();
          }
        }, scope),
        okType: okType
      });
      deferred.promise.close = popup.close;
      popup.then(function (confirmed) {
        if (confirmed) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      });
      return deferred.promise;
    };
    
    return {
      
      error: function (title, content, scope) {
        return _alert(title, content, scope, "button-assertive");
      },
      
      warning: function (title, content, scope) {
        return _alert(title, content, scope, "button-energized");
      },
      
      info: function (title, content, scope) {
        return _alert(title, content, scope, "button-calm");
      },
      
      success: function (title, content, scope) {
        return _alert(title, content, scope, "button-balanced");
      },
      
      confirmDanger: function (title, content, scope) {
        return _confirm(title, content, scope, "button-assertive");
      },
      
      confirmInfo: function (title, content, scope) {
        return _confirm(title, content, scope, "button-balanced");
      }
      
    };
  }])
  
  /**
   * Gets Internet connection information, requires cordova-plugin-network-information plugin.
   */
  .factory("InternetConnection", [
  function () {
    
    var _onConnectionLostCallback;
    var _onConnectionRetrievedCallback;
    
    return {
      
      onConnectionLost: function (callback) {
        if (_onConnectionLostCallback) {
          document.removeEventListener("offline", _onConnectionLostCallback, false);
        }
        _onConnectionLostCallback = callback;
        document.addEventListener("offline", _onConnectionLostCallback, false);
      },
      
      onConnectionRetrieved: function (callback) {
        if (_onConnectionRetrievedCallback) {
          document.removeEventListener("online", _onConnectionRetrievedCallback, false);
        }
        _onConnectionRetrievedCallback = callback;
        document.addEventListener("online", _onConnectionRetrievedCallback, false);
      },
      
      isConnected: function () {
        return navigator.connection.type != Connection.NONE;
      }
      
    };
    
  }])

  /**
   * Initializer, extends <code>jrestfulProvider</code> <code>$config</code> method to be called in a configuration block, and
   * <code>jrestfulProvider</code> <code>$run</code> method to be called in a _run block.
   */
  .config(["jrestfulProvider",
  function (jrestfulProvider) {
    jrestfulProvider.$extend(_config, _run);
  }]);
  
})(angular);
