(function(angular, undefined) {
  
  "use strict";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var config = function($injector) {
    // no-op
  };
  
  /**
   * Called in a run block, $injector belongs to the calling module.
   */
  var run = function($injector) {
    
    var Security = $injector.has("Security") ? $injector.get("Security") : {};
    var $rootScope = $injector.get("$rootScope");
    var Access = $injector.get("Access");
    var $location = $injector.get("$location");
    
    if (!Security.auth || !Security.auth.unauthorizedPath || !Security.auth.forbiddenPath) {
      throw new Error("Security.auth must have following properties: unauthorizedPath, forbiddenPath");
    }
    
    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      if (error == Access.UNAUTHORIZED) {
        $location.path(Security.auth.unauthorizedPath);
      } else if (error == Access.FORBIDDEN) {
        $location.path(Security.auth.forbiddenPath);
      }
    });
    
  };
  
  /**
   * jrestfulAuth module, requires <code>jrestulCore</code>.
   */
  angular.module("jrestfulAuth", ["jrestfulCore"])
  
  /**
   * Encapsulates the current user to implement the <code>hasRole</code>, <code>hasAnyRole</code>, <code>isAnonymous</code> and
   * <code>isAuthenticated</code> methods.
   */
  .factory("UserProfile", ["$q", "User",
  function($q, User) {
  
    var userProfile = {};
    
    var fetchUserProfile = function() {
      var deferred = $q.defer();
      User.profile(function(response) {
        
        deferred.resolve(angular.extend(userProfile, response, {
          
          $refresh: fetchUserProfile,
          
          $hasRole: function(role) {
            return userProfile.roles.indexOf(role) >= 0;
          },
    
          $hasAnyRole: function(roles) {
            return !!userProfile.roles.filter(function(role) {
              return roles.indexOf(role) >= 0;
            }).length;
          },
    
          $isAnonymous: function() {
            return userProfile.anonymous;
          },
    
          $isAuthenticated: function() {
            return !userProfile.anonymous;
          }
          
        }));
        
      });
      return deferred.promise;
    };
  
    return fetchUserProfile();
  
  }])
  
  /**
   * Resolves or rejects a promise depending on the current user profile.
   */
  .factory("Access", ["$q", "UserProfile",
  function($q, UserProfile) {
  
    var Access = {
  
      OK: 200,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
  
      hasRole: function(role) {
        var deferred = $q.defer();
        UserProfile.then(function(userProfile) {
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
  
      hasAnyRole: function(roles) {
        var deferred = $q.defer();
        UserProfile.then(function(userProfile) {
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
  
      isAnonymous: function() {
        var deferred = $q.defer();
        UserProfile.then(function(userProfile) {
          if (userProfile.$isAnonymous()) {
            deferred.resolve(Access.OK);
          } else {
            deferred.reject(Access.FORBIDDEN);
          }
        });
        return deferred.promise;
      },
  
      isAuthenticated: function() {
        var deferred = $q.defer();
        UserProfile.then(function(userProfile) {
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
   * Initializer, extends <code>jrestfulProvider</code> <code>config</code> method to be called in a configuration block, and
   * <code>jrestfulProvider</code> <code>run</code> method to be called in a run block.
   */
  .config(["jrestfulProvider",
  function(jrestfulProvider) {
    jrestfulProvider.$extend(config, run);
  }]);
  
})(angular);
