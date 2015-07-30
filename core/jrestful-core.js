(function(angular) {
    
  "use strict";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var config = function($injector) {
    
    var Security = $injector.has("Security") ? $injector.get("Security") : {};
    var $httpProvider = $injector.get("$httpProvider");
    
    $httpProvider.defaults.headers.common["Accept"] = "application/hal+json";
    
    if (Security.csrf) {
      
      if (!Security.csrf.headerName || !Security.csrf.cookieName) {
        throw "Security.csrf must have following properties: headerName, cookieName";
      }
      
      $httpProvider.defaults.xsrfHeaderName = Security.csrf.headerName;
      $httpProvider.defaults.xsrfCookieName = Security.csrf.cookieName;
      
      var uuid = function(e){ return e?(e^Math.random()*16>>e/4).toString(16):([1e7]+ -1e3+ -4e3+ -8e3+ -1e11).replace(/[018]/g,uuid); }
      
      $httpProvider.interceptors.push(function() {
        return {
          request: function(config) {
            document.cookie = Security.csrf.cookieName + "=" + uuid();
            return config;
          }
        };
      });
      
    }
    
  };
  
  /**
   * Called in a run block, $injector belongs to the calling module.
   */
  var run = function($injector) {
    // no-op
  };
  
  /**
   * jrestfulCore module, requires <code>ngResource</code>.
   */
  angular.module("jrestfulCore", ["ngResource"])
  
  /**
   * Extends $resource:
   * <ul>
   * <li>The <code>query</code> method is not expecting an array anymore</li>
   * <li>New <code>create</code> and <code>update</code> methods (respectively <code>POST</code> and <code>PUT</code>)</li>
   * <li>The <code>save</code> method delegates to <code>create</code> or <code>update</code> methods,
   *     depending on whether the resource has an <code>id</code> property.</li>
   * </ul>
   */
  .factory("RestResource", ["$resource",
  function($resource) {
    
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
    
  }])

  /**
   * Initializer, provides a <code>config</code> method to be called in a configuration block,
   * and a <code>run</code> method to be called in a run block.
   */
  .provider("jrestful", [function() {
    
    return {
      config: config,
      $get: function() {
        return {
          run: run
        }
      }
    }
    
  }]);
  
})(angular);
