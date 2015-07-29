angular.module("jrestful-core", ["ngResource"])

.config(["$injector", "$httpProvider",
function($injector, $httpProvider) {
  
  $httpProvider.defaults.headers.common["Accept"] = "application/hal+json";
  
  if ($injector.has("Application")) {
    
    var Application = $injector.get("Application");
    
    $httpProvider.defaults.xsrfHeaderName = Application.CSRF.headerName;
    $httpProvider.defaults.xsrfCookieName = Application.CSRF.cookieName;
    
    var uuid = function(e){ return e?(e^Math.random()*16>>e/4).toString(16):([1e7]+ -1e3+ -4e3+ -8e3+ -1e11).replace(/[018]/g,uuid); }
    
    $httpProvider.interceptors.push(function() {
      return {
        request: function(config) {
          document.cookie = Application.CSRF.cookieName + "=" + uuid();
          return config;
        }
      };
    });
    
  }
  
}])

.factory("RestResource", ["$resource",
function($resource) {
  
  "use strict";
  
  return function(url, paramDefaults, actions, options) {
    
    var extendedActions = {
      query: { method: "GET" },
      create: { method: "POST" },
      update: { method: "PUT" }
    };
    
    var RestResource = $resource(url, paramDefaults, angular.extend(extendedActions, actions), options);
    
    RestResource.prototype.$save = function() {
      var fn = this.id ? this.$update : this.$create;
      return fn.apply(this, arguments);
    };
    
    return RestResource;
    
  };
  
}]);
