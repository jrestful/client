(function (global, factory, undefined) {
  
  "use strict";
  
  if (typeof global.define === "function" && global.define.amd) {
    
    global.require(["angular"], factory, function (error) {
      
      for (var i = 0, n = error.requireModules.length; i < n; i++) {
        var missingDependency = error.requireModules[i];
        if (missingDependency === "angular") {
          throw new Error("angular required for jrestful.core.ionic (expected module name: angular)");
        } else {
          global.requirejs.undef(missingDependency);
          global.define(missingDependency, [], function () {
            return undefined;
          });
        }
      }
      
      global.require(["angular"], factory);
      
    });
    
  } else {
    if (typeof global.angular === "undefined") {
      throw new Error("angular required for jrestful-core");
    } else {
      factory(global.angular);
    }
  }
  
})(this, function (angular, undefined) {
  
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

    $injector.get("BackgroundMusic").$bootstrap();
    
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
  .factory("Popup", ["$ionicPopup", "$q", "$rootScope", "ZZ",
  function ($ionicPopup, $q, $rootScope, ZZ) {
    
    var _alert = function (title, content, scope, okType) {
      var popup;
      var options = {
        title: title,
        scope: angular.extend($rootScope.$new(), {
          close: function () {
            popup.close();
          }
        }, scope),
        okType: okType
      };
      if (ZZ(content).endsWith(".html")) {
        options.templateUrl = content;
      } else {
        options.template = content;
      }
      popup = $ionicPopup.alert(options);
      return popup;
    };
    
    var _confirm = function (title, content, scope, okType) {
      var deferred = $q.defer();
      var popup;
      var options = {
        title: title,
        scope: angular.extend($rootScope.$new(), {
          close: function () {
            popup.close();
          }
        }, scope),
        okType: okType
      };
      if (ZZ(content).endsWith(".html")) {
        options.templateUrl = content;
      } else {
        options.template = content;
      }
      popup = $ionicPopup.confirm(options);
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
    
    if (!navigator || !navigator.connection || !navigator.connection.type || !Connection) {
      throw new Error("cordova-plugin-network-information required for InternetConnection");
    }
    
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
   * Handles background music, requires cordova-plugin-media plugin.
   */
  .provider("BackgroundMusic", [
  function () {
    
    var MUTE_ENTRY = "bm.mute";
    
    var _source;
    
    return {
      
      setSource: function (source) {
        if (typeof Media !== "function") {
          throw new Error("cordova-plugin-media required for BackgroundMusic");
        }
        _source = source;
      },
      
      $get: ["$log", "LocalRepository",
      function ($log, LocalRepository) {
        
        var _media;
        var _muted = LocalRepository.has(MUTE_ENTRY);
        var _repeatInfinitely = true;
        
        var _assertInitialized = function () {
          if (!_media) {
            throw new Error("BackgroundMusic not initialized, use BackgroundMusicProvider.setSource(mediaFilePath) in a config block");
          }
        };
        
        document.addEventListener("pause", function () {
          _repeatInfinitely = false;
          if (_media && !_muted) {
            _media.pause();
          }
        }, false);
        
        document.addEventListener("resume", function () {
          _repeatInfinitely = true;
          if (_media && !_muted) {
            _media.play();
          }
        }, false);
        
        return {
          
          $bootstrap: function () {
            if (_source) {
              $log.debug("Loading " + _source);
              _media = new Media(_source, angular.noop, function (error) {
                $log.debug("An error occurred with media " + _source + ": " + error);
              }, function (status) {
                if (_repeatInfinitely && status == Media.MEDIA_STOPPED) {
                  $log.debug("Media " + _source + " ended, starting again");
                  _media.play();
                }
              });
              if (!_muted) {
                _media.play();
              }
            }
          },
          
          mute: function () {
            _assertInitialized();
            if (!LocalRepository.has(MUTE_ENTRY)) {
              $log.debug("Muting background music (" + _source + ")");
              LocalRepository.set(MUTE_ENTRY, 1);
              _muted = true;
              _media.pause();
            }
          },
          
          unmute: function () {
            _assertInitialized();
            if (LocalRepository.has(MUTE_ENTRY)) {
              $log.debug("Unmuting background music (" + _source + ")");
              LocalRepository.remove(MUTE_ENTRY);
              _muted = false;
              _media.play();
            }
          },
          
          isPlaying: function () {
            _assertInitialized();
            return !_muted;
          }
          
        };
        
      }]
      
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
  
});
