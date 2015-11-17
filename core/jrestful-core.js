(function (angular, undefined) {
    
  "use strict";
  
  var CONTENT_TYPE_HEADER = "Content-Type",
      HAL_MEDIA_TYPE = "application/hal+json";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var config = function ($injector) {
    
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
      var uuid = function (e){ return e ? (e ^ Math.random() * 16 >> e/4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid); };
      
      $httpProvider.interceptors.push(function () {
        return {
          request: function (config) {
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
  var run = function ($injector) {
    // no-op
  };
  
  /**
   * jrestful.core module, requires <code>ngResource</code>.
   */
  angular.module("jrestful.core", ["ngResource"])
  
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
  function ($resource) {
    
    return function (url, paramDefaults, actions, options) {
      
      var extendedActions = {
        query: { method: "GET" },
        create: { method: "POST" },
        update: { method: "PUT" }
      };
      
      var RestResource = $resource(url, paramDefaults, angular.extend(extendedActions, actions), options);
      
      RestResource.prototype.$save = function () {
        var fn = this.id ? this.$update : this.$create;
        return fn.apply(this, arguments);
      };
      
      return RestResource;
      
    };
    
  }])
  
  /**
   * Intercepts HAL responses, adds:
   * <ol>
   * <li><code>$hasLink(rel)</code> method.</li>
   * <li><code>$link(rel)</code> method that returns an object with:
   * <ul>
   * <li><code>fetch(attr)</code> method, where <code>attr</code> is defaulted to <code>"href"</code>.</li>
   * <li><code>get(attr)</code> method, where <code>attr</code> is defaulted to <code>"href"</code>.</li>
   * </ul>
   * </li>
   * <li><code>$hasLinks(rel)</code> method.</li>
   * <li><code>$links(rel)</code> method that returns an array of objects defined in #1.</li>
   * <li><code>$embedded()</code> method that returns the embedded resources after having handled their links as defined in #1 and #2.</li>
   * </ol>
   */
  .factory("RestInterceptor", ["$injector",
  function ($injector) {
    
    var linkFactory = function (rel, link) {
      return {
        
        fetch: function (attr) {
          return this.get(attr, true);
        },
        
        get: function (attr, fetch) {
          attr = attr || "href";
          if (link.hasOwnProperty(attr)) {
            return fetch ? $injector.get("$http").get(link[attr]) : link[attr];
          } else {
            throw new Error("Attribute '" + attr + "' of link '" + rel + "' not found");
          }
        }
        
      };
    };
    
    var handleLinks = function (data) {
    
      var linkCache = {};
      var linksCache = {};
      
      data.$hasLink = function (rel) {
        return data._links.hasOwnProperty(rel) && !angular.isArray(data._links[rel]);
      };
      
      data.$link = function (rel) {
        if (!linkCache.hasOwnProperty(rel)) {
          if (data.$hasLink(rel)) {
            linkCache[rel] = linkFactory(rel, data._links[rel]);
          } else {
            throw new Error("Link '" + rel + "' not found");
          }
        }
        return linkCache[rel];
      };
      
      data.$hasLinks = function (rel) {
        return data._links.hasOwnProperty(rel) && angular.isArray(data._links[rel]);
      };
      
      data.$links = function (rel) {
        if (!linksCache.hasOwnProperty(rel)) {
          if (data.$hasLinks(rel)) {
            linksCache[rel] = data._links[rel].map(function (link, i) {
              return linkFactory(rel + "[" + i + "]", link);
            });
          } else {
            throw new Error("Links '" + rel + "' not found");
          }
        }
        return linksCache[rel];
      };
          
    };
    
    var handleEmbedded = function (data) {
      if (data._embedded) {
          
        var handled = false;
        data.$embedded = function () {
          if (!handled) {
            angular.forEach(data._embedded, function (data) {
              handleLinks(data);
            });
            handled = true;
          }
          return data._embedded;
        };
        
      }
    
    };
    
    return {
      
      response: function (response) {        
        var contentType = response.headers(CONTENT_TYPE_HEADER);
        if (contentType && contentType.indexOf(HAL_MEDIA_TYPE) >= 0) {
          handleLinks(response.data);
          handleEmbedded(response.data);
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
  function () {
    
    return {
      
      $extend: function (extendedConfig, extendedRun) {
        
        if (typeof extendedConfig === "function") {
          var originalConfig = this.config;
          this.config = function ($injector) {
            originalConfig($injector);
            extendedConfig($injector);
          };
        }
        
        if (typeof extendedRun === "function") {
          var originalRun = this.$get().run;
          this.$get = function () {
            return {
              run: function ($injector) {
                originalRun($injector);
                extendedRun($injector);
              }
            };
          };
        }
        
      },
      
      config: config,
      
      $get: function () {
        return {
          run: run
        };
      }
      
    };
    
  }]);
  
})(angular);
