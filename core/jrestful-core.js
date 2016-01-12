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
   * Strings utilities.
   */
  .factory("StringUtils", [
  function () {
    return {
      
      startsWith: function (haystack, needle) {
        return haystack.lastIndexOf(needle, 0) === 0;
      },
      
      endsWith: function (haystack, needle) {
        return haystack.substr(-needle.length) === needle;
      },
      
      fromDate: function (date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
      },
    
      toDate: function (string) {
        var year = parseInt(string.substring(0, 4), 10);
        var month = parseInt(string.substring(4, 6), 10) - 1;
        var day = parseInt(string.substring(6, 8), 10);
        return new Date(year, month, day);
      },
      
      hash: function (input) {
        var output = 0;
        for (var i = 0; i < input.length; i++) {
          var c = input.charCodeAt(i);
          output = ((output << 5) - output) + c;
          output |= 0;
        }
        return output;
      }
      
    };
  }])
  
  /**
   * Extends $resource:
   * <ul>
   * <li>The <code>query</code> method is not expecting an array anymore.</li>
   * <li>New <code>create</code>, <code>update</code> and <code>remove</code> methods (respectively <code>POST</code>, <code>PUT</code> and <code>DELETE</code>).</li>
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
        update: { method: "PUT" },
        remove: { method: "DELETE" }
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
   * <li><code>$links(rel)</code> method that returns an array of objects defined in #2.</li>
   * <li><code>$embedded()</code> method that returns the embedded resources after having handled their links as defined in #2 and #4.</li>
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
   * Abstraction layer for the local storage, handles weak entries.
   */
  .provider("LocalRepository", [
  function () {
  
    var VERSION_ENTRY_NAME = "v";
    var DEFAULT_VERSION = "-1";
    var version = DEFAULT_VERSION;
    
    var PREFIX = "lr.";
    var FIRST_ENTRY_POINTER_NAME = "f";
    var PREVIOUS_ENTRY_POINTER_SUFFIX = ".p";
    var NEXT_ENTRY_POINTER_SUFFIX = ".n";
    var LAST_ENTRY_POINTER_NAME = "l";
    
    var DATE_ENTRY_SUFFIX = ".d";
    var DEFAULT_CACHE_LIFETIME_IN_DAYS = 30;
    var cacheLifetimeInDays = DEFAULT_CACHE_LIFETIME_IN_DAYS;
    
    var StringUtils;
    var firstEntryPointer;
    var lastEntryPointer;
  
    var Entry = function (id) {
      if (StringUtils.startsWith(id, PREFIX)) {
        this.pristineId = id.substring(3);
        this.id = id;
      } else {
        this.pristineId = id;
        this.id = PREFIX + id;
      }
    };
    
    Entry.prototype = {
    
      isCache: function () {
        return this.dateEntry().exists();
      },
      
      isObsolete: function () {
        return this.isCache() && Math.round((StringUtils.toDate(StringUtils.fromDate(new Date())) - StringUtils.toDate(this.dateEntry().pristineGet())) / (1000 * 60 * 60 * 24)) > cacheLifetimeInDays;
      },
      
      toString: function () {
        return this.id;
      },
      
      exists: function () {
        return localStorage.getItem(this) !== null;
      },
      
      previousPointer: function () {
        return new EntryPointer(this + PREVIOUS_ENTRY_POINTER_SUFFIX);
      },
      
      nextPointer: function () {
        return new EntryPointer(this + NEXT_ENTRY_POINTER_SUFFIX);
      },
      
      dateEntry: function () {
        return new Entry(this + DATE_ENTRY_SUFFIX);
      },
      
      pristineRemove: function () {
        localStorage.removeItem(this);
        return this;
      },
      
      pristineGet: function () {
        return localStorage.getItem(this);
      },
      
      pristineSet: function (value) {
        if (value instanceof EntryPointer) {
          value = value.asEntry();
        }
        if (value instanceof Entry) {
          value = value.pristineId;
        }
        var done = false;
        do {
          try {
            localStorage.setItem(this, value);
            done = true;
          } catch (e) {
            if (!this.removeOldestCacheEntry()) {
              throw e;
            }
          }
        } while (!done);
        return this;
      },
      
      removeOldestCacheEntry: function () {
        var removed = false;
        if (firstEntryPointer.exists()) {
          firstEntryPointer.asEntry().remove();
          removed = true;
        }
        return removed;
      },
      
      get: function () {
        var entry = this.pristineGet();
        if (this.exists()) {
          entry = angular.fromJson(entry);
          if (this.isCache()) {
            this.set(entry, true);
          }
        }
        return entry;
      },
      
      set: function (value, cache) {
        if (this.exists()) {
          this.remove();
        }
        if (cache) {
          if (!firstEntryPointer.exists()) {
            firstEntryPointer.pristineSet(this);
          }
          if (lastEntryPointer.exists()) {
            var lastEntry = lastEntryPointer.asEntry();
            lastEntry.nextPointer().pristineSet(this);
            this.previousPointer().pristineSet(lastEntry);
          }
          lastEntryPointer.pristineSet(this);
          this.dateEntry().pristineSet(StringUtils.fromDate(new Date()));
        }
        this.pristineSet(angular.toJson(value));
        return value;
      },
      
      remove: function () {
        var entry = this.pristineGet();
        if (this.exists()) {
          entry = angular.fromJson(entry);
          if (this.isCache()) {
            var previousEntryPointer = this.previousPointer();
            var nextEntryPointer = this.nextPointer();
            if (previousEntryPointer.exists()) {
              if (nextEntryPointer.exists()) {
                previousEntryPointer.asEntry().nextPointer().pristineSet(nextEntryPointer);
                nextEntryPointer.asEntry().previousPointer().pristineSet(previousEntryPointer);
                previousEntryPointer.pristineRemove();
                nextEntryPointer.pristineRemove();
              } else {
                lastEntryPointer.pristineSet(previousEntryPointer);
                lastEntryPointer.asEntry().nextPointer().pristineRemove();
                previousEntryPointer.pristineRemove();
              }
            } else if (nextEntryPointer.exists()) {
              firstEntryPointer.pristineSet(nextEntryPointer);
              firstEntryPointer.asEntry().previousPointer().pristineRemove();
              nextEntryPointer.pristineRemove();
            } else {
              firstEntryPointer.pristineRemove();
              previousEntryPointer.pristineRemove();
              nextEntryPointer.pristineRemove();
              lastEntryPointer.pristineRemove();
            }
          }
          this.dateEntry().pristineRemove();
          this.pristineRemove();
        }
        return entry;
      }
      
    };
    
    var EntryPointer = function (id) {
      Entry.call(this, id);
    };  
    EntryPointer.prototype = Object.create(Entry.prototype);
    EntryPointer.prototype.constructor = EntryPointer;
    
    angular.extend(EntryPointer.prototype, {
    
      asEntry: function () {
        return new Entry(this.pristineGet());
      }
      
    });
    
    var API = {
        
      has: function (id) {
        return new Entry(id).exists();
      },
      
      set: function (id, value, cache) {
        if (id === VERSION_ENTRY_NAME || id === FIRST_ENTRY_POINTER_NAME || id === LAST_ENTRY_POINTER_NAME) {
          throw new Error("Reserved identifiers: '" + VERSION_ENTRY_NAME + "', '" + FIRST_ENTRY_POINTER_NAME + "', '" + LAST_ENTRY_POINTER_NAME + "'");
        } else if (StringUtils.startsWith(id, PREFIX)) {
          throw new Error("Reserved prefixes: '" + PREFIX + "'");
        } else if (StringUtils.endsWith(id, PREVIOUS_ENTRY_POINTER_SUFFIX) || StringUtils.endsWith(id, NEXT_ENTRY_POINTER_SUFFIX) || StringUtils.endsWith(id, DATE_ENTRY_SUFFIX)) {
          throw new Error("Reserved suffixes: '" + PREVIOUS_ENTRY_POINTER_SUFFIX + "', '" + NEXT_ENTRY_POINTER_SUFFIX + "', '" + DATE_ENTRY_SUFFIX + "'");
        }
        return new Entry(id).set(value, cache);
      },
      
      remove: function (id) {
        return new Entry(id).remove();
      },
      
      get: function (id) {
        return new Entry(id).get();
      },
      
      clearCache: function () {
        while (firstEntryPointer.exists() && firstEntryPointer.asEntry().isObsolete()) {
          firstEntryPointer.asEntry().remove();
        }
      },
      
      clear: function () {
        var count = 0;
        var i = 0;
        while (i < localStorage.length) {
          var id = localStorage.key(i);
          if (StringUtils.startsWith(id, PREFIX) && id !== versionEntry.id) {
            localStorage.removeItem(id);
            count++;
          } else {
            i++;
          }
        }
        return count;
      }
    
    };
    
    var init = function (newStringUtils) {
      StringUtils = newStringUtils;
      firstEntryPointer = new EntryPointer(FIRST_ENTRY_POINTER_NAME);
      lastEntryPointer = new EntryPointer(LAST_ENTRY_POINTER_NAME);
    };
    
    return {
    
      setVersion: function (newVersion) {
        version = newVersion;
      },
      
      setCacheLifetimeInDays: function (newCacheLifetimeInDays) {
        cacheLifetimeInDays = newCacheLifetimeInDays;
      },
    
      $get: ["StringUtils",
      function (StringUtils) {
        init(StringUtils);
        var versionEntry = new Entry(VERSION_ENTRY_NAME);
        if (!versionEntry.exists() || versionEntry.pristineGet() !== version) {
          localStorage.clear();
          versionEntry.pristineSet(version);
        } else {
          API.clearCache();
        }
        return API;
      }]
      
    };
  
  }])
  
  /**
   * Caches images data URLs in the local storage.
   */
  .factory("ImageCache", ["$q", "LocalRepository", "StringUtils",
  function ($q, LocalRepository, StringUtils) {
    
    var getDataUrl = function (imageUrl, imageType, imageQuality) {
      var deferred = $q.defer();
      var image = new Image();
      image.crossOrigin = "anonymous";
      image.onerror = function () {
        deferred.reject();
      };
      image.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        canvas.getContext("2d").drawImage(this, 0, 0);
        deferred.resolve(canvas.toDataURL(imageType, imageQuality));
      };
      image.src = imageUrl;
      return deferred.promise;
    };
    
    return {
      
      has: function (imageUrl) {
        return LocalRepository.has(StringUtils.hash(imageUrl));
      },
      
      get: function (imageUrl) {
        return LocalRepository.get(StringUtils.hash(imageUrl));
      },
      
      cache: function (imageUrl, imageType, imageQuality) {
        return getDataUrl(imageUrl, imageType, imageQuality).then(function (dataUrl) {
          LocaRepository.set(StringUtils.hash(imageUrl), dataUrl, true);
          return dataUrl;
        });
      }
      
    };
    
  }])

  /**
   * Initializer, provides a <code>$config</code> method to be called in a configuration block,
   * and a <code>$run</code> method to be called in a run block.
   */
  .provider("jrestful", [
  function () {
    
    return {
      
      $extend: function (extendedConfig, extendedRun) {
        
        if (typeof extendedConfig === "function") {
          var originalConfig = this.$config;
          this.$config = function ($injector) {
            originalConfig($injector);
            extendedConfig($injector);
          };
        }
        
        if (typeof extendedRun === "function") {
          var originalRun = this.$get().$run;
          this.$get = function () {
            return {
              $run: function ($injector) {
                originalRun($injector);
                extendedRun($injector);
              }
            };
          };
        }
        
      },
      
      $config: config,
      
      $get: function () {
        return {
          $run: run
        };
      }
      
    };
    
  }]);
  
})(angular);
