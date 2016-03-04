(function (angular, undefined) {
    
  "use strict";
  
  var CONTENT_TYPE_HEADER = "Content-Type",
      HAL_MEDIA_TYPE = "application/hal+json";
  
  /**
   * Called in a configuration block, $injector belongs to the calling module.
   */
  var _config = function ($injector) {
    
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
    
    if ($injector.has("$animateProvider")) {
      $injector.get("$animateProvider").classNameFilter(/^(?!.*\bjrf-disable-ng-animate\b)/);
    }
    
  };
  
  /**
   * Called in a run block, $injector belongs to the calling module.
   */
  var _run = function ($injector) {
    // no-op
  };
  
  /**
   * jrestful.core module, requires <code>ngResource</code>.
   */
  angular.module("jrestful.core", ["ngResource"])
  
  /**
   * Utilities.
   */
  .factory("ZZ", ["$log",
  function ($log) {

    var _zzAny = function (e) {
      this.e = e;
    };
    
    _zzAny.prototype = {
    
      isDefined: function () {
        return typeof this.e !== "undefined";
      },
    
      is: function () {
        var needles = Array.isArray(arguments[0]) ? arguments[0] : arguments;
        for (var i = 0; i < needles.length; i++) {
          if (this.e === needles[i]) {
            return true;
          }
        }
        return false;
      },
      
      get: function () {
        return this.e;
      }
      
    };
  
    var _zzString = function (e) {
      _zzAny.call(this, e);
    };
    _zzString.prototype = Object.create(_zzAny.prototype);
    _zzString.prototype.constructor = _zzString;
    
    angular.extend(_zzString.prototype, {
    
      startsWith: function () {
        var prefixes = Array.isArray(arguments[0]) ? arguments[0] : arguments;
        for (var i = 0; i < prefixes.length; i++) {
          if (this.e.lastIndexOf(prefixes[i], 0) === 0) {
            return true;
          }
        }
        return false;
      },
      
      endsWith: function () {
        var prefixes = Array.isArray(arguments[0]) ? arguments[0] : arguments;
        for (var i = 0; i < prefixes.length; i++) {
          if (this.e.substr(-prefixes[i].length) === prefixes[i]) {
            return true;
          }
        }
        return false;
      },
      
      contains: function () {
        var needles = Array.isArray(arguments[0]) ? arguments[0] : arguments;
        for (var i = 0; i < needles.length; i++) {
          if (this.e.indexOf(needles[i]) >= 0) {
            return true;
          }
        }
        return false;
      },
      
      toDate: function () {
        var year = parseInt(this.e.substring(0, 4), 10);
        var month = parseInt(this.e.substring(4, 6), 10) - 1;
        var day = parseInt(this.e.substring(6, 8), 10);
        return new Date(year, month, day);
      },
      
      hash: function () {
        var hash = 0;
        for (var i = 0; i < this.e.length; i++) {
          var c = this.e.charCodeAt(i);
          hash = ((hash << 5) - hash) + c;
          hash |= 0;
        }
        return hash.toString();
      }
    
    });
    
    var _zzArray = function (e) {
      _zzAny.call(this, e);
    };
    _zzArray.prototype = Object.create(_zzAny.prototype);
    _zzArray.constructor = _zzArray;
    
    angular.extend(_zzArray.prototype, {
    
      forEach: function (callback, defaultReturnValue, thisArg) {
        for (var i = 0; i < this.e.length; i++) {
          var output = callback.call(thisArg, this.e[i], i, this.e);
          if (typeof output !== "undefined") {
            return output;
          }
        }
        return defaultReturnValue;
      }
    
    });
    
    var _zzStorage = function (e) {
      _zzAny.call(this, e);
    };
    _zzStorage.prototype = Object.create(_zzAny.prototype);
    _zzStorage.constructor = _zzStorage;
    
    angular.extend(_zzStorage.prototype, {
    
      forEach: function (callback, defaultReturnValue, thisArg) {
        for (var i = 0; i < this.e.length; i++) {
          var output = callback.call(context, this.e[k], k, this.e);
          if (typeof output !== "undefined") {
            return output;
          }
        }
        return defaultReturnValue;
      }
    
    });
    
    var _zzObject = function (e) {
      _zzAny.call(this, e);
    };
    _zzObject.prototype = Object.create(_zzAny.prototype);
    _zzObject.constructor = _zzObject;
    
    angular.extend(_zzObject.prototype, {
    
      forEach: function (callback, defaultReturnValue, thisArg) {
        for (var k in this.e) {
          if (this.e.hasOwnProperty(k)) {
            var output = callback.call(context, this.e[k], k, this.e);
            if (typeof output !== "undefined") {
              return output;
            }
          }
        }
        return defaultReturnValue;
      },
      
      clear: function () {
        for (var k in this.e) {
          if (this.e.hasOwnProperty(k)) {
            delete this.e[k];
          }
        }
      }
    
    });
    
    var _zzDate = function (e) {
      _zzAny.call(this, e);
    };
    _zzDate.prototype = Object.create(_zzAny.prototype);
    _zzDate.prototype.constructor = _zzDate;
    
    angular.extend(_zzDate.prototype, {
    
      format: function () {
        var year = this.e.getFullYear();
        var month = this.e.getMonth() + 1;
        var day = this.e.getDate();
        return year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
      },
      
      removeTime: function () {
        return ZZ(this.format()).toDate();
      },
      
      getNumberOfDaysBetween: function (other) {
        return Math.round(Math.abs(this.e - other)) / (1000 * 60 * 60 * 24);
      }
    
    });
    
    var ZZ = function (e) {
      switch (Object.prototype.toString.call(e)) {
      case "[object String]":
        return new _zzString(e);
      case "[object Date]":
        return new _zzDate(e);
      case "[object Array]":
        return new _zzArray(e);
      case "[object Object]":
        return new _zzObject(e);
      case "[object Storage]":
        return new _zzStorage(e);
      case "[object Null]":
        $log.debug("element is null");
        return new _zzAny(e);
      case "[object Undefined]":
        $log.debug("element is undefined");
        return new _zzAny(e);
      default:
        return new _zzAny(e);
      }
    };
  
    return ZZ;
  
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
    
    var _linkFactory = function (rel, link) {
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
    
    var _handleLinks = function (data) {
    
      var linkCache = {};
      var linksCache = {};
      
      data.$hasLink = function (rel) {
        return data._links.hasOwnProperty(rel) && !angular.isArray(data._links[rel]);
      };
      
      data.$link = function (rel) {
        if (!linkCache.hasOwnProperty(rel)) {
          if (data.$hasLink(rel)) {
            linkCache[rel] = _linkFactory(rel, data._links[rel]);
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
              return _linkFactory(rel + "[" + i + "]", link);
            });
          } else {
            throw new Error("Links '" + rel + "' not found");
          }
        }
        return linksCache[rel];
      };
          
    };
    
    var _handleEmbedded = function (data) {
      if (data._embedded) {
          
        var handled = false;
        data.$embedded = function () {
          if (!handled) {
            angular.forEach(data._embedded, function (data) {
              _handleLinks(data);
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
          _handleLinks(response.data);
          _handleEmbedded(response.data);
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
    var _version = DEFAULT_VERSION;
    
    var WEAK_ENTRIES_DATE_ENTRY_SUFFIX = ".d";
    var DEFAULT_WEAK_ENTRIES_LIFETIME_IN_DAYS = 30;
    var _weakEntriesLifetimeInDays = DEFAULT_WEAK_ENTRIES_LIFETIME_IN_DAYS;
    
    var ENTRY_PREFIX = "lr.";
    var FIRST_WEAK_ENTRY_POINTER_NAME = "f";
    var PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX = ".p";
    var NEXT_WEAK_ENTRY_POINTER_SUFFIX = ".n";
    var LAST_WEAK_ENTRY_POINTER_NAME = "l";

    var $log;
    var ZZ;
    var _versionEntry;
    var _firstWeakEntryPointer;
    var _lastWeakEntryPointer;
  
    var _Entry = function (key) {
      if (ZZ(key).startsWith(ENTRY_PREFIX)) {
        this.pristineKey = key.substring(ENTRY_PREFIX.length);
        this.key = key;
      } else {
        this.pristineKey = key;
        this.key = ENTRY_PREFIX + key;
      }
    };

    _Entry.prototype = {
      
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
        if (value instanceof _Entry.Weak.Pointer) {
          value = value.getPointedWeakEntry();
        }
        if (value instanceof _Entry) {
          value = value.pristineKey;
        }
        var done = false;
        do {
          try {
            localStorage.setItem(this, value);
            done = true;
          } catch (e) {
            if (_Entry.Weak.removeOldest()) {
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

    _Entry.create = function (key, weak) {
      var zzKey = ZZ(key);
      if (zzKey.is(VERSION_ENTRY_NAME, FIRST_WEAK_ENTRY_POINTER_NAME, LAST_WEAK_ENTRY_POINTER_NAME)) {
        throw new Error("Reserved keys: " + VERSION_ENTRY_NAME + ", " + FIRST_WEAK_ENTRY_POINTER_NAME + ", " + LAST_WEAK_ENTRY_POINTER_NAME);
      } else if (zzKey.endsWith(PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX, NEXT_WEAK_ENTRY_POINTER_SUFFIX, WEAK_ENTRIES_DATE_ENTRY_SUFFIX)) {
        throw new Error("Reserved suffixes: " + PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX + ", " + NEXT_WEAK_ENTRY_POINTER_SUFFIX + ", " + WEAK_ENTRIES_DATE_ENTRY_SUFFIX);
      } else if (zzKey.startsWith(ENTRY_PREFIX)) {
        throw new Error("Reserved prefixes: " + ENTRY_PREFIX);
      }
      return weak ? new _Entry.Weak(key) : new _Entry(key);
    };

    _Entry.find = function (key) {
      var zzKey = ZZ(key);
      if (zzKey.startsWith(ENTRY_PREFIX)) {
        return new _Entry.Transient(key);
      } else if (zzKey.is(VERSION_ENTRY_NAME)) {
        return new _Entry.Version(key);
      } else if (zzKey.is(FIRST_WEAK_ENTRY_POINTER_NAME, LAST_WEAK_ENTRY_POINTER_NAME) || zzKey.endsWith(PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX, NEXT_WEAK_ENTRY_POINTER_SUFFIX)) {
        return new _Entry.Weak.Pointer(key);
      } else if (zzKey.endsWith(WEAK_ENTRIES_DATE_ENTRY_SUFFIX)) {
        return new _Entry.Weak.Date(key);
      } else {
        var entry = new _Entry.Weak(key);
        if (!entry.getDateEntry().exists()) {
          entry = new _Entry(key);
        }
        return entry;
      }
    };
    
    _Entry.Transient = function (key) {
      _Entry.call(this, key);
    };
    _Entry.Transient.prototype = Object.create(_Entry.prototype);
    _Entry.Transient.prototype.constructor = _Entry.Transient;
    
    angular.extend(_Entry.Transient.prototype, {
      
      exists: function () {
        return false;
      }
      
    });

    _Entry.Weak = function (key) {
      _Entry.call(this, key);
    };  
    _Entry.Weak.prototype = Object.create(_Entry.prototype);
    _Entry.Weak.prototype.constructor = _Entry.Weak;

    angular.extend(_Entry.Weak.prototype, {
          
      isObsolete: function () {
        return ZZ(ZZ(new Date()).removeTime()).getNumberOfDaysBetween(ZZ(this.getDateEntry().getString()).toDate()) > _weakEntriesLifetimeInDays;
      },
      
      getPreviousWeakEntryPointer: function () {
        return new _Entry.Weak.Pointer(this + PREVIOUS_WEAK_ENTRY_POINTER_SUFFIX);
      },
      
      getNextWeakEntryPointer: function () {
        return new _Entry.Weak.Pointer(this + NEXT_WEAK_ENTRY_POINTER_SUFFIX);
      },
      
      getDateEntry: function () {
        return new _Entry.Weak.Date(this + WEAK_ENTRIES_DATE_ENTRY_SUFFIX);
      },
      
      getObject: function (setAsLastWeakEntry) {
        var value = _Entry.prototype.getObject.call(this);
        if (setAsLastWeakEntry && this.exists()) {
          this.setObject(value, true);
        }
        return value;
      },
      
      setObject: function (value) {
        if (this.exists()) {
          this.remove();
        }
        if (!_firstWeakEntryPointer.exists()) {
          _firstWeakEntryPointer.setString(this);
        }
        if (_lastWeakEntryPointer.exists()) {
          var lastWeakEntry = _lastWeakEntryPointer.getPointedWeakEntry();
          lastWeakEntry.getNextWeakEntryPointer().setString(this);
          this.getPreviousWeakEntryPointer().setString(lastWeakEntry);
        }
        _lastWeakEntryPointer.setString(this);
        this.getDateEntry().setString(ZZ(new Date()).format());
        _Entry.prototype.setObject.call(this, value);
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
              _lastWeakEntryPointer.setString(previousEntryPointer);
              _lastWeakEntryPointer.getPointedWeakEntry().getNextWeakEntryPointer().remove();
              previousEntryPointer.remove();
            }
          } else if (nextEntryPointer.exists()) {
            _firstWeakEntryPointer.setString(nextEntryPointer);
            _firstWeakEntryPointer.getPointedWeakEntry().getPreviousWeakEntryPointer().remove();
            nextEntryPointer.remove();
          } else {
            _firstWeakEntryPointer.remove();
            previousEntryPointer.remove();
            nextEntryPointer.remove();
            _lastWeakEntryPointer.remove();
          }
          this.getDateEntry().remove();
        }
        _Entry.prototype.remove.call(this);
      }
      
    });

    _Entry.Weak.removeOldest = function () {
      var removed = false;
      if (_firstWeakEntryPointer.exists()) {
        _firstWeakEntryPointer.getPointedWeakEntry().remove();
        removed = true;
      }
      return removed;
    };

    _Entry.Weak.Date = function (key) {
      _Entry.call(this, key);
    };  
    _Entry.Weak.Date.prototype = Object.create(_Entry.prototype);
    _Entry.Weak.Date.prototype.constructor = _Entry.Weak.Date;

    angular.extend(_Entry.Weak.Date.prototype, {

      isUserAccessible: function () {
        return false;
      }
      
    });

    _Entry.Version = function (key) {
      _Entry.call(this, key);
    };  
    _Entry.Version.prototype = Object.create(_Entry.prototype);
    _Entry.Version.prototype.constructor = _Entry.Version;

    angular.extend(_Entry.Version.prototype, {

      isUserAccessible: function () {
        return false;
      }
      
    });
        
    _Entry.Weak.Pointer = function (key) {
      _Entry.call(this, key);
    };  
    _Entry.Weak.Pointer.prototype = Object.create(_Entry.prototype);
    _Entry.Weak.Pointer.prototype.constructor = _Entry.Weak.Pointer;

    angular.extend(_Entry.Weak.Pointer.prototype, {

      isUserAccessible: function () {
        return false;
      },

      getPointedWeakEntry: function () {
        return new _Entry.Weak(this.getString());
      }
      
    });

    var LocalRepository = {
        
      has: function (key) {
        return _Entry.find(key).isUserAccessible();
      },
      
      set: function (key, value, weak) {
        _Entry.create(key, weak).setObject(value);
      },
      
      remove: function (key) {
        var entry = _Entry.find(key);
        if (entry.isUserAccessible()) {
          entry.remove();
        }
      },
      
      get: function (key) {
        var entry = _Entry.find(key);
        if (entry.isUserAccessible()) {
          return entry.getObject(true);
        }
      },
      
      clearObsoleteWeakEntries: function () {
        while (_firstWeakEntryPointer.exists() && _firstWeakEntryPointer.getPointedWeakEntry().isObsolete()) {
          _firstWeakEntryPointer.getPointedWeakEntry().remove();
        }
      },
      
      clear: function () {
        var count = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key !== _versionEntry.key && ZZ(key).startsWith(ENTRY_PREFIX)) {
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
          if (ZZ(key).startsWith(ENTRY_PREFIX)) {
            var entry = _Entry.find(key.substring(ENTRY_PREFIX.length));
            if (entry.isUserAccessible()) {
              callback(entry.pristineKey, entry.getObject(false));
            }
          }
        }
      }

    };
    
    var _init = function (new$log, newZZ) {
      $log = new$log;
      ZZ = newZZ;
      _versionEntry = new _Entry.Version(VERSION_ENTRY_NAME);
      _firstWeakEntryPointer = new _Entry.Weak.Pointer(FIRST_WEAK_ENTRY_POINTER_NAME);
      _lastWeakEntryPointer = new _Entry.Weak.Pointer(LAST_WEAK_ENTRY_POINTER_NAME);
      if (!_versionEntry.exists() || _versionEntry.getString() !== _version) {
        localStorage.clear();
        _versionEntry.setString(_version);
        $log.debug("LocalRepository initialized to version '" + _version + "'");
      } else {
        LocalRepository.clearObsoleteWeakEntries();
      }
    };
    
    return {
    
      setVersion: function (version) {
        _version = version;
      },
      
      setWeakEntriesLifetimeInDays: function (weakEntriesLifetimeInDays) {
        _weakEntriesLifetimeInDays = weakEntriesLifetimeInDays;
      },
    
      $get: ["$log", "ZZ",
      function ($log, ZZ) {
        _init($log, ZZ);
        return LocalRepository;
      }]
      
    };
  
  }])
  
  /**
   * Caches images data URLs in the local storage.
   */
  .factory("ImageCache", ["$q", "$log", "LocalRepository", "ZZ",
  function ($q, $log, LocalRepository, ZZ) {
    
    var ENTRY_PREFIX = "ic.";
    
    var _currentlyCaching = {};
    
    var _getDataUrl = function (imageUrl, imageType, imageQuality) {
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
    
    var ImageCache = {
    
      has: function (key) {
        return LocalRepository.has(ENTRY_PREFIX + key);
      },
      
      get: function (key) {
        return LocalRepository.get(ENTRY_PREFIX + key);
      },
      
      remove: function (key) {
        LocalRepository.remove(ENTRY_PREFIX + key);
      },
      
      cache: function (key, imageUrl, weak, imageType, imageQuality) {
        if (_currentlyCaching[key]) {
          $log.debug("Caching image " + key + " (" + imageUrl + ") already in progress");
          return _currentlyCaching[key];
        } else {
          var deferred = $q.defer();
          if (ImageCache.has(key)) {
            $log.debug("Image " + key + " (" + imageUrl + ") already cached");
            deferred.resolve(ImageCache.get(key));
          } else {
            _currentlyCaching[key] = deferred.promise;
            _getDataUrl(imageUrl, imageType, imageQuality).then(function (dataUrl) {
              $log.debug("Image " + key + " (" + imageUrl + ") cached");
              LocalRepository.set(ENTRY_PREFIX + key, dataUrl, weak);
              deferred.resolve(dataUrl);
              delete _currentlyCaching[key];
            }, function () {
              $log.debug("Could not cache image " + key + " (" + imageUrl + ")");
              deferred.reject();
              delete _currentlyCaching[key];
            })
          }
          return deferred.promise;
        }
      },
      
      forEach: function (callback) {
        LocalRepository.forEach(function (key) {
          if (ZZ(key).startsWith(ENTRY_PREFIX)) {
            callback(key.substring(ENTRY_PREFIX.length));
          }
        });
      },
      
      clear: function () {
        var keys = [];
        ImageCache.forEach(function (key) {
          keys.push(key);
        });
        angular.forEach(keys, function (key) {
          ImageCache.remove(key);
        });
      }
      
    };
    
    return ImageCache;
    
  }])
  
  /**
   * Utility directive to use Daniel Eden's animate.css library, requires jQuery UI.
   */
  .directive("jrfAnimate", [
  function () {
    
    return {
      
      restrict: "A",
      
      scope: {
        object: "=jrfAnimate",
        animationName: "@jrfAnimation"
      },
      
      link: function (scope, element, attributes) {
        if (typeof $.prototype.zIndex !== "function") {
          throw new Error("jQuery.prototype.zIndex not found, load jQuery UI before jrestful-core to use jrfAnimate");
        }
        var $element = element.removeClass("animated");
        var zIndex = $element.zIndex();
        var tempZIndex = zIndex + 1;
        scope.$watch("object.animate", function (animate) {
          if (animate) {
            $element.zIndex(tempZIndex).addClass("animated " + scope.animationName)
            .one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend", function () {
              $element.zIndex(zIndex).removeClass("animated " + scope.animationName);
              scope.$apply(function () {
                delete scope.object.animate;
              });
            });
          }
        });
      }
    
    };
  
  }])
  
  /**
   * Builds a countdown, requires Evan Hahn's Humanize Duration library.
   */
  .directive("jrfCountdown", ["$timeout",
  function ($timeout) {
    
    return {
      
      restrict: "E",
      
      replace: true,
      
      scope: {
        date: "@jrfDate",
        language: "@jrfLanguage"
      },
      
      template: '<span class="jrf-countdown" ng-bind="countdown"></span>',
      
      link: function (scope, element, attributes) {
        if (typeof humanizeDuration !== "function") {
          throw new Error("humanizeDuration not found, load it before jrestful-core to use jrfCountdown");
        }
        var to = Date.parse(scope.date);
        var options = { round: true, language: scope.language || "en" };
        (function setCountdown() {
          var delta = Math.max(to - Date.now(), 0);
          scope.countdown = humanizeDuration(delta, options);
          if (delta > 0) {
            $timeout(setCountdown, 1000);
          }
        })();
      }
    
    };
  
  }])
  
  /**
   * Builds an img tag from an Image instance.
   */
  .directive("jrfImage", [
  function () {
    
    return {
      
      restrict: "E",
      
      scope: {
        src: "=src"
      },
      
      link: function (scope, element, attributes) {
        scope.$watch("src", function (value) {
          if (value) {
            var imageAttributes = {};
            angular.forEach(attributes, function (value, name) {
              if (name.indexOf("$") != 0 && name != "src") {
                imageAttributes[name] = value;
              }
            });
            element.replaceWith($(scope.src).attr(imageAttributes));
          }
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
      
      $config: _config,
      
      $get: function () {
        return {
          $run: _run
        };
      }
      
    };
    
  }]);
  
})(angular);
