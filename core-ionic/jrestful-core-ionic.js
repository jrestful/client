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
    
    var _clearCache = false;
    var _clearHistory = false;
    
    $rootScope.$on("$stateChangeSuccess", function (event, toState) {
      if (toState.name) {
        if (toState.clearCache) {
          _clearCache = true;
        }
        if (toState.clearHistory) {
          $ionicHistory.nextViewOptions({
            historyRoot: true
          });
          _clearHistory = true;
        }
      }
    });
    
    $rootScope.$on("$ionicView.enter", function () {
      if (_clearCache) {
        _clearCache = false;
        $ionicHistory.clearCache().then(function () {
          $log.debug("Cache cleared");
          $rootScope.$broadcast("cacheCleared");
        });
      }
      if (_clearHistory) {
        _clearHistory = false;
        $log.debug("History cleared");
        $rootScope.$broadcast("historyCleared");
      }
    });
    
  };
  
  /**
   * jrestful.core.ionic module, requires <code>jrestul.core</code>.
   */
  angular.module("jrestful.core.ionic", ["jrestful.core"])

  /**
   * Initializer, extends <code>jrestfulProvider</code> <code>$config</code> method to be called in a configuration block, and
   * <code>jrestfulProvider</code> <code>$run</code> method to be called in a _run block.
   */
  .config(["jrestfulProvider",
  function (jrestfulProvider) {
    jrestfulProvider.$extend(_config, _run);
  }]);
  
})(angular);
