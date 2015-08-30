(function(angular, undefined) {
    
  "use strict";
  
  var CONTENT_TYPE_HEADER = "Content-Type",
      HAL_MEDIA_TYPE = "application/hal+json";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var config = function($injector) {
    
    var Security = $injector.has("Security") ? $injector.get("Security") : {};
    var $httpProvider = $injector.get("$httpProvider");
    
    $httpProvider.defaults.headers.common["Accept"] = HAL_MEDIA_TYPE;
    
    $httpProvider.interceptors.push("RestInterceptor");
    
    if (Security.csrf) {
      
      if (!Security.csrf.headerName || !Security.csrf.cookieName) {
        throw new Error("Security.csrf must have following properties: headerName, cookieName");
      }
      
      $httpProvider.defaults.xsrfHeaderName = Security.csrf.headerName;
      $httpProvider.defaults.xsrfCookieName = Security.csrf.cookieName;
      
      // credits to https://gist.github.com/jed/982883:
      var uuid = function(e){ return e ? (e ^ Math.random() * 16 >> e/4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid); };
      
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
   * <li>The <code>query</code> method is not expecting an array anymore.</li>
   * <li>New <code>create</code> and <code>update</code> methods (respectively <code>POST</code> and <code>PUT</code>).</li>
   * <li>The <code>save</code> method delegates to <code>create</code> or <code>update</code> methods, depending on whether the resource has an
   * <code>id</code> property.</li>
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
   * Intercepts HAL responses, adds:
   * <ol>
   * <li><code>$link(rel)</code> method that returns an object with:
   * <ul>
   * <li><code>fetch(attributeName)</code> method, where <code>attributeName</code> is defaulted to <code>"href"</code>.</li>
   * <li><code>get(attributeName)</code> method.</li>
   * </ul>
   * </li>
   * <li><code>$links(rel)</code> method that returns an array of objects defined in #1.</li>
   * </ol>
   */
  .factory("RestInterceptor", ["$injector",
  function($injector) {
    
    var linkFactory = function(rel, link) {
      return {
        
        // TODO factorize fetch and get functions
        
        fetch: function(attributeName) {
          attributeName = attributeName || "href";
          if (link.hasOwnProperty(attributeName)) {
            return $injector.get("$http").get(link[attributeName]);            
          } else {
            throw new Error("Attribute '" + attributeName + "' of link '" + rel + "' not found");
          }
        },
        
        get: function(attributeName) {
          attributeName = attributeName || "href";
          if (link.hasOwnProperty(attributeName)) {
            return link[attributeName];
          } else {
            throw new Error("Attribute '" + attributeName + "' of link '" + rel + "' not found");
          }
        }
        
      };
    };
    
    return {
      
      response: function(response) {
        
        var contentType = response.headers(CONTENT_TYPE_HEADER);
        if (contentType && contentType.indexOf(HAL_MEDIA_TYPE) >= 0) {
          
          var data = response.data;
          
          data.$link = function(rel) {
            if (data._links.hasOwnProperty(rel) && !angular.isArray(data._links[rel])) {
              return linkFactory(rel, data._links[rel]);
            } else {
              throw new Error("Link '" + rel + "' not found");
            }
          };
          
          data.$links = function(rel) {
            if (data._links.hasOwnProperty(rel) && angular.isArray(data._links[rel])) {
              return data._links[rel].map(function(link, i) {
                return linkFactory(rel + "[" + i + "]", link);
              });
            } else {
              throw new Error("Links '" + rel + "' not found");
            }
          };
          
          // TODO add an $embedded function
          
        }
        return response;
      }
    
    };
  }])

  /**
   * Initializer, provides a <code>config</code> method to be called in a configuration block, and a <code>run</code> method to be called in a run
   * block.
   */
  .provider("jrestful", [
  function() {
    
    return {
      
      $extend: function(config, run) {
        
        if (typeof config === "function") {
          var callfront = this.config;
          this.config = function($injector) {
            callfront($injector);
            config($injector);
          };
        }
        
        if (typeof run === "function") {
          var callfront = this.$get().run;
          this.$get = function() {
            return {
              run: function($injector) {
                callfront($injector);
                run($injector);
              }
            };
          };
        }
        
      },
      
      config: config,
      
      $get: function() {
        return {
          run: run
        };
      }
      
    };
    
  }]);
  
})(angular);
