(function (global, factory, undefined) {
  
  "use strict";
  
  if (typeof global.define === "function" && global.define.amd) {
    
    global.require(["angular"], factory, function (error) {
      
      for (var i = 0, n = error.requireModules.length; i < n; i++) {
        var missingDependency = error.requireModules[i];
        if (missingDependency === "angular") {
          throw new Error("angular required for jrestful.auth (expected module name: angular)");
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
    
    var _fetchUserProfile = function () {
      return Auth.getProfile(function (response) {
        
        ZZ(_userProfile).clear();
        
        angular.extend(_userProfile, response, {
          
          $refresh: _fetchUserProfile,
          
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
          
        });
        
        $log.debug("User profile fetched");
        $rootScope.$broadcast("userProfileFetched", _userProfile);
        
        return _userProfile;
        
      });
    };
  
    return _fetchUserProfile();
  
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
        return UserProfile.then(function (userProfile) {
          if (userProfile.$hasRole(role)) {
            return Access.OK;
          } else if (userProfile.$isAnonymous()) {
            return $q.reject(Access.UNAUTHORIZED);
          } else {
            return $q.reject(Access.FORBIDDEN);
          }
        });
      },
  
      hasAnyRole: function (roles) {
        return UserProfile.then(function (userProfile) {
          if (userProfile.$hasAnyRole(roles)) {
            return Access.OK;
          } else if (userProfile.$isAnonymous()) {
            return $q.reject(Access.UNAUTHORIZED);
          } else {
            return $q.reject(Access.FORBIDDEN);
          }
        });
      },
  
      isAnonymous: function () {
        return UserProfile.then(function (userProfile) {
          if (userProfile.$isAnonymous()) {
            return Access.OK;
          } else {
            return $q.reject(Access.FORBIDDEN);
          }
        });
      },
  
      isAuthenticated: function () {
        return UserProfile.then(function (userProfile) {
          if (userProfile.$isAuthenticated()) {
            return Access.OK;
          } else {
            return $q.reject(Access.UNAUTHORIZED);
          }
        });
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
  
});
