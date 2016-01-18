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
      
      startsWith: function (haystack) {
        for (var i = 1; i < arguments.length; i++) {
          if (haystack.lastIndexOf(arguments[i], 0) === 0) {
            return true;
          }
        }
        return false;
      },
      
      endsWith: function (haystack) {
        for (var i = 1; i < arguments.length; i++) {
          if (haystack.substr(-arguments[i].length) === arguments[i]) {
            return true;
          }
        }
        return false;
      },
      
      is: function (haystack) {
        for (var i = 1; i < arguments.length; i++) {
          if (haystack === arguments[i]) {
            return true;
          }
        }
        return false;
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
        return output.toString();
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
    
    var WEAK_ENTRIES_DATE_ENTRY_SUFFIX = ".d";
    var DEFAULT_WEAK_ENTRIES_LIFETIME_IN_DAYS = 30;
    var weakEntriesLifetimeInDays = DEFAULT_WEAK_ENTRIES_LIFETIME_IN_DAYS;
    
    var ENTRY_PREFIX = "lr.";
    var FIRST_WEAK_ENTRY_POINTER_NAME = "f";
    var PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX = ".p";
    var NEXT_WEAK_ENTRY_POINTER_SUFFIX = ".n";
    var LAST_WEAK_ENTRY_POINTER_NAME = "l";

    var $log;
    var StringUtils;
    var versionEntry;
    var firstWeakEntryPointer;
    var lastWeakEntryPointer;
  
    var Entry = function (key) {
      if (StringUtils.startsWith(key, ENTRY_PREFIX)) {
        this.pristineKey = key.substring(ENTRY_PREFIX.length);
        this.key = key;
      } else {
        this.pristineKey = key;
        this.key = ENTRY_PREFIX + key;
      }
    };

    Entry.prototype = {
      
      toString: function () {
        return this.key;
      },
      
      isUserAccessible: function () {
        return this.exists();
      },
      
      exists: function () {
        return localStorage.getItem(this) !== null;
      },
      
      remove: function () {
        localStorage.removeItem(this);
      },
      
      getString: function () {
        return localStorage.getItem(this);
      },
      
      setString: function (value) {
        if (value instanceof Entry.Weak.Pointer) {
          value = value.getPointedWeakEntry();
        }
        if (value instanceof Entry) {
          value = value.pristineKey;
        }
        var done = false;
        do {
          try {
            localStorage.setItem(this, value);
            done = true;
          } catch (e) {
            if (Entry.Weak.removeOldest()) {
              $log.debug("Local storage quota exceeded when setting '" + this + "', oldest weak entry has been removed");
            } else {
              throw e;
            }
          }
        } while (!done);
      },
      
      getObject: function () {
        var value = this.getString();
        if (this.exists()) {
          value = angular.fromJson(value);
        }
        return value;
      },
      
      setObject: function (value) {
        this.setString(angular.toJson(value));
      }
      
    };

    Entry.create = function (key, weak) {
      if (StringUtils.is(key, VERSION_ENTRY_NAME, FIRST_WEAK_ENTRY_POINTER_NAME, LAST_WEAK_ENTRY_POINTER_NAME)) {
        throw new Error("Reserved keys: '" + VERSION_ENTRY_NAME + "', '" + FIRST_WEAK_ENTRY_POINTER_NAME + "', '" + LAST_WEAK_ENTRY_POINTER_NAME + "'");
      } else if (StringUtils.startsWith(key, ENTRY_PREFIX)) {
        throw new Error("Reserved prefixes: '" + ENTRY_PREFIX + "'");
      } else if (StringUtils.endsWith(key, PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX, NEXT_WEAK_ENTRY_POINTER_SUFFIX, WEAK_ENTRIES_DATE_ENTRY_SUFFIX)) {
        throw new Error("Reserved suffixes: '" + PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX + "', '" + NEXT_WEAK_ENTRY_POINTER_SUFFIX + "', '" + WEAK_ENTRIES_DATE_ENTRY_SUFFIX + "'");
      }
      return weak ? new Entry.Weak(key) : new Entry(key);
    };

    Entry.find = function (key) {
      if (StringUtils.startsWith(key, ENTRY_PREFIX)) {
        return new Entry.Transient(key);
      } else if (StringUtils.is(key, VERSION_ENTRY_NAME)) {
        return new Entry.Version(key);
      } else if (StringUtils.is(key, FIRST_WEAK_ENTRY_POINTER_NAME, LAST_WEAK_ENTRY_POINTER_NAME) || StringUtils.endsWith(key, PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX, NEXT_WEAK_ENTRY_POINTER_SUFFIX)) {
        return new Entry.Weak.Pointer(key);
      } else if (StringUtils.endsWith(key, WEAK_ENTRIES_DATE_ENTRY_SUFFIX)) {
        return new Entry.Weak.Date(key);
      } else {
        var entry = new Entry.Weak(key);
        if (!entry.getDateEntry().exists()) {
          entry = new Entry(key);
        }
        return entry;
      }
    };
    
    Entry.Transient = function (key) {
      Entry.call(this, key);
    };
    Entry.Transient.prototype = Object.create(Entry.prototype);
    Entry.Transient.prototype.constructor = Entry.Transient;
    
    angular.extend(Entry.Transient.prototype, {
      
      exists: function () {
        return false;
      }
      
    });

    Entry.Weak = function (key) {
      Entry.call(this, key);
    };  
    Entry.Weak.prototype = Object.create(Entry.prototype);
    Entry.Weak.prototype.constructor = Entry.Weak;

    angular.extend(Entry.Weak.prototype, {
          
      isObsolete: function () {
        return Math.round((StringUtils.toDate(StringUtils.fromDate(new Date())) - StringUtils.toDate(this.getDateEntry().getString())) / (1000 * 60 * 60 * 24)) > weakEntriesLifetimeInDays;
      },
      
      getPreviousWeakEntryPointer: function () {
        return new Entry.Weak.Pointer(this + PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX);
      },
      
      getNextWeakEntryPointer: function () {
        return new Entry.Weak.Pointer(this + NEXT_WEAK_ENTRY_POINTER_SUFFIX);
      },
      
      getDateEntry: function () {
        return new Entry.Weak.Date(this + WEAK_ENTRIES_DATE_ENTRY_SUFFIX);
      },
      
      getObject: function (setAsLastWeakEntry) {
        var value = Entry.prototype.getObject.call(this);
        if (setAsLastWeakEntry && this.exists()) {
          this.setObject(value, true);
        }
        return value;
      },
      
      setObject: function (value) {
        if (this.exists()) {
          this.remove();
        }
        if (!firstWeakEntryPointer.exists()) {
          firstWeakEntryPointer.setString(this);
        }
        if (lastWeakEntryPointer.exists()) {
          var lastWeakEntry = lastWeakEntryPointer.getPointedWeakEntry();
          lastWeakEntry.getNextWeakEntryPointer().setString(this);
          this.getPreviousWeakEntryPointer().setString(lastWeakEntry);
        }
        lastWeakEntryPointer.setString(this);
        this.getDateEntry().setString(StringUtils.fromDate(new Date()));
        Entry.prototype.setObject.call(this, value);
      },
      
      remove: function () {
        if (this.exists()) {
          var previousEntryPointer = this.getPreviousWeakEntryPointer();
          var nextEntryPointer = this.getNextWeakEntryPointer();
          if (previousEntryPointer.exists()) {
            if (nextEntryPointer.exists()) {
              previousEntryPointer.getPointedWeakEntry().getNextWeakEntryPointer().setString(nextEntryPointer);
              nextEntryPointer.getPointedWeakEntry().getPreviousWeakEntryPointer().setString(previousEntryPointer);
              previousEntryPointer.remove();
              nextEntryPointer.remove();
            } else {
              lastWeakEntryPointer.setString(previousEntryPointer);
              lastWeakEntryPointer.getPointedWeakEntry().getNextWeakEntryPointer().remove();
              previousEntryPointer.remove();
            }
          } else if (nextEntryPointer.exists()) {
            firstWeakEntryPointer.setString(nextEntryPointer);
            firstWeakEntryPointer.getPointedWeakEntry().getPreviousWeakEntryPointer().remove();
            nextEntryPointer.remove();
          } else {
            firstWeakEntryPointer.remove();
            previousEntryPointer.remove();
            nextEntryPointer.remove();
            lastWeakEntryPointer.remove();
          }
          this.getDateEntry().remove();
        }
        Entry.prototype.remove.call(this);
      }
      
    });

    Entry.Weak.removeOldest = function () {
      var removed = false;
      if (firstWeakEntryPointer.exists()) {
        firstWeakEntryPointer.getPointedWeakEntry().remove();
        removed = true;
      }
      return removed;
    };

    Entry.Weak.Date = function (key) {
      Entry.call(this, key);
    };  
    Entry.Weak.Date.prototype = Object.create(Entry.prototype);
    Entry.Weak.Date.prototype.constructor = Entry.Weak.Date;

    angular.extend(Entry.Weak.Date.prototype, {

      isUserAccessible: function () {
        return false;
      }
      
    });

    Entry.Version = function (key) {
      Entry.call(this, key);
    };  
    Entry.Version.prototype = Object.create(Entry.prototype);
    Entry.Version.prototype.constructor = Entry.Version;

    angular.extend(Entry.Version.prototype, {

      isUserAccessible: function () {
        return false;
      }
      
    });
        
    Entry.Weak.Pointer = function (key) {
      Entry.call(this, key);
    };  
    Entry.Weak.Pointer.prototype = Object.create(Entry.prototype);
    Entry.Weak.Pointer.prototype.constructor = Entry.Weak.Pointer;

    angular.extend(Entry.Weak.Pointer.prototype, {

      isUserAccessible: function () {
        return false;
      },

      getPointedWeakEntry: function () {
        return new Entry.Weak(this.getString());
      }
      
    });

    var API = {
        
      has: function (key) {
        return Entry.find(key).isUserAccessible();
      },
      
      set: function (key, value, weak) {
        Entry.create(key, weak).setObject(value);
      },
      
      remove: function (key) {
        var entry = Entry.find(key);
        if (entry.isUserAccessible()) {
          entry.remove();
        }
      },
      
      get: function (key) {
        var entry = Entry.find(key);
        if (entry.isUserAccessible()) {
          return entry.getObject(true);
        }
      },
      
      clearObsoleteWeakEntries: function () {
        while (firstWeakEntryPointer.exists() && firstWeakEntryPointer.getPointedWeakEntry().isObsolete()) {
          firstWeakEntryPointer.getPointedWeakEntry().remove();
        }
      },
      
      clear: function () {
        var count = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (startsWith(key, ENTRY_PREFIX) && key !== versionEntry.key) {
            localStorage.removeItem(key);
            count++;
            i--;
          }
        }
        return count;
      },
      
      forEach: function (callback) {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (StringUtils.startsWith(key, ENTRY_PREFIX)) {
            var entry = Entry.find(key.substring(ENTRY_PREFIX.length));
            if (entry.isUserAccessible()) {
              callback(entry.pristineKey, entry.getObject(false));
            }
          }
        }
      }

    };
    
    var init = function (new$log, newStringUtils) {
      $log = new$log;
      StringUtils = newStringUtils;
      versionEntry = new Entry.Version(VERSION_ENTRY_NAME);
      firstWeakEntryPointer = new Entry.Weak.Pointer(FIRST_WEAK_ENTRY_POINTER_NAME);
      lastWeakEntryPointer = new Entry.Weak.Pointer(LAST_WEAK_ENTRY_POINTER_NAME);
      if (!versionEntry.exists() || versionEntry.getString() !== version) {
        localStorage.clear();
        versionEntry.setString(version);
        $log.debug("LocalRepository initialized to version '" + version + "'");
      } else {
        API.clearObsoleteWeakEntries();
      }
    };
    
    return {
    
      setVersion: function (newVersion) {
        version = newVersion;
      },
      
      setWeakEntriesLifetimeInDays: function (newWeakEntriesLifetimeInDays) {
        weakEntriesLifetimeInDays = newWeakEntriesLifetimeInDays;
      },
    
      $get: ["$log", "StringUtils",
      function ($log, StringUtils) {
        init($log, StringUtils);
        return API;
      }]
      
    };
  
  }])
  
  /**
   * Caches images data URLs in the local storage.
   */
  .factory("ImageCache", ["$q", "$log", "LocalRepository", "StringUtils",
  function ($q, $log, LocalRepository, StringUtils) {
    
    // TODO LocalRepository should handle ENTRY_PREFIX as a reserved prefix
    var ENTRY_PREFIX = "ic.";
    
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
        return LocalRepository.has(ENTRY_PREFIX + StringUtils.hash(imageUrl));
      },
      
      get: function (imageUrl) {
        return LocalRepository.get(ENTRY_PREFIX + StringUtils.hash(imageUrl));
      },
      
      cache: function (imageUrl, weak, imageType, imageQuality) {
        return getDataUrl(imageUrl, imageType, imageQuality).then(function (dataUrl) {
          $log.debug("Image '" + imageUrl + "' cached");
          LocalRepository.set(ENTRY_PREFIX + StringUtils.hash(imageUrl), dataUrl, weak);
          return dataUrl;
        });
      },
      
      clear: function () {
        var keys = [];
        LocalRepository.forEach(function (key) {
          if (StringUtils.startsWith(key, ENTRY_PREFIX)) {
            keys.push(key);
          }
        });
        angular.forEach(keys, function (key) {
          LocalRepository.remove(key);
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
