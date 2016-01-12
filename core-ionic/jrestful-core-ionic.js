(function (angular, undefined) {
  
  "use strict";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var config = function ($injector) {
    // no-op
  };
  
  /**
   * Called in a run block, $injector belongs to the calling module.
   */
  var run = function ($injector) {
    
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
    
  };
  
  /**
   * jrestful.core.ionic module, requires <code>jrestul.core</code>.
   */
  angular.module("jrestful.core.ionic", ["jrestful.core"])

  /**
   * Initializer, extends <code>jrestfulProvider</code> <code>config</code> method to be called in a configuration block, and
   * <code>jrestfulProvider</code> <code>run</code> method to be called in a run block.
   */
  .config(["jrestfulProvider",
  function (jrestfulProvider) {
    jrestfulProvider.$extend(config, run);
  }]);
  
})(angular);
