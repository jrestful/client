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
    
    var Security = $injector.has("Security") ? $injector.get("Security") : {};
    var $rootScope = $injector.get("$rootScope");
    var Access = $injector.get("Access");
    var $state = $injector.get("$state");
    
    if (!Security.auth || !Security.auth.unauthorizedState || !Security.auth.forbiddenState) {
      throw new Error("Security.auth must have following properties: unauthorizedState, forbiddenState");
    }
    
    $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
      if (error == Access.UNAUTHORIZED) {
        $state.go(Security.auth.unauthorizedState);
      } else if (error == Access.FORBIDDEN) {
        $state.go(Security.auth.forbiddenState);
      }
    });
    
  };
  
  /**
   * jrestful.auth module, requires <code>jrestul.core</code>.
   */
  angular.module("jrestful.auth", ["jrestful.core"])
  
  /**
   * Encapsulates the current user profile to implement the <code>$hasRole</code>, <code>$hasAnyRole</code>, <code>$isAnonymous</code>,
   * <code>$isAuthenticated</code> and <code>$refresh</code> methods.
   */
  .factory("UserProfile", ["$q", "$rootScope", "$log", "Auth", "ZZ",
  function ($q, $rootScope, $log, Auth, ZZ) {
  
    var _userProfile = {};
    
    var fetchUserProfile = function () {
      var _deferred = $q.defer();
      Auth.getProfile(function (response) {
        
        ZZ(_userProfile).clear();
        
        _deferred.resolve(angular.extend(_userProfile, response, {
          
          $refresh: fetchUserProfile,
          
          $hasRole: function (role) {
            return _userProfile.roles.indexOf(role) >= 0;
          },
    
          $hasAnyRole: function (roles) {
            return !!_userProfile.roles.filter(function (role) {
              return roles.indexOf(role) >= 0;
            }).length;
          },
    
          $isAnonymous: function () {
            return _userProfile.anonymous;
          },
    
          $isAuthenticated: function () {
            return !_userProfile.anonymous;
          }
          
        }));
        
        $log.debug("User profile fetched");
        $rootScope.$broadcast("userProfileFetched", _userProfile);
        
      }, function () {
        _deferred.reject();
      });
      return _deferred.promise;
    };
  
    return fetchUserProfile();
  
  }])
  
  /**
   * Resolves or rejects a promise depending on the current user profile.
   */
  .factory("Access", ["$q", "UserProfile",
  function ($q, UserProfile) {
  
    var Access = {
  
      OK: 200,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
  
      hasRole: function (role) {
        var deferred = $q.defer();
        UserProfile.then(function (userProfile) {
          if (userProfile.$hasRole(role)) {
            deferred.resolve(Access.OK);
          } else if (userProfile.$isAnonymous()) {
            deferred.reject(Access.UNAUTHORIZED);
          } else {
            deferred.reject(Access.FORBIDDEN);
          }
        });
        return deferred.promise;
      },
  
      hasAnyRole: function (roles) {
        var deferred = $q.defer();
        UserProfile.then(function (userProfile) {
          if (userProfile.$hasAnyRole(roles)) {
            deferred.resolve(Access.OK);
          } else if (userProfile.$isAnonymous()) {
            deferred.reject(Access.UNAUTHORIZED);
          } else {
            deferred.reject(Access.FORBIDDEN);
          }
        });
        return deferred.promise;
      },
  
      isAnonymous: function () {
        var deferred = $q.defer();
        UserProfile.then(function (userProfile) {
          if (userProfile.$isAnonymous()) {
            deferred.resolve(Access.OK);
          } else {
            deferred.reject(Access.FORBIDDEN);
          }
        });
        return deferred.promise;
      },
  
      isAuthenticated: function () {
        var deferred = $q.defer();
        UserProfile.then(function (userProfile) {
          if (userProfile.$isAuthenticated()) {
            deferred.resolve(Access.OK);
          } else {
            deferred.reject(Access.UNAUTHORIZED);
          }
        });
        return deferred.promise;
      }
  
    };
  
    return Access;
  
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
