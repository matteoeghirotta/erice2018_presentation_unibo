(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

	/**
	 * @license
	 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
	 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	 * Code distributed by Google as part of the polymer project is also
	 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	 */
	// @version 0.7.24
	(function() {
	  window.WebComponents = window.WebComponents || {
	    flags: {}
	  };
	  var file = "webcomponents-lite.js";
	  var script = document.querySelector('script[src*="' + file + '"]');
	  var flags = {};
	  if (!flags.noOpts) {
	    location.search.slice(1).split("&").forEach(function(option) {
	      var parts = option.split("=");
	      var match;
	      if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
	        flags[match[1]] = parts[1] || true;
	      }
	    });
	    if (script) {
	      for (var i = 0, a; a = script.attributes[i]; i++) {
	        if (a.name !== "src") {
	          flags[a.name] = a.value || true;
	        }
	      }
	    }
	    if (flags.log && flags.log.split) {
	      var parts = flags.log.split(",");
	      flags.log = {};
	      parts.forEach(function(f) {
	        flags.log[f] = true;
	      });
	    } else {
	      flags.log = {};
	    }
	  }
	  if (flags.register) {
	    window.CustomElements = window.CustomElements || {
	      flags: {}
	    };
	    window.CustomElements.flags.register = flags.register;
	  }
	  WebComponents.flags = flags;
	})();

	(function(scope) {
	  var hasWorkingUrl = false;
	  if (!scope.forceJURL) {
	    try {
	      var u = new URL("b", "http://a");
	      u.pathname = "c%20d";
	      hasWorkingUrl = u.href === "http://a/c%20d";
	    } catch (e) {}
	  }
	  if (hasWorkingUrl) return;
	  var relative = Object.create(null);
	  relative["ftp"] = 21;
	  relative["file"] = 0;
	  relative["gopher"] = 70;
	  relative["http"] = 80;
	  relative["https"] = 443;
	  relative["ws"] = 80;
	  relative["wss"] = 443;
	  var relativePathDotMapping = Object.create(null);
	  relativePathDotMapping["%2e"] = ".";
	  relativePathDotMapping[".%2e"] = "..";
	  relativePathDotMapping["%2e."] = "..";
	  relativePathDotMapping["%2e%2e"] = "..";
	  function isRelativeScheme(scheme) {
	    return relative[scheme] !== undefined;
	  }
	  function invalid() {
	    clear.call(this);
	    this._isInvalid = true;
	  }
	  function IDNAToASCII(h) {
	    if ("" == h) {
	      invalid.call(this);
	    }
	    return h.toLowerCase();
	  }
	  function percentEscape(c) {
	    var unicode = c.charCodeAt(0);
	    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 63, 96 ].indexOf(unicode) == -1) {
	      return c;
	    }
	    return encodeURIComponent(c);
	  }
	  function percentEscapeQuery(c) {
	    var unicode = c.charCodeAt(0);
	    if (unicode > 32 && unicode < 127 && [ 34, 35, 60, 62, 96 ].indexOf(unicode) == -1) {
	      return c;
	    }
	    return encodeURIComponent(c);
	  }
	  var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
	  function parse(input, stateOverride, base) {
	    var state = stateOverride || "scheme start", cursor = 0, buffer = "", seenAt = false, seenBracket = false;
	    loop: while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
	      var c = input[cursor];
	      switch (state) {
	       case "scheme start":
	        if (c && ALPHA.test(c)) {
	          buffer += c.toLowerCase();
	          state = "scheme";
	        } else if (!stateOverride) {
	          buffer = "";
	          state = "no scheme";
	          continue;
	        } else {
	          break loop;
	        }
	        break;

	       case "scheme":
	        if (c && ALPHANUMERIC.test(c)) {
	          buffer += c.toLowerCase();
	        } else if (":" == c) {
	          this._scheme = buffer;
	          buffer = "";
	          if (stateOverride) {
	            break loop;
	          }
	          if (isRelativeScheme(this._scheme)) {
	            this._isRelative = true;
	          }
	          if ("file" == this._scheme) {
	            state = "relative";
	          } else if (this._isRelative && base && base._scheme == this._scheme) {
	            state = "relative or authority";
	          } else if (this._isRelative) {
	            state = "authority first slash";
	          } else {
	            state = "scheme data";
	          }
	        } else if (!stateOverride) {
	          buffer = "";
	          cursor = 0;
	          state = "no scheme";
	          continue;
	        } else if (EOF == c) {
	          break loop;
	        } else {
	          break loop;
	        }
	        break;

	       case "scheme data":
	        if ("?" == c) {
	          this._query = "?";
	          state = "query";
	        } else if ("#" == c) {
	          this._fragment = "#";
	          state = "fragment";
	        } else {
	          if (EOF != c && "\t" != c && "\n" != c && "\r" != c) {
	            this._schemeData += percentEscape(c);
	          }
	        }
	        break;

	       case "no scheme":
	        if (!base || !isRelativeScheme(base._scheme)) {
	          invalid.call(this);
	        } else {
	          state = "relative";
	          continue;
	        }
	        break;

	       case "relative or authority":
	        if ("/" == c && "/" == input[cursor + 1]) {
	          state = "authority ignore slashes";
	        } else {
	          state = "relative";
	          continue;
	        }
	        break;

	       case "relative":
	        this._isRelative = true;
	        if ("file" != this._scheme) this._scheme = base._scheme;
	        if (EOF == c) {
	          this._host = base._host;
	          this._port = base._port;
	          this._path = base._path.slice();
	          this._query = base._query;
	          this._username = base._username;
	          this._password = base._password;
	          break loop;
	        } else if ("/" == c || "\\" == c) {
	          state = "relative slash";
	        } else if ("?" == c) {
	          this._host = base._host;
	          this._port = base._port;
	          this._path = base._path.slice();
	          this._query = "?";
	          this._username = base._username;
	          this._password = base._password;
	          state = "query";
	        } else if ("#" == c) {
	          this._host = base._host;
	          this._port = base._port;
	          this._path = base._path.slice();
	          this._query = base._query;
	          this._fragment = "#";
	          this._username = base._username;
	          this._password = base._password;
	          state = "fragment";
	        } else {
	          var nextC = input[cursor + 1];
	          var nextNextC = input[cursor + 2];
	          if ("file" != this._scheme || !ALPHA.test(c) || nextC != ":" && nextC != "|" || EOF != nextNextC && "/" != nextNextC && "\\" != nextNextC && "?" != nextNextC && "#" != nextNextC) {
	            this._host = base._host;
	            this._port = base._port;
	            this._username = base._username;
	            this._password = base._password;
	            this._path = base._path.slice();
	            this._path.pop();
	          }
	          state = "relative path";
	          continue;
	        }
	        break;

	       case "relative slash":
	        if ("/" == c || "\\" == c) {
	          if ("file" == this._scheme) {
	            state = "file host";
	          } else {
	            state = "authority ignore slashes";
	          }
	        } else {
	          if ("file" != this._scheme) {
	            this._host = base._host;
	            this._port = base._port;
	            this._username = base._username;
	            this._password = base._password;
	          }
	          state = "relative path";
	          continue;
	        }
	        break;

	       case "authority first slash":
	        if ("/" == c) {
	          state = "authority second slash";
	        } else {
	          state = "authority ignore slashes";
	          continue;
	        }
	        break;

	       case "authority second slash":
	        state = "authority ignore slashes";
	        if ("/" != c) {
	          continue;
	        }
	        break;

	       case "authority ignore slashes":
	        if ("/" != c && "\\" != c) {
	          state = "authority";
	          continue;
	        }
	        break;

	       case "authority":
	        if ("@" == c) {
	          if (seenAt) {
	            buffer += "%40";
	          }
	          seenAt = true;
	          for (var i = 0; i < buffer.length; i++) {
	            var cp = buffer[i];
	            if ("\t" == cp || "\n" == cp || "\r" == cp) {
	              continue;
	            }
	            if (":" == cp && null === this._password) {
	              this._password = "";
	              continue;
	            }
	            var tempC = percentEscape(cp);
	            null !== this._password ? this._password += tempC : this._username += tempC;
	          }
	          buffer = "";
	        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
	          cursor -= buffer.length;
	          buffer = "";
	          state = "host";
	          continue;
	        } else {
	          buffer += c;
	        }
	        break;

	       case "file host":
	        if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
	          if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ":" || buffer[1] == "|")) {
	            state = "relative path";
	          } else if (buffer.length == 0) {
	            state = "relative path start";
	          } else {
	            this._host = IDNAToASCII.call(this, buffer);
	            buffer = "";
	            state = "relative path start";
	          }
	          continue;
	        } else if ("\t" == c || "\n" == c || "\r" == c) ; else {
	          buffer += c;
	        }
	        break;

	       case "host":
	       case "hostname":
	        if (":" == c && !seenBracket) {
	          this._host = IDNAToASCII.call(this, buffer);
	          buffer = "";
	          state = "port";
	          if ("hostname" == stateOverride) {
	            break loop;
	          }
	        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c) {
	          this._host = IDNAToASCII.call(this, buffer);
	          buffer = "";
	          state = "relative path start";
	          if (stateOverride) {
	            break loop;
	          }
	          continue;
	        } else if ("\t" != c && "\n" != c && "\r" != c) {
	          if ("[" == c) {
	            seenBracket = true;
	          } else if ("]" == c) {
	            seenBracket = false;
	          }
	          buffer += c;
	        }
	        break;

	       case "port":
	        if (/[0-9]/.test(c)) {
	          buffer += c;
	        } else if (EOF == c || "/" == c || "\\" == c || "?" == c || "#" == c || stateOverride) {
	          if ("" != buffer) {
	            var temp = parseInt(buffer, 10);
	            if (temp != relative[this._scheme]) {
	              this._port = temp + "";
	            }
	            buffer = "";
	          }
	          if (stateOverride) {
	            break loop;
	          }
	          state = "relative path start";
	          continue;
	        } else if ("\t" == c || "\n" == c || "\r" == c) ; else {
	          invalid.call(this);
	        }
	        break;

	       case "relative path start":
	        state = "relative path";
	        if ("/" != c && "\\" != c) {
	          continue;
	        }
	        break;

	       case "relative path":
	        if (EOF == c || "/" == c || "\\" == c || !stateOverride && ("?" == c || "#" == c)) {
	          var tmp;
	          if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
	            buffer = tmp;
	          }
	          if (".." == buffer) {
	            this._path.pop();
	            if ("/" != c && "\\" != c) {
	              this._path.push("");
	            }
	          } else if ("." == buffer && "/" != c && "\\" != c) {
	            this._path.push("");
	          } else if ("." != buffer) {
	            if ("file" == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == "|") {
	              buffer = buffer[0] + ":";
	            }
	            this._path.push(buffer);
	          }
	          buffer = "";
	          if ("?" == c) {
	            this._query = "?";
	            state = "query";
	          } else if ("#" == c) {
	            this._fragment = "#";
	            state = "fragment";
	          }
	        } else if ("\t" != c && "\n" != c && "\r" != c) {
	          buffer += percentEscape(c);
	        }
	        break;

	       case "query":
	        if (!stateOverride && "#" == c) {
	          this._fragment = "#";
	          state = "fragment";
	        } else if (EOF != c && "\t" != c && "\n" != c && "\r" != c) {
	          this._query += percentEscapeQuery(c);
	        }
	        break;

	       case "fragment":
	        if (EOF != c && "\t" != c && "\n" != c && "\r" != c) {
	          this._fragment += c;
	        }
	        break;
	      }
	      cursor++;
	    }
	  }
	  function clear() {
	    this._scheme = "";
	    this._schemeData = "";
	    this._username = "";
	    this._password = null;
	    this._host = "";
	    this._port = "";
	    this._path = [];
	    this._query = "";
	    this._fragment = "";
	    this._isInvalid = false;
	    this._isRelative = false;
	  }
	  function jURL(url, base) {
	    if (base !== undefined && !(base instanceof jURL)) base = new jURL(String(base));
	    this._url = url;
	    clear.call(this);
	    var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, "");
	    parse.call(this, input, null, base);
	  }
	  jURL.prototype = {
	    toString: function() {
	      return this.href;
	    },
	    get href() {
	      if (this._isInvalid) return this._url;
	      var authority = "";
	      if ("" != this._username || null != this._password) {
	        authority = this._username + (null != this._password ? ":" + this._password : "") + "@";
	      }
	      return this.protocol + (this._isRelative ? "//" + authority + this.host : "") + this.pathname + this._query + this._fragment;
	    },
	    set href(href) {
	      clear.call(this);
	      parse.call(this, href);
	    },
	    get protocol() {
	      return this._scheme + ":";
	    },
	    set protocol(protocol) {
	      if (this._isInvalid) return;
	      parse.call(this, protocol + ":", "scheme start");
	    },
	    get host() {
	      return this._isInvalid ? "" : this._port ? this._host + ":" + this._port : this._host;
	    },
	    set host(host) {
	      if (this._isInvalid || !this._isRelative) return;
	      parse.call(this, host, "host");
	    },
	    get hostname() {
	      return this._host;
	    },
	    set hostname(hostname) {
	      if (this._isInvalid || !this._isRelative) return;
	      parse.call(this, hostname, "hostname");
	    },
	    get port() {
	      return this._port;
	    },
	    set port(port) {
	      if (this._isInvalid || !this._isRelative) return;
	      parse.call(this, port, "port");
	    },
	    get pathname() {
	      return this._isInvalid ? "" : this._isRelative ? "/" + this._path.join("/") : this._schemeData;
	    },
	    set pathname(pathname) {
	      if (this._isInvalid || !this._isRelative) return;
	      this._path = [];
	      parse.call(this, pathname, "relative path start");
	    },
	    get search() {
	      return this._isInvalid || !this._query || "?" == this._query ? "" : this._query;
	    },
	    set search(search) {
	      if (this._isInvalid || !this._isRelative) return;
	      this._query = "?";
	      if ("?" == search[0]) search = search.slice(1);
	      parse.call(this, search, "query");
	    },
	    get hash() {
	      return this._isInvalid || !this._fragment || "#" == this._fragment ? "" : this._fragment;
	    },
	    set hash(hash) {
	      if (this._isInvalid) return;
	      this._fragment = "#";
	      if ("#" == hash[0]) hash = hash.slice(1);
	      parse.call(this, hash, "fragment");
	    },
	    get origin() {
	      var host;
	      if (this._isInvalid || !this._scheme) {
	        return "";
	      }
	      switch (this._scheme) {
	       case "data":
	       case "file":
	       case "javascript":
	       case "mailto":
	        return "null";
	      }
	      host = this.host;
	      if (!host) {
	        return "";
	      }
	      return this._scheme + "://" + host;
	    }
	  };
	  var OriginalURL = scope.URL;
	  if (OriginalURL) {
	    jURL.createObjectURL = function(blob) {
	      return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
	    };
	    jURL.revokeObjectURL = function(url) {
	      OriginalURL.revokeObjectURL(url);
	    };
	  }
	  scope.URL = jURL;
	})(self);

	if (typeof WeakMap === "undefined") {
	  (function() {
	    var defineProperty = Object.defineProperty;
	    var counter = Date.now() % 1e9;
	    var WeakMap = function() {
	      this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
	    };
	    WeakMap.prototype = {
	      set: function(key, value) {
	        var entry = key[this.name];
	        if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
	          value: [ key, value ],
	          writable: true
	        });
	        return this;
	      },
	      get: function(key) {
	        var entry;
	        return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
	      },
	      "delete": function(key) {
	        var entry = key[this.name];
	        if (!entry || entry[0] !== key) return false;
	        entry[0] = entry[1] = undefined;
	        return true;
	      },
	      has: function(key) {
	        var entry = key[this.name];
	        if (!entry) return false;
	        return entry[0] === key;
	      }
	    };
	    window.WeakMap = WeakMap;
	  })();
	}

	(function(global) {
	  if (global.JsMutationObserver) {
	    return;
	  }
	  var registrationsTable = new WeakMap();
	  var setImmediate;
	  if (/Trident|Edge/.test(navigator.userAgent)) {
	    setImmediate = setTimeout;
	  } else if (window.setImmediate) {
	    setImmediate = window.setImmediate;
	  } else {
	    var setImmediateQueue = [];
	    var sentinel = String(Math.random());
	    window.addEventListener("message", function(e) {
	      if (e.data === sentinel) {
	        var queue = setImmediateQueue;
	        setImmediateQueue = [];
	        queue.forEach(function(func) {
	          func();
	        });
	      }
	    });
	    setImmediate = function(func) {
	      setImmediateQueue.push(func);
	      window.postMessage(sentinel, "*");
	    };
	  }
	  var isScheduled = false;
	  var scheduledObservers = [];
	  function scheduleCallback(observer) {
	    scheduledObservers.push(observer);
	    if (!isScheduled) {
	      isScheduled = true;
	      setImmediate(dispatchCallbacks);
	    }
	  }
	  function wrapIfNeeded(node) {
	    return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
	  }
	  function dispatchCallbacks() {
	    isScheduled = false;
	    var observers = scheduledObservers;
	    scheduledObservers = [];
	    observers.sort(function(o1, o2) {
	      return o1.uid_ - o2.uid_;
	    });
	    var anyNonEmpty = false;
	    observers.forEach(function(observer) {
	      var queue = observer.takeRecords();
	      removeTransientObserversFor(observer);
	      if (queue.length) {
	        observer.callback_(queue, observer);
	        anyNonEmpty = true;
	      }
	    });
	    if (anyNonEmpty) dispatchCallbacks();
	  }
	  function removeTransientObserversFor(observer) {
	    observer.nodes_.forEach(function(node) {
	      var registrations = registrationsTable.get(node);
	      if (!registrations) return;
	      registrations.forEach(function(registration) {
	        if (registration.observer === observer) registration.removeTransientObservers();
	      });
	    });
	  }
	  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
	    for (var node = target; node; node = node.parentNode) {
	      var registrations = registrationsTable.get(node);
	      if (registrations) {
	        for (var j = 0; j < registrations.length; j++) {
	          var registration = registrations[j];
	          var options = registration.options;
	          if (node !== target && !options.subtree) continue;
	          var record = callback(options);
	          if (record) registration.enqueue(record);
	        }
	      }
	    }
	  }
	  var uidCounter = 0;
	  function JsMutationObserver(callback) {
	    this.callback_ = callback;
	    this.nodes_ = [];
	    this.records_ = [];
	    this.uid_ = ++uidCounter;
	  }
	  JsMutationObserver.prototype = {
	    observe: function(target, options) {
	      target = wrapIfNeeded(target);
	      if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
	        throw new SyntaxError();
	      }
	      var registrations = registrationsTable.get(target);
	      if (!registrations) registrationsTable.set(target, registrations = []);
	      var registration;
	      for (var i = 0; i < registrations.length; i++) {
	        if (registrations[i].observer === this) {
	          registration = registrations[i];
	          registration.removeListeners();
	          registration.options = options;
	          break;
	        }
	      }
	      if (!registration) {
	        registration = new Registration(this, target, options);
	        registrations.push(registration);
	        this.nodes_.push(target);
	      }
	      registration.addListeners();
	    },
	    disconnect: function() {
	      this.nodes_.forEach(function(node) {
	        var registrations = registrationsTable.get(node);
	        for (var i = 0; i < registrations.length; i++) {
	          var registration = registrations[i];
	          if (registration.observer === this) {
	            registration.removeListeners();
	            registrations.splice(i, 1);
	            break;
	          }
	        }
	      }, this);
	      this.records_ = [];
	    },
	    takeRecords: function() {
	      var copyOfRecords = this.records_;
	      this.records_ = [];
	      return copyOfRecords;
	    }
	  };
	  function MutationRecord(type, target) {
	    this.type = type;
	    this.target = target;
	    this.addedNodes = [];
	    this.removedNodes = [];
	    this.previousSibling = null;
	    this.nextSibling = null;
	    this.attributeName = null;
	    this.attributeNamespace = null;
	    this.oldValue = null;
	  }
	  function copyMutationRecord(original) {
	    var record = new MutationRecord(original.type, original.target);
	    record.addedNodes = original.addedNodes.slice();
	    record.removedNodes = original.removedNodes.slice();
	    record.previousSibling = original.previousSibling;
	    record.nextSibling = original.nextSibling;
	    record.attributeName = original.attributeName;
	    record.attributeNamespace = original.attributeNamespace;
	    record.oldValue = original.oldValue;
	    return record;
	  }
	  var currentRecord, recordWithOldValue;
	  function getRecord(type, target) {
	    return currentRecord = new MutationRecord(type, target);
	  }
	  function getRecordWithOldValue(oldValue) {
	    if (recordWithOldValue) return recordWithOldValue;
	    recordWithOldValue = copyMutationRecord(currentRecord);
	    recordWithOldValue.oldValue = oldValue;
	    return recordWithOldValue;
	  }
	  function clearRecords() {
	    currentRecord = recordWithOldValue = undefined;
	  }
	  function recordRepresentsCurrentMutation(record) {
	    return record === recordWithOldValue || record === currentRecord;
	  }
	  function selectRecord(lastRecord, newRecord) {
	    if (lastRecord === newRecord) return lastRecord;
	    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
	    return null;
	  }
	  function Registration(observer, target, options) {
	    this.observer = observer;
	    this.target = target;
	    this.options = options;
	    this.transientObservedNodes = [];
	  }
	  Registration.prototype = {
	    enqueue: function(record) {
	      var records = this.observer.records_;
	      var length = records.length;
	      if (records.length > 0) {
	        var lastRecord = records[length - 1];
	        var recordToReplaceLast = selectRecord(lastRecord, record);
	        if (recordToReplaceLast) {
	          records[length - 1] = recordToReplaceLast;
	          return;
	        }
	      } else {
	        scheduleCallback(this.observer);
	      }
	      records[length] = record;
	    },
	    addListeners: function() {
	      this.addListeners_(this.target);
	    },
	    addListeners_: function(node) {
	      var options = this.options;
	      if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
	      if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
	      if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
	      if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
	    },
	    removeListeners: function() {
	      this.removeListeners_(this.target);
	    },
	    removeListeners_: function(node) {
	      var options = this.options;
	      if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
	      if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
	      if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
	      if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
	    },
	    addTransientObserver: function(node) {
	      if (node === this.target) return;
	      this.addListeners_(node);
	      this.transientObservedNodes.push(node);
	      var registrations = registrationsTable.get(node);
	      if (!registrations) registrationsTable.set(node, registrations = []);
	      registrations.push(this);
	    },
	    removeTransientObservers: function() {
	      var transientObservedNodes = this.transientObservedNodes;
	      this.transientObservedNodes = [];
	      transientObservedNodes.forEach(function(node) {
	        this.removeListeners_(node);
	        var registrations = registrationsTable.get(node);
	        for (var i = 0; i < registrations.length; i++) {
	          if (registrations[i] === this) {
	            registrations.splice(i, 1);
	            break;
	          }
	        }
	      }, this);
	    },
	    handleEvent: function(e) {
	      e.stopImmediatePropagation();
	      switch (e.type) {
	       case "DOMAttrModified":
	        var name = e.attrName;
	        var namespace = e.relatedNode.namespaceURI;
	        var target = e.target;
	        var record = new getRecord("attributes", target);
	        record.attributeName = name;
	        record.attributeNamespace = namespace;
	        var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
	        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
	          if (!options.attributes) return;
	          if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
	            return;
	          }
	          if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
	          return record;
	        });
	        break;

	       case "DOMCharacterDataModified":
	        var target = e.target;
	        var record = getRecord("characterData", target);
	        var oldValue = e.prevValue;
	        forEachAncestorAndObserverEnqueueRecord(target, function(options) {
	          if (!options.characterData) return;
	          if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
	          return record;
	        });
	        break;

	       case "DOMNodeRemoved":
	        this.addTransientObserver(e.target);

	       case "DOMNodeInserted":
	        var changedNode = e.target;
	        var addedNodes, removedNodes;
	        if (e.type === "DOMNodeInserted") {
	          addedNodes = [ changedNode ];
	          removedNodes = [];
	        } else {
	          addedNodes = [];
	          removedNodes = [ changedNode ];
	        }
	        var previousSibling = changedNode.previousSibling;
	        var nextSibling = changedNode.nextSibling;
	        var record = getRecord("childList", e.target.parentNode);
	        record.addedNodes = addedNodes;
	        record.removedNodes = removedNodes;
	        record.previousSibling = previousSibling;
	        record.nextSibling = nextSibling;
	        forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
	          if (!options.childList) return;
	          return record;
	        });
	      }
	      clearRecords();
	    }
	  };
	  global.JsMutationObserver = JsMutationObserver;
	  if (!global.MutationObserver) {
	    global.MutationObserver = JsMutationObserver;
	    JsMutationObserver._isPolyfilled = true;
	  }
	})(self);

	(function() {
	  var needsTemplate = typeof HTMLTemplateElement === "undefined";
	  if (/Trident/.test(navigator.userAgent)) {
	    (function() {
	      var importNode = document.importNode;
	      document.importNode = function() {
	        var n = importNode.apply(document, arguments);
	        if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
	          var f = document.createDocumentFragment();
	          f.appendChild(n);
	          return f;
	        } else {
	          return n;
	        }
	      };
	    })();
	  }
	  var needsCloning = function() {
	    if (!needsTemplate) {
	      var t = document.createElement("template");
	      var t2 = document.createElement("template");
	      t2.content.appendChild(document.createElement("div"));
	      t.content.appendChild(t2);
	      var clone = t.cloneNode(true);
	      return clone.content.childNodes.length === 0 || clone.content.firstChild.content.childNodes.length === 0;
	    }
	  }();
	  var TEMPLATE_TAG = "template";
	  var TemplateImpl = function() {};
	  if (needsTemplate) {
	    var contentDoc = document.implementation.createHTMLDocument("template");
	    var canDecorate = true;
	    var templateStyle = document.createElement("style");
	    templateStyle.textContent = TEMPLATE_TAG + "{display:none;}";
	    var head = document.head;
	    head.insertBefore(templateStyle, head.firstElementChild);
	    TemplateImpl.prototype = Object.create(HTMLElement.prototype);
	    TemplateImpl.decorate = function(template) {
	      if (template.content) {
	        return;
	      }
	      template.content = contentDoc.createDocumentFragment();
	      var child;
	      while (child = template.firstChild) {
	        template.content.appendChild(child);
	      }
	      template.cloneNode = function(deep) {
	        return TemplateImpl.cloneNode(this, deep);
	      };
	      if (canDecorate) {
	        try {
	          Object.defineProperty(template, "innerHTML", {
	            get: function() {
	              var o = "";
	              for (var e = this.content.firstChild; e; e = e.nextSibling) {
	                o += e.outerHTML || escapeData(e.data);
	              }
	              return o;
	            },
	            set: function(text) {
	              contentDoc.body.innerHTML = text;
	              TemplateImpl.bootstrap(contentDoc);
	              while (this.content.firstChild) {
	                this.content.removeChild(this.content.firstChild);
	              }
	              while (contentDoc.body.firstChild) {
	                this.content.appendChild(contentDoc.body.firstChild);
	              }
	            },
	            configurable: true
	          });
	        } catch (err) {
	          canDecorate = false;
	        }
	      }
	      TemplateImpl.bootstrap(template.content);
	    };
	    TemplateImpl.bootstrap = function(doc) {
	      var templates = doc.querySelectorAll(TEMPLATE_TAG);
	      for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
	        TemplateImpl.decorate(t);
	      }
	    };
	    document.addEventListener("DOMContentLoaded", function() {
	      TemplateImpl.bootstrap(document);
	    });
	    var createElement = document.createElement;
	    document.createElement = function() {
	      var el = createElement.apply(document, arguments);
	      if (el.localName === "template") {
	        TemplateImpl.decorate(el);
	      }
	      return el;
	    };
	    var escapeDataRegExp = /[&\u00A0<>]/g;
	    function escapeReplace(c) {
	      switch (c) {
	       case "&":
	        return "&amp;";

	       case "<":
	        return "&lt;";

	       case ">":
	        return "&gt;";

	       case " ":
	        return "&nbsp;";
	      }
	    }
	    function escapeData(s) {
	      return s.replace(escapeDataRegExp, escapeReplace);
	    }
	  }
	  if (needsTemplate || needsCloning) {
	    var nativeCloneNode = Node.prototype.cloneNode;
	    TemplateImpl.cloneNode = function(template, deep) {
	      var clone = nativeCloneNode.call(template, false);
	      if (this.decorate) {
	        this.decorate(clone);
	      }
	      if (deep) {
	        clone.content.appendChild(nativeCloneNode.call(template.content, true));
	        this.fixClonedDom(clone.content, template.content);
	      }
	      return clone;
	    };
	    TemplateImpl.fixClonedDom = function(clone, source) {
	      if (!source.querySelectorAll) return;
	      var s$ = source.querySelectorAll(TEMPLATE_TAG);
	      var t$ = clone.querySelectorAll(TEMPLATE_TAG);
	      for (var i = 0, l = t$.length, t, s; i < l; i++) {
	        s = s$[i];
	        t = t$[i];
	        if (this.decorate) {
	          this.decorate(s);
	        }
	        t.parentNode.replaceChild(s.cloneNode(true), t);
	      }
	    };
	    var originalImportNode = document.importNode;
	    Node.prototype.cloneNode = function(deep) {
	      var dom = nativeCloneNode.call(this, deep);
	      if (deep) {
	        TemplateImpl.fixClonedDom(dom, this);
	      }
	      return dom;
	    };
	    document.importNode = function(element, deep) {
	      if (element.localName === TEMPLATE_TAG) {
	        return TemplateImpl.cloneNode(element, deep);
	      } else {
	        var dom = originalImportNode.call(document, element, deep);
	        if (deep) {
	          TemplateImpl.fixClonedDom(dom, element);
	        }
	        return dom;
	      }
	    };
	    if (needsCloning) {
	      HTMLTemplateElement.prototype.cloneNode = function(deep) {
	        return TemplateImpl.cloneNode(this, deep);
	      };
	    }
	  }
	  if (needsTemplate) {
	    window.HTMLTemplateElement = TemplateImpl;
	  }
	})();

	(function(scope) {
	  if (!(window.performance && window.performance.now)) {
	    var start = Date.now();
	    window.performance = {
	      now: function() {
	        return Date.now() - start;
	      }
	    };
	  }
	  if (!window.requestAnimationFrame) {
	    window.requestAnimationFrame = function() {
	      var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
	      return nativeRaf ? function(callback) {
	        return nativeRaf(function() {
	          callback(performance.now());
	        });
	      } : function(callback) {
	        return window.setTimeout(callback, 1e3 / 60);
	      };
	    }();
	  }
	  if (!window.cancelAnimationFrame) {
	    window.cancelAnimationFrame = function() {
	      return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
	        clearTimeout(id);
	      };
	    }();
	  }
	  var workingDefaultPrevented = function() {
	    var e = document.createEvent("Event");
	    e.initEvent("foo", true, true);
	    e.preventDefault();
	    return e.defaultPrevented;
	  }();
	  if (!workingDefaultPrevented) {
	    var origPreventDefault = Event.prototype.preventDefault;
	    Event.prototype.preventDefault = function() {
	      if (!this.cancelable) {
	        return;
	      }
	      origPreventDefault.call(this);
	      Object.defineProperty(this, "defaultPrevented", {
	        get: function() {
	          return true;
	        },
	        configurable: true
	      });
	    };
	  }
	  var isIE = /Trident/.test(navigator.userAgent);
	  if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
	    window.CustomEvent = function(inType, params) {
	      params = params || {};
	      var e = document.createEvent("CustomEvent");
	      e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
	      return e;
	    };
	    window.CustomEvent.prototype = window.Event.prototype;
	  }
	  if (!window.Event || isIE && typeof window.Event !== "function") {
	    var origEvent = window.Event;
	    window.Event = function(inType, params) {
	      params = params || {};
	      var e = document.createEvent("Event");
	      e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
	      return e;
	    };
	    window.Event.prototype = origEvent.prototype;
	  }
	})(window.WebComponents);

	window.HTMLImports = window.HTMLImports || {
	  flags: {}
	};

	(function(scope) {
	  var IMPORT_LINK_TYPE = "import";
	  var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement("link"));
	  var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
	  var wrap = function(node) {
	    return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
	  };
	  var rootDocument = wrap(document);
	  var currentScriptDescriptor = {
	    get: function() {
	      var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== "complete" ? document.scripts[document.scripts.length - 1] : null);
	      return wrap(script);
	    },
	    configurable: true
	  };
	  Object.defineProperty(document, "_currentScript", currentScriptDescriptor);
	  Object.defineProperty(rootDocument, "_currentScript", currentScriptDescriptor);
	  var isIE = /Trident/.test(navigator.userAgent);
	  function whenReady(callback, doc) {
	    doc = doc || rootDocument;
	    whenDocumentReady(function() {
	      watchImportsLoad(callback, doc);
	    }, doc);
	  }
	  var requiredReadyState = isIE ? "complete" : "interactive";
	  var READY_EVENT = "readystatechange";
	  function isDocumentReady(doc) {
	    return doc.readyState === "complete" || doc.readyState === requiredReadyState;
	  }
	  function whenDocumentReady(callback, doc) {
	    if (!isDocumentReady(doc)) {
	      var checkReady = function() {
	        if (doc.readyState === "complete" || doc.readyState === requiredReadyState) {
	          doc.removeEventListener(READY_EVENT, checkReady);
	          whenDocumentReady(callback, doc);
	        }
	      };
	      doc.addEventListener(READY_EVENT, checkReady);
	    } else if (callback) {
	      callback();
	    }
	  }
	  function markTargetLoaded(event) {
	    event.target.__loaded = true;
	  }
	  function watchImportsLoad(callback, doc) {
	    var imports = doc.querySelectorAll("link[rel=import]");
	    var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
	    function checkDone() {
	      if (parsedCount == importCount && callback) {
	        callback({
	          allImports: imports,
	          loadedImports: newImports,
	          errorImports: errorImports
	        });
	      }
	    }
	    function loadedImport(e) {
	      markTargetLoaded(e);
	      newImports.push(this);
	      parsedCount++;
	      checkDone();
	    }
	    function errorLoadingImport(e) {
	      errorImports.push(this);
	      parsedCount++;
	      checkDone();
	    }
	    if (importCount) {
	      for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
	        if (isImportLoaded(imp)) {
	          newImports.push(this);
	          parsedCount++;
	          checkDone();
	        } else {
	          imp.addEventListener("load", loadedImport);
	          imp.addEventListener("error", errorLoadingImport);
	        }
	      }
	    } else {
	      checkDone();
	    }
	  }
	  function isImportLoaded(link) {
	    return useNative ? link.__loaded || link.import && link.import.readyState !== "loading" : link.__importParsed;
	  }
	  if (useNative) {
	    new MutationObserver(function(mxns) {
	      for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
	        if (m.addedNodes) {
	          handleImports(m.addedNodes);
	        }
	      }
	    }).observe(document.head, {
	      childList: true
	    });
	    function handleImports(nodes) {
	      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
	        if (isImport(n)) {
	          handleImport(n);
	        }
	      }
	    }
	    function isImport(element) {
	      return element.localName === "link" && element.rel === "import";
	    }
	    function handleImport(element) {
	      var loaded = element.import;
	      if (loaded) {
	        markTargetLoaded({
	          target: element
	        });
	      } else {
	        element.addEventListener("load", markTargetLoaded);
	        element.addEventListener("error", markTargetLoaded);
	      }
	    }
	    (function() {
	      if (document.readyState === "loading") {
	        var imports = document.querySelectorAll("link[rel=import]");
	        for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
	          handleImport(imp);
	        }
	      }
	    })();
	  }
	  whenReady(function(detail) {
	    window.HTMLImports.ready = true;
	    window.HTMLImports.readyTime = new Date().getTime();
	    var evt = rootDocument.createEvent("CustomEvent");
	    evt.initCustomEvent("HTMLImportsLoaded", true, true, detail);
	    rootDocument.dispatchEvent(evt);
	  });
	  scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
	  scope.useNative = useNative;
	  scope.rootDocument = rootDocument;
	  scope.whenReady = whenReady;
	  scope.isIE = isIE;
	})(window.HTMLImports);

	(function(scope) {
	  var modules = [];
	  var addModule = function(module) {
	    modules.push(module);
	  };
	  var initializeModules = function() {
	    modules.forEach(function(module) {
	      module(scope);
	    });
	  };
	  scope.addModule = addModule;
	  scope.initializeModules = initializeModules;
	})(window.HTMLImports);

	window.HTMLImports.addModule(function(scope) {
	  var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
	  var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
	  var path = {
	    resolveUrlsInStyle: function(style, linkUrl) {
	      var doc = style.ownerDocument;
	      var resolver = doc.createElement("a");
	      style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
	      return style;
	    },
	    resolveUrlsInCssText: function(cssText, linkUrl, urlObj) {
	      var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
	      r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
	      return r;
	    },
	    replaceUrls: function(text, urlObj, linkUrl, regexp) {
	      return text.replace(regexp, function(m, pre, url, post) {
	        var urlPath = url.replace(/["']/g, "");
	        if (linkUrl) {
	          urlPath = new URL(urlPath, linkUrl).href;
	        }
	        urlObj.href = urlPath;
	        urlPath = urlObj.href;
	        return pre + "'" + urlPath + "'" + post;
	      });
	    }
	  };
	  scope.path = path;
	});

	window.HTMLImports.addModule(function(scope) {
	  var xhr = {
	    async: true,
	    ok: function(request) {
	      return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
	    },
	    load: function(url, next, nextContext) {
	      var request = new XMLHttpRequest();
	      if (scope.flags.debug || scope.flags.bust) {
	        url += "?" + Math.random();
	      }
	      request.open("GET", url, xhr.async);
	      request.addEventListener("readystatechange", function(e) {
	        if (request.readyState === 4) {
	          var redirectedUrl = null;
	          try {
	            var locationHeader = request.getResponseHeader("Location");
	            if (locationHeader) {
	              redirectedUrl = locationHeader.substr(0, 1) === "/" ? location.origin + locationHeader : locationHeader;
	            }
	          } catch (e) {
	            console.error(e.message);
	          }
	          next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
	        }
	      });
	      request.send();
	      return request;
	    },
	    loadDocument: function(url, next, nextContext) {
	      this.load(url, next, nextContext).responseType = "document";
	    }
	  };
	  scope.xhr = xhr;
	});

	window.HTMLImports.addModule(function(scope) {
	  var xhr = scope.xhr;
	  var flags = scope.flags;
	  var Loader = function(onLoad, onComplete) {
	    this.cache = {};
	    this.onload = onLoad;
	    this.oncomplete = onComplete;
	    this.inflight = 0;
	    this.pending = {};
	  };
	  Loader.prototype = {
	    addNodes: function(nodes) {
	      this.inflight += nodes.length;
	      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
	        this.require(n);
	      }
	      this.checkDone();
	    },
	    addNode: function(node) {
	      this.inflight++;
	      this.require(node);
	      this.checkDone();
	    },
	    require: function(elt) {
	      var url = elt.src || elt.href;
	      elt.__nodeUrl = url;
	      if (!this.dedupe(url, elt)) {
	        this.fetch(url, elt);
	      }
	    },
	    dedupe: function(url, elt) {
	      if (this.pending[url]) {
	        this.pending[url].push(elt);
	        return true;
	      }
	      if (this.cache[url]) {
	        this.onload(url, elt, this.cache[url]);
	        this.tail();
	        return true;
	      }
	      this.pending[url] = [ elt ];
	      return false;
	    },
	    fetch: function(url, elt) {
	      flags.load && console.log("fetch", url, elt);
	      if (!url) {
	        setTimeout(function() {
	          this.receive(url, elt, {
	            error: "href must be specified"
	          }, null);
	        }.bind(this), 0);
	      } else if (url.match(/^data:/)) {
	        var pieces = url.split(",");
	        var header = pieces[0];
	        var body = pieces[1];
	        if (header.indexOf(";base64") > -1) {
	          body = atob(body);
	        } else {
	          body = decodeURIComponent(body);
	        }
	        setTimeout(function() {
	          this.receive(url, elt, null, body);
	        }.bind(this), 0);
	      } else {
	        var receiveXhr = function(err, resource, redirectedUrl) {
	          this.receive(url, elt, err, resource, redirectedUrl);
	        }.bind(this);
	        xhr.load(url, receiveXhr);
	      }
	    },
	    receive: function(url, elt, err, resource, redirectedUrl) {
	      this.cache[url] = resource;
	      var $p = this.pending[url];
	      for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
	        this.onload(url, p, resource, err, redirectedUrl);
	        this.tail();
	      }
	      this.pending[url] = null;
	    },
	    tail: function() {
	      --this.inflight;
	      this.checkDone();
	    },
	    checkDone: function() {
	      if (!this.inflight) {
	        this.oncomplete();
	      }
	    }
	  };
	  scope.Loader = Loader;
	});

	window.HTMLImports.addModule(function(scope) {
	  var Observer = function(addCallback) {
	    this.addCallback = addCallback;
	    this.mo = new MutationObserver(this.handler.bind(this));
	  };
	  Observer.prototype = {
	    handler: function(mutations) {
	      for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
	        if (m.type === "childList" && m.addedNodes.length) {
	          this.addedNodes(m.addedNodes);
	        }
	      }
	    },
	    addedNodes: function(nodes) {
	      if (this.addCallback) {
	        this.addCallback(nodes);
	      }
	      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
	        if (n.children && n.children.length) {
	          this.addedNodes(n.children);
	        }
	      }
	    },
	    observe: function(root) {
	      this.mo.observe(root, {
	        childList: true,
	        subtree: true
	      });
	    }
	  };
	  scope.Observer = Observer;
	});

	window.HTMLImports.addModule(function(scope) {
	  var path = scope.path;
	  var rootDocument = scope.rootDocument;
	  var flags = scope.flags;
	  var isIE = scope.isIE;
	  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
	  var IMPORT_SELECTOR = "link[rel=" + IMPORT_LINK_TYPE + "]";
	  var importParser = {
	    documentSelectors: IMPORT_SELECTOR,
	    importsSelectors: [ IMPORT_SELECTOR, "link[rel=stylesheet]:not([type])", "style:not([type])", "script:not([type])", 'script[type="application/javascript"]', 'script[type="text/javascript"]' ].join(","),
	    map: {
	      link: "parseLink",
	      script: "parseScript",
	      style: "parseStyle"
	    },
	    dynamicElements: [],
	    parseNext: function() {
	      var next = this.nextToParse();
	      if (next) {
	        this.parse(next);
	      }
	    },
	    parse: function(elt) {
	      if (this.isParsed(elt)) {
	        flags.parse && console.log("[%s] is already parsed", elt.localName);
	        return;
	      }
	      var fn = this[this.map[elt.localName]];
	      if (fn) {
	        this.markParsing(elt);
	        fn.call(this, elt);
	      }
	    },
	    parseDynamic: function(elt, quiet) {
	      this.dynamicElements.push(elt);
	      if (!quiet) {
	        this.parseNext();
	      }
	    },
	    markParsing: function(elt) {
	      flags.parse && console.log("parsing", elt);
	      this.parsingElement = elt;
	    },
	    markParsingComplete: function(elt) {
	      elt.__importParsed = true;
	      this.markDynamicParsingComplete(elt);
	      if (elt.__importElement) {
	        elt.__importElement.__importParsed = true;
	        this.markDynamicParsingComplete(elt.__importElement);
	      }
	      this.parsingElement = null;
	      flags.parse && console.log("completed", elt);
	    },
	    markDynamicParsingComplete: function(elt) {
	      var i = this.dynamicElements.indexOf(elt);
	      if (i >= 0) {
	        this.dynamicElements.splice(i, 1);
	      }
	    },
	    parseImport: function(elt) {
	      elt.import = elt.__doc;
	      if (window.HTMLImports.__importsParsingHook) {
	        window.HTMLImports.__importsParsingHook(elt);
	      }
	      if (elt.import) {
	        elt.import.__importParsed = true;
	      }
	      this.markParsingComplete(elt);
	      if (elt.__resource && !elt.__error) {
	        elt.dispatchEvent(new CustomEvent("load", {
	          bubbles: false
	        }));
	      } else {
	        elt.dispatchEvent(new CustomEvent("error", {
	          bubbles: false
	        }));
	      }
	      if (elt.__pending) {
	        var fn;
	        while (elt.__pending.length) {
	          fn = elt.__pending.shift();
	          if (fn) {
	            fn({
	              target: elt
	            });
	          }
	        }
	      }
	      this.parseNext();
	    },
	    parseLink: function(linkElt) {
	      if (nodeIsImport(linkElt)) {
	        this.parseImport(linkElt);
	      } else {
	        linkElt.href = linkElt.href;
	        this.parseGeneric(linkElt);
	      }
	    },
	    parseStyle: function(elt) {
	      var src = elt;
	      elt = cloneStyle(elt);
	      src.__appliedElement = elt;
	      elt.__importElement = src;
	      this.parseGeneric(elt);
	    },
	    parseGeneric: function(elt) {
	      this.trackElement(elt);
	      this.addElementToDocument(elt);
	    },
	    rootImportForElement: function(elt) {
	      var n = elt;
	      while (n.ownerDocument.__importLink) {
	        n = n.ownerDocument.__importLink;
	      }
	      return n;
	    },
	    addElementToDocument: function(elt) {
	      var port = this.rootImportForElement(elt.__importElement || elt);
	      port.parentNode.insertBefore(elt, port);
	    },
	    trackElement: function(elt, callback) {
	      var self = this;
	      var done = function(e) {
	        elt.removeEventListener("load", done);
	        elt.removeEventListener("error", done);
	        if (callback) {
	          callback(e);
	        }
	        self.markParsingComplete(elt);
	        self.parseNext();
	      };
	      elt.addEventListener("load", done);
	      elt.addEventListener("error", done);
	      if (isIE && elt.localName === "style") {
	        var fakeLoad = false;
	        if (elt.textContent.indexOf("@import") == -1) {
	          fakeLoad = true;
	        } else if (elt.sheet) {
	          fakeLoad = true;
	          var csr = elt.sheet.cssRules;
	          var len = csr ? csr.length : 0;
	          for (var i = 0, r; i < len && (r = csr[i]); i++) {
	            if (r.type === CSSRule.IMPORT_RULE) {
	              fakeLoad = fakeLoad && Boolean(r.styleSheet);
	            }
	          }
	        }
	        if (fakeLoad) {
	          setTimeout(function() {
	            elt.dispatchEvent(new CustomEvent("load", {
	              bubbles: false
	            }));
	          });
	        }
	      }
	    },
	    parseScript: function(scriptElt) {
	      var script = document.createElement("script");
	      script.__importElement = scriptElt;
	      script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
	      scope.currentScript = scriptElt;
	      this.trackElement(script, function(e) {
	        if (script.parentNode) {
	          script.parentNode.removeChild(script);
	        }
	        scope.currentScript = null;
	      });
	      this.addElementToDocument(script);
	    },
	    nextToParse: function() {
	      this._mayParse = [];
	      return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
	    },
	    nextToParseInDoc: function(doc, link) {
	      if (doc && this._mayParse.indexOf(doc) < 0) {
	        this._mayParse.push(doc);
	        var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
	        for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
	          if (!this.isParsed(n)) {
	            if (this.hasResource(n)) {
	              return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
	            } else {
	              return;
	            }
	          }
	        }
	      }
	      return link;
	    },
	    nextToParseDynamic: function() {
	      return this.dynamicElements[0];
	    },
	    parseSelectorsForNode: function(node) {
	      var doc = node.ownerDocument || node;
	      return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
	    },
	    isParsed: function(node) {
	      return node.__importParsed;
	    },
	    needsDynamicParsing: function(elt) {
	      return this.dynamicElements.indexOf(elt) >= 0;
	    },
	    hasResource: function(node) {
	      if (nodeIsImport(node) && node.__doc === undefined) {
	        return false;
	      }
	      return true;
	    }
	  };
	  function nodeIsImport(elt) {
	    return elt.localName === "link" && elt.rel === IMPORT_LINK_TYPE;
	  }
	  function generateScriptDataUrl(script) {
	    var scriptContent = generateScriptContent(script);
	    return "data:text/javascript;charset=utf-8," + encodeURIComponent(scriptContent);
	  }
	  function generateScriptContent(script) {
	    return script.textContent + generateSourceMapHint(script);
	  }
	  function generateSourceMapHint(script) {
	    var owner = script.ownerDocument;
	    owner.__importedScripts = owner.__importedScripts || 0;
	    var moniker = script.ownerDocument.baseURI;
	    var num = owner.__importedScripts ? "-" + owner.__importedScripts : "";
	    owner.__importedScripts++;
	    return "\n//# sourceURL=" + moniker + num + ".js\n";
	  }
	  function cloneStyle(style) {
	    var clone = style.ownerDocument.createElement("style");
	    clone.textContent = style.textContent;
	    path.resolveUrlsInStyle(clone);
	    return clone;
	  }
	  scope.parser = importParser;
	  scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
	});

	window.HTMLImports.addModule(function(scope) {
	  var flags = scope.flags;
	  var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
	  var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
	  var rootDocument = scope.rootDocument;
	  var Loader = scope.Loader;
	  var Observer = scope.Observer;
	  var parser = scope.parser;
	  var importer = {
	    documents: {},
	    documentPreloadSelectors: IMPORT_SELECTOR,
	    importsPreloadSelectors: [ IMPORT_SELECTOR ].join(","),
	    loadNode: function(node) {
	      importLoader.addNode(node);
	    },
	    loadSubtree: function(parent) {
	      var nodes = this.marshalNodes(parent);
	      importLoader.addNodes(nodes);
	    },
	    marshalNodes: function(parent) {
	      return parent.querySelectorAll(this.loadSelectorsForNode(parent));
	    },
	    loadSelectorsForNode: function(node) {
	      var doc = node.ownerDocument || node;
	      return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
	    },
	    loaded: function(url, elt, resource, err, redirectedUrl) {
	      flags.load && console.log("loaded", url, elt);
	      elt.__resource = resource;
	      elt.__error = err;
	      if (isImportLink(elt)) {
	        var doc = this.documents[url];
	        if (doc === undefined) {
	          doc = err ? null : makeDocument(resource, redirectedUrl || url);
	          if (doc) {
	            doc.__importLink = elt;
	            this.bootDocument(doc);
	          }
	          this.documents[url] = doc;
	        }
	        elt.__doc = doc;
	      }
	      parser.parseNext();
	    },
	    bootDocument: function(doc) {
	      this.loadSubtree(doc);
	      this.observer.observe(doc);
	      parser.parseNext();
	    },
	    loadedAll: function() {
	      parser.parseNext();
	    }
	  };
	  var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
	  importer.observer = new Observer();
	  function isImportLink(elt) {
	    return isLinkRel(elt, IMPORT_LINK_TYPE);
	  }
	  function isLinkRel(elt, rel) {
	    return elt.localName === "link" && elt.getAttribute("rel") === rel;
	  }
	  function hasBaseURIAccessor(doc) {
	    return !!Object.getOwnPropertyDescriptor(doc, "baseURI");
	  }
	  function makeDocument(resource, url) {
	    var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
	    doc._URL = url;
	    var base = doc.createElement("base");
	    base.setAttribute("href", url);
	    if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
	      Object.defineProperty(doc, "baseURI", {
	        value: url
	      });
	    }
	    var meta = doc.createElement("meta");
	    meta.setAttribute("charset", "utf-8");
	    doc.head.appendChild(meta);
	    doc.head.appendChild(base);
	    doc.body.innerHTML = resource;
	    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
	      HTMLTemplateElement.bootstrap(doc);
	    }
	    return doc;
	  }
	  if (!document.baseURI) {
	    var baseURIDescriptor = {
	      get: function() {
	        var base = document.querySelector("base");
	        return base ? base.href : window.location.href;
	      },
	      configurable: true
	    };
	    Object.defineProperty(document, "baseURI", baseURIDescriptor);
	    Object.defineProperty(rootDocument, "baseURI", baseURIDescriptor);
	  }
	  scope.importer = importer;
	  scope.importLoader = importLoader;
	});

	window.HTMLImports.addModule(function(scope) {
	  var parser = scope.parser;
	  var importer = scope.importer;
	  var dynamic = {
	    added: function(nodes) {
	      var owner, parsed, loading;
	      for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
	        if (!owner) {
	          owner = n.ownerDocument;
	          parsed = parser.isParsed(owner);
	        }
	        loading = this.shouldLoadNode(n);
	        if (loading) {
	          importer.loadNode(n);
	        }
	        if (this.shouldParseNode(n) && parsed) {
	          parser.parseDynamic(n, loading);
	        }
	      }
	    },
	    shouldLoadNode: function(node) {
	      return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
	    },
	    shouldParseNode: function(node) {
	      return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
	    }
	  };
	  importer.observer.addCallback = dynamic.added.bind(dynamic);
	  var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
	});

	(function(scope) {
	  var initializeModules = scope.initializeModules;
	  var isIE = scope.isIE;
	  if (scope.useNative) {
	    return;
	  }
	  initializeModules();
	  var rootDocument = scope.rootDocument;
	  function bootstrap() {
	    window.HTMLImports.importer.bootDocument(rootDocument);
	  }
	  if (document.readyState === "complete" || document.readyState === "interactive" && !window.attachEvent) {
	    bootstrap();
	  } else {
	    document.addEventListener("DOMContentLoaded", bootstrap);
	  }
	})(window.HTMLImports);

	window.CustomElements = window.CustomElements || {
	  flags: {}
	};

	(function(scope) {
	  var flags = scope.flags;
	  var modules = [];
	  var addModule = function(module) {
	    modules.push(module);
	  };
	  var initializeModules = function() {
	    modules.forEach(function(module) {
	      module(scope);
	    });
	  };
	  scope.addModule = addModule;
	  scope.initializeModules = initializeModules;
	  scope.hasNative = Boolean(document.registerElement);
	  scope.isIE = /Trident/.test(navigator.userAgent);
	  scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
	})(window.CustomElements);

	window.CustomElements.addModule(function(scope) {
	  var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : "none";
	  function forSubtree(node, cb) {
	    findAllElements(node, function(e) {
	      if (cb(e)) {
	        return true;
	      }
	      forRoots(e, cb);
	    });
	    forRoots(node, cb);
	  }
	  function findAllElements(node, find, data) {
	    var e = node.firstElementChild;
	    if (!e) {
	      e = node.firstChild;
	      while (e && e.nodeType !== Node.ELEMENT_NODE) {
	        e = e.nextSibling;
	      }
	    }
	    while (e) {
	      if (find(e, data) !== true) {
	        findAllElements(e, find, data);
	      }
	      e = e.nextElementSibling;
	    }
	    return null;
	  }
	  function forRoots(node, cb) {
	    var root = node.shadowRoot;
	    while (root) {
	      forSubtree(root, cb);
	      root = root.olderShadowRoot;
	    }
	  }
	  function forDocumentTree(doc, cb) {
	    _forDocumentTree(doc, cb, []);
	  }
	  function _forDocumentTree(doc, cb, processingDocuments) {
	    doc = window.wrap(doc);
	    if (processingDocuments.indexOf(doc) >= 0) {
	      return;
	    }
	    processingDocuments.push(doc);
	    var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
	    for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
	      if (n.import) {
	        _forDocumentTree(n.import, cb, processingDocuments);
	      }
	    }
	    cb(doc);
	  }
	  scope.forDocumentTree = forDocumentTree;
	  scope.forSubtree = forSubtree;
	});

	window.CustomElements.addModule(function(scope) {
	  var flags = scope.flags;
	  var forSubtree = scope.forSubtree;
	  var forDocumentTree = scope.forDocumentTree;
	  function addedNode(node, isAttached) {
	    return added(node, isAttached) || addedSubtree(node, isAttached);
	  }
	  function added(node, isAttached) {
	    if (scope.upgrade(node, isAttached)) {
	      return true;
	    }
	    if (isAttached) {
	      attached(node);
	    }
	  }
	  function addedSubtree(node, isAttached) {
	    forSubtree(node, function(e) {
	      if (added(e, isAttached)) {
	        return true;
	      }
	    });
	  }
	  var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags["throttle-attached"];
	  scope.hasPolyfillMutations = hasThrottledAttached;
	  scope.hasThrottledAttached = hasThrottledAttached;
	  var isPendingMutations = false;
	  var pendingMutations = [];
	  function deferMutation(fn) {
	    pendingMutations.push(fn);
	    if (!isPendingMutations) {
	      isPendingMutations = true;
	      setTimeout(takeMutations);
	    }
	  }
	  function takeMutations() {
	    isPendingMutations = false;
	    var $p = pendingMutations;
	    for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
	      p();
	    }
	    pendingMutations = [];
	  }
	  function attached(element) {
	    if (hasThrottledAttached) {
	      deferMutation(function() {
	        _attached(element);
	      });
	    } else {
	      _attached(element);
	    }
	  }
	  function _attached(element) {
	    if (element.__upgraded__ && !element.__attached) {
	      element.__attached = true;
	      if (element.attachedCallback) {
	        element.attachedCallback();
	      }
	    }
	  }
	  function detachedNode(node) {
	    detached(node);
	    forSubtree(node, function(e) {
	      detached(e);
	    });
	  }
	  function detached(element) {
	    if (hasThrottledAttached) {
	      deferMutation(function() {
	        _detached(element);
	      });
	    } else {
	      _detached(element);
	    }
	  }
	  function _detached(element) {
	    if (element.__upgraded__ && element.__attached) {
	      element.__attached = false;
	      if (element.detachedCallback) {
	        element.detachedCallback();
	      }
	    }
	  }
	  function inDocument(element) {
	    var p = element;
	    var doc = window.wrap(document);
	    while (p) {
	      if (p == doc) {
	        return true;
	      }
	      p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
	    }
	  }
	  function watchShadow(node) {
	    if (node.shadowRoot && !node.shadowRoot.__watched) {
	      flags.dom && console.log("watching shadow-root for: ", node.localName);
	      var root = node.shadowRoot;
	      while (root) {
	        observe(root);
	        root = root.olderShadowRoot;
	      }
	    }
	  }
	  function handler(root, mutations) {
	    if (flags.dom) {
	      var mx = mutations[0];
	      if (mx && mx.type === "childList" && mx.addedNodes) {
	        if (mx.addedNodes) {
	          var d = mx.addedNodes[0];
	          while (d && d !== document && !d.host) {
	            d = d.parentNode;
	          }
	          var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
	          u = u.split("/?").shift().split("/").pop();
	        }
	      }
	      console.group("mutations (%d) [%s]", mutations.length, u || "");
	    }
	    var isAttached = inDocument(root);
	    mutations.forEach(function(mx) {
	      if (mx.type === "childList") {
	        forEach(mx.addedNodes, function(n) {
	          if (!n.localName) {
	            return;
	          }
	          addedNode(n, isAttached);
	        });
	        forEach(mx.removedNodes, function(n) {
	          if (!n.localName) {
	            return;
	          }
	          detachedNode(n);
	        });
	      }
	    });
	    flags.dom && console.groupEnd();
	  }
	  function takeRecords(node) {
	    node = window.wrap(node);
	    if (!node) {
	      node = window.wrap(document);
	    }
	    while (node.parentNode) {
	      node = node.parentNode;
	    }
	    var observer = node.__observer;
	    if (observer) {
	      handler(node, observer.takeRecords());
	      takeMutations();
	    }
	  }
	  var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
	  function observe(inRoot) {
	    if (inRoot.__observer) {
	      return;
	    }
	    var observer = new MutationObserver(handler.bind(this, inRoot));
	    observer.observe(inRoot, {
	      childList: true,
	      subtree: true
	    });
	    inRoot.__observer = observer;
	  }
	  function upgradeDocument(doc) {
	    doc = window.wrap(doc);
	    flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
	    var isMainDocument = doc === window.wrap(document);
	    addedNode(doc, isMainDocument);
	    observe(doc);
	    flags.dom && console.groupEnd();
	  }
	  function upgradeDocumentTree(doc) {
	    forDocumentTree(doc, upgradeDocument);
	  }
	  var originalCreateShadowRoot = Element.prototype.createShadowRoot;
	  if (originalCreateShadowRoot) {
	    Element.prototype.createShadowRoot = function() {
	      var root = originalCreateShadowRoot.call(this);
	      window.CustomElements.watchShadow(this);
	      return root;
	    };
	  }
	  scope.watchShadow = watchShadow;
	  scope.upgradeDocumentTree = upgradeDocumentTree;
	  scope.upgradeDocument = upgradeDocument;
	  scope.upgradeSubtree = addedSubtree;
	  scope.upgradeAll = addedNode;
	  scope.attached = attached;
	  scope.takeRecords = takeRecords;
	});

	window.CustomElements.addModule(function(scope) {
	  var flags = scope.flags;
	  function upgrade(node, isAttached) {
	    if (node.localName === "template") {
	      if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
	        HTMLTemplateElement.decorate(node);
	      }
	    }
	    if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
	      var is = node.getAttribute("is");
	      var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
	      if (definition) {
	        if (is && definition.tag == node.localName || !is && !definition.extends) {
	          return upgradeWithDefinition(node, definition, isAttached);
	        }
	      }
	    }
	  }
	  function upgradeWithDefinition(element, definition, isAttached) {
	    flags.upgrade && console.group("upgrade:", element.localName);
	    if (definition.is) {
	      element.setAttribute("is", definition.is);
	    }
	    implementPrototype(element, definition);
	    element.__upgraded__ = true;
	    created(element);
	    if (isAttached) {
	      scope.attached(element);
	    }
	    scope.upgradeSubtree(element, isAttached);
	    flags.upgrade && console.groupEnd();
	    return element;
	  }
	  function implementPrototype(element, definition) {
	    if (Object.__proto__) {
	      element.__proto__ = definition.prototype;
	    } else {
	      customMixin(element, definition.prototype, definition.native);
	      element.__proto__ = definition.prototype;
	    }
	  }
	  function customMixin(inTarget, inSrc, inNative) {
	    var used = {};
	    var p = inSrc;
	    while (p !== inNative && p !== HTMLElement.prototype) {
	      var keys = Object.getOwnPropertyNames(p);
	      for (var i = 0, k; k = keys[i]; i++) {
	        if (!used[k]) {
	          Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
	          used[k] = 1;
	        }
	      }
	      p = Object.getPrototypeOf(p);
	    }
	  }
	  function created(element) {
	    if (element.createdCallback) {
	      element.createdCallback();
	    }
	  }
	  scope.upgrade = upgrade;
	  scope.upgradeWithDefinition = upgradeWithDefinition;
	  scope.implementPrototype = implementPrototype;
	});

	window.CustomElements.addModule(function(scope) {
	  var isIE = scope.isIE;
	  var upgradeDocumentTree = scope.upgradeDocumentTree;
	  var upgradeAll = scope.upgradeAll;
	  var upgradeWithDefinition = scope.upgradeWithDefinition;
	  var implementPrototype = scope.implementPrototype;
	  var useNative = scope.useNative;
	  function register(name, options) {
	    var definition = options || {};
	    if (!name) {
	      throw new Error("document.registerElement: first argument `name` must not be empty");
	    }
	    if (name.indexOf("-") < 0) {
	      throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
	    }
	    if (isReservedTag(name)) {
	      throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
	    }
	    if (getRegisteredDefinition(name)) {
	      throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
	    }
	    if (!definition.prototype) {
	      definition.prototype = Object.create(HTMLElement.prototype);
	    }
	    definition.__name = name.toLowerCase();
	    if (definition.extends) {
	      definition.extends = definition.extends.toLowerCase();
	    }
	    definition.lifecycle = definition.lifecycle || {};
	    definition.ancestry = ancestry(definition.extends);
	    resolveTagName(definition);
	    resolvePrototypeChain(definition);
	    overrideAttributeApi(definition.prototype);
	    registerDefinition(definition.__name, definition);
	    definition.ctor = generateConstructor(definition);
	    definition.ctor.prototype = definition.prototype;
	    definition.prototype.constructor = definition.ctor;
	    if (scope.ready) {
	      upgradeDocumentTree(document);
	    }
	    return definition.ctor;
	  }
	  function overrideAttributeApi(prototype) {
	    if (prototype.setAttribute._polyfilled) {
	      return;
	    }
	    var setAttribute = prototype.setAttribute;
	    prototype.setAttribute = function(name, value) {
	      changeAttribute.call(this, name, value, setAttribute);
	    };
	    var removeAttribute = prototype.removeAttribute;
	    prototype.removeAttribute = function(name) {
	      changeAttribute.call(this, name, null, removeAttribute);
	    };
	    prototype.setAttribute._polyfilled = true;
	  }
	  function changeAttribute(name, value, operation) {
	    name = name.toLowerCase();
	    var oldValue = this.getAttribute(name);
	    operation.apply(this, arguments);
	    var newValue = this.getAttribute(name);
	    if (this.attributeChangedCallback && newValue !== oldValue) {
	      this.attributeChangedCallback(name, oldValue, newValue);
	    }
	  }
	  function isReservedTag(name) {
	    for (var i = 0; i < reservedTagList.length; i++) {
	      if (name === reservedTagList[i]) {
	        return true;
	      }
	    }
	  }
	  var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
	  function ancestry(extnds) {
	    var extendee = getRegisteredDefinition(extnds);
	    if (extendee) {
	      return ancestry(extendee.extends).concat([ extendee ]);
	    }
	    return [];
	  }
	  function resolveTagName(definition) {
	    var baseTag = definition.extends;
	    for (var i = 0, a; a = definition.ancestry[i]; i++) {
	      baseTag = a.is && a.tag;
	    }
	    definition.tag = baseTag || definition.__name;
	    if (baseTag) {
	      definition.is = definition.__name;
	    }
	  }
	  function resolvePrototypeChain(definition) {
	    if (!Object.__proto__) {
	      var nativePrototype = HTMLElement.prototype;
	      if (definition.is) {
	        var inst = document.createElement(definition.tag);
	        nativePrototype = Object.getPrototypeOf(inst);
	      }
	      var proto = definition.prototype, ancestor;
	      var foundPrototype = false;
	      while (proto) {
	        if (proto == nativePrototype) {
	          foundPrototype = true;
	        }
	        ancestor = Object.getPrototypeOf(proto);
	        if (ancestor) {
	          proto.__proto__ = ancestor;
	        }
	        proto = ancestor;
	      }
	      if (!foundPrototype) {
	        console.warn(definition.tag + " prototype not found in prototype chain for " + definition.is);
	      }
	      definition.native = nativePrototype;
	    }
	  }
	  function instantiate(definition) {
	    return upgradeWithDefinition(domCreateElement(definition.tag), definition);
	  }
	  var registry = {};
	  function getRegisteredDefinition(name) {
	    if (name) {
	      return registry[name.toLowerCase()];
	    }
	  }
	  function registerDefinition(name, definition) {
	    registry[name] = definition;
	  }
	  function generateConstructor(definition) {
	    return function() {
	      return instantiate(definition);
	    };
	  }
	  var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
	  function createElementNS(namespace, tag, typeExtension) {
	    if (namespace === HTML_NAMESPACE) {
	      return createElement(tag, typeExtension);
	    } else {
	      return domCreateElementNS(namespace, tag);
	    }
	  }
	  function createElement(tag, typeExtension) {
	    if (tag) {
	      tag = tag.toLowerCase();
	    }
	    if (typeExtension) {
	      typeExtension = typeExtension.toLowerCase();
	    }
	    var definition = getRegisteredDefinition(typeExtension || tag);
	    if (definition) {
	      if (tag == definition.tag && typeExtension == definition.is) {
	        return new definition.ctor();
	      }
	      if (!typeExtension && !definition.is) {
	        return new definition.ctor();
	      }
	    }
	    var element;
	    if (typeExtension) {
	      element = createElement(tag);
	      element.setAttribute("is", typeExtension);
	      return element;
	    }
	    element = domCreateElement(tag);
	    if (tag.indexOf("-") >= 0) {
	      implementPrototype(element, HTMLElement);
	    }
	    return element;
	  }
	  var domCreateElement = document.createElement.bind(document);
	  var domCreateElementNS = document.createElementNS.bind(document);
	  var isInstance;
	  if (!Object.__proto__ && !useNative) {
	    isInstance = function(obj, ctor) {
	      if (obj instanceof ctor) {
	        return true;
	      }
	      var p = obj;
	      while (p) {
	        if (p === ctor.prototype) {
	          return true;
	        }
	        p = p.__proto__;
	      }
	      return false;
	    };
	  } else {
	    isInstance = function(obj, base) {
	      return obj instanceof base;
	    };
	  }
	  function wrapDomMethodToForceUpgrade(obj, methodName) {
	    var orig = obj[methodName];
	    obj[methodName] = function() {
	      var n = orig.apply(this, arguments);
	      upgradeAll(n);
	      return n;
	    };
	  }
	  wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
	  wrapDomMethodToForceUpgrade(document, "importNode");
	  document.registerElement = register;
	  document.createElement = createElement;
	  document.createElementNS = createElementNS;
	  scope.registry = registry;
	  scope.instanceof = isInstance;
	  scope.reservedTagList = reservedTagList;
	  scope.getRegisteredDefinition = getRegisteredDefinition;
	  document.register = document.registerElement;
	});

	(function(scope) {
	  var useNative = scope.useNative;
	  var initializeModules = scope.initializeModules;
	  var isIE = scope.isIE;
	  if (useNative) {
	    var nop = function() {};
	    scope.watchShadow = nop;
	    scope.upgrade = nop;
	    scope.upgradeAll = nop;
	    scope.upgradeDocumentTree = nop;
	    scope.upgradeSubtree = nop;
	    scope.takeRecords = nop;
	    scope.instanceof = function(obj, base) {
	      return obj instanceof base;
	    };
	  } else {
	    initializeModules();
	  }
	  var upgradeDocumentTree = scope.upgradeDocumentTree;
	  var upgradeDocument = scope.upgradeDocument;
	  if (!window.wrap) {
	    if (window.ShadowDOMPolyfill) {
	      window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
	      window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
	    } else {
	      window.wrap = window.unwrap = function(node) {
	        return node;
	      };
	    }
	  }
	  if (window.HTMLImports) {
	    window.HTMLImports.__importsParsingHook = function(elt) {
	      if (elt.import) {
	        upgradeDocument(wrap(elt.import));
	      }
	    };
	  }
	  function bootstrap() {
	    upgradeDocumentTree(window.wrap(document));
	    window.CustomElements.ready = true;
	    var requestAnimationFrame = window.requestAnimationFrame || function(f) {
	      setTimeout(f, 16);
	    };
	    requestAnimationFrame(function() {
	      setTimeout(function() {
	        window.CustomElements.readyTime = Date.now();
	        if (window.HTMLImports) {
	          window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
	        }
	        document.dispatchEvent(new CustomEvent("WebComponentsReady", {
	          bubbles: true
	        }));
	      });
	    });
	  }
	  if (document.readyState === "complete" || scope.flags.eager) {
	    bootstrap();
	  } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
	    bootstrap();
	  } else {
	    var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
	    window.addEventListener(loadEvent, bootstrap);
	  }
	})(window.CustomElements);

	(function(scope) {
	  var style = document.createElement("style");
	  style.textContent = "" + "body {" + "transition: opacity ease-in 0.2s;" + " } \n" + "body[unresolved] {" + "opacity: 0; display: block; overflow: hidden; position: relative;" + " } \n";
	  var head = document.querySelector("head");
	  head.insertBefore(style, head.firstChild);
	})(window.WebComponents);

	/**
	 * Common utilities
	 * @module glMatrix
	 */

	// Configuration Constants
	var EPSILON = 0.000001;
	var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
	var RANDOM = Math.random;

	var degree = Math.PI / 180;

	/**
	 * 3x3 Matrix
	 * @module mat3
	 */

	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */
	function create$2() {
	  var out = new ARRAY_TYPE(9);
	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	  }
	  out[0] = 1;
	  out[4] = 1;
	  out[8] = 1;
	  return out;
	}

	/**
	 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
	 * @module mat4
	 */

	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */
	function create$3() {
	  var out = new ARRAY_TYPE(16);
	  if (ARRAY_TYPE != Float32Array) {
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	  }
	  out[0] = 1;
	  out[5] = 1;
	  out[10] = 1;
	  out[15] = 1;
	  return out;
	}

	/**
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {mat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */
	function clone$3(a) {
	  var out = new ARRAY_TYPE(16);
	  out[0] = a[0];
	  out[1] = a[1];
	  out[2] = a[2];
	  out[3] = a[3];
	  out[4] = a[4];
	  out[5] = a[5];
	  out[6] = a[6];
	  out[7] = a[7];
	  out[8] = a[8];
	  out[9] = a[9];
	  out[10] = a[10];
	  out[11] = a[11];
	  out[12] = a[12];
	  out[13] = a[13];
	  out[14] = a[14];
	  out[15] = a[15];
	  return out;
	}

	/**
	 * Create a new mat4 with the given values
	 *
	 * @param {Number} m00 Component in column 0, row 0 position (index 0)
	 * @param {Number} m01 Component in column 0, row 1 position (index 1)
	 * @param {Number} m02 Component in column 0, row 2 position (index 2)
	 * @param {Number} m03 Component in column 0, row 3 position (index 3)
	 * @param {Number} m10 Component in column 1, row 0 position (index 4)
	 * @param {Number} m11 Component in column 1, row 1 position (index 5)
	 * @param {Number} m12 Component in column 1, row 2 position (index 6)
	 * @param {Number} m13 Component in column 1, row 3 position (index 7)
	 * @param {Number} m20 Component in column 2, row 0 position (index 8)
	 * @param {Number} m21 Component in column 2, row 1 position (index 9)
	 * @param {Number} m22 Component in column 2, row 2 position (index 10)
	 * @param {Number} m23 Component in column 2, row 3 position (index 11)
	 * @param {Number} m30 Component in column 3, row 0 position (index 12)
	 * @param {Number} m31 Component in column 3, row 1 position (index 13)
	 * @param {Number} m32 Component in column 3, row 2 position (index 14)
	 * @param {Number} m33 Component in column 3, row 3 position (index 15)
	 * @returns {mat4} A new mat4
	 */
	function fromValues$3(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
	  var out = new ARRAY_TYPE(16);
	  out[0] = m00;
	  out[1] = m01;
	  out[2] = m02;
	  out[3] = m03;
	  out[4] = m10;
	  out[5] = m11;
	  out[6] = m12;
	  out[7] = m13;
	  out[8] = m20;
	  out[9] = m21;
	  out[10] = m22;
	  out[11] = m23;
	  out[12] = m30;
	  out[13] = m31;
	  out[14] = m32;
	  out[15] = m33;
	  return out;
	}

	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */
	function identity$3(out) {
	  out[0] = 1;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = 1;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 1;
	  out[11] = 0;
	  out[12] = 0;
	  out[13] = 0;
	  out[14] = 0;
	  out[15] = 1;
	  return out;
	}

	/**
	 * Inverts a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	function invert$3(out, a) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];

	  var b00 = a00 * a11 - a01 * a10;
	  var b01 = a00 * a12 - a02 * a10;
	  var b02 = a00 * a13 - a03 * a10;
	  var b03 = a01 * a12 - a02 * a11;
	  var b04 = a01 * a13 - a03 * a11;
	  var b05 = a02 * a13 - a03 * a12;
	  var b06 = a20 * a31 - a21 * a30;
	  var b07 = a20 * a32 - a22 * a30;
	  var b08 = a20 * a33 - a23 * a30;
	  var b09 = a21 * a32 - a22 * a31;
	  var b10 = a21 * a33 - a23 * a31;
	  var b11 = a22 * a33 - a23 * a32;

	  // Calculate the determinant
	  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

	  if (!det) {
	    return null;
	  }
	  det = 1.0 / det;

	  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

	  return out;
	}

	/**
	 * Multiplies two mat4s
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	function multiply$3(out, a, b) {
	  var a00 = a[0],
	      a01 = a[1],
	      a02 = a[2],
	      a03 = a[3];
	  var a10 = a[4],
	      a11 = a[5],
	      a12 = a[6],
	      a13 = a[7];
	  var a20 = a[8],
	      a21 = a[9],
	      a22 = a[10],
	      a23 = a[11];
	  var a30 = a[12],
	      a31 = a[13],
	      a32 = a[14],
	      a33 = a[15];

	  // Cache only the current line of the second matrix
	  var b0 = b[0],
	      b1 = b[1],
	      b2 = b[2],
	      b3 = b[3];
	  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	  b0 = b[4];b1 = b[5];b2 = b[6];b3 = b[7];
	  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	  b0 = b[8];b1 = b[9];b2 = b[10];b3 = b[11];
	  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

	  b0 = b[12];b1 = b[13];b2 = b[14];b3 = b[15];
	  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
	  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
	  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
	  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
	  return out;
	}

	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to translate
	 * @param {vec3} v vector to translate by
	 * @returns {mat4} out
	 */
	function translate$2(out, a, v) {
	  var x = v[0],
	      y = v[1],
	      z = v[2];
	  var a00 = void 0,
	      a01 = void 0,
	      a02 = void 0,
	      a03 = void 0;
	  var a10 = void 0,
	      a11 = void 0,
	      a12 = void 0,
	      a13 = void 0;
	  var a20 = void 0,
	      a21 = void 0,
	      a22 = void 0,
	      a23 = void 0;

	  if (a === out) {
	    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	  } else {
	    a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
	    a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
	    a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

	    out[0] = a00;out[1] = a01;out[2] = a02;out[3] = a03;
	    out[4] = a10;out[5] = a11;out[6] = a12;out[7] = a13;
	    out[8] = a20;out[9] = a21;out[10] = a22;out[11] = a23;

	    out[12] = a00 * x + a10 * y + a20 * z + a[12];
	    out[13] = a01 * x + a11 * y + a21 * z + a[13];
	    out[14] = a02 * x + a12 * y + a22 * z + a[14];
	    out[15] = a03 * x + a13 * y + a23 * z + a[15];
	  }

	  return out;
	}

	/**
	 * Rotates a mat4 by the given angle around the given axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	function rotate$3(out, a, rad, axis) {
	  var x = axis[0],
	      y = axis[1],
	      z = axis[2];
	  var len = Math.sqrt(x * x + y * y + z * z);
	  var s = void 0,
	      c = void 0,
	      t = void 0;
	  var a00 = void 0,
	      a01 = void 0,
	      a02 = void 0,
	      a03 = void 0;
	  var a10 = void 0,
	      a11 = void 0,
	      a12 = void 0,
	      a13 = void 0;
	  var a20 = void 0,
	      a21 = void 0,
	      a22 = void 0,
	      a23 = void 0;
	  var b00 = void 0,
	      b01 = void 0,
	      b02 = void 0;
	  var b10 = void 0,
	      b11 = void 0,
	      b12 = void 0;
	  var b20 = void 0,
	      b21 = void 0,
	      b22 = void 0;

	  if (len < EPSILON) {
	    return null;
	  }

	  len = 1 / len;
	  x *= len;
	  y *= len;
	  z *= len;

	  s = Math.sin(rad);
	  c = Math.cos(rad);
	  t = 1 - c;

	  a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
	  a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
	  a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

	  // Construct the elements of the rotation matrix
	  b00 = x * x * t + c;b01 = y * x * t + z * s;b02 = z * x * t - y * s;
	  b10 = x * y * t - z * s;b11 = y * y * t + c;b12 = z * y * t + x * s;
	  b20 = x * z * t + y * s;b21 = y * z * t - x * s;b22 = z * z * t + c;

	  // Perform rotation-specific matrix multiplication
	  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged last row
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  }
	  return out;
	}

	/**
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function rotateX(out, a, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  var a10 = a[4];
	  var a11 = a[5];
	  var a12 = a[6];
	  var a13 = a[7];
	  var a20 = a[8];
	  var a21 = a[9];
	  var a22 = a[10];
	  var a23 = a[11];

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged rows
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  }

	  // Perform axis-specific matrix multiplication
	  out[4] = a10 * c + a20 * s;
	  out[5] = a11 * c + a21 * s;
	  out[6] = a12 * c + a22 * s;
	  out[7] = a13 * c + a23 * s;
	  out[8] = a20 * c - a10 * s;
	  out[9] = a21 * c - a11 * s;
	  out[10] = a22 * c - a12 * s;
	  out[11] = a23 * c - a13 * s;
	  return out;
	}

	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	function rotateY(out, a, rad) {
	  var s = Math.sin(rad);
	  var c = Math.cos(rad);
	  var a00 = a[0];
	  var a01 = a[1];
	  var a02 = a[2];
	  var a03 = a[3];
	  var a20 = a[8];
	  var a21 = a[9];
	  var a22 = a[10];
	  var a23 = a[11];

	  if (a !== out) {
	    // If the source and destination differ, copy the unchanged rows
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	  }

	  // Perform axis-specific matrix multiplication
	  out[0] = a00 * c - a20 * s;
	  out[1] = a01 * c - a21 * s;
	  out[2] = a02 * c - a22 * s;
	  out[3] = a03 * c - a23 * s;
	  out[8] = a00 * s + a20 * c;
	  out[9] = a01 * s + a21 * c;
	  out[10] = a02 * s + a22 * c;
	  out[11] = a03 * s + a23 * c;
	  return out;
	}

	/**
	 * Generates a orthogonal projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	function ortho(out, left, right, bottom, top, near, far) {
	  var lr = 1 / (left - right);
	  var bt = 1 / (bottom - top);
	  var nf = 1 / (near - far);
	  out[0] = -2 * lr;
	  out[1] = 0;
	  out[2] = 0;
	  out[3] = 0;
	  out[4] = 0;
	  out[5] = -2 * bt;
	  out[6] = 0;
	  out[7] = 0;
	  out[8] = 0;
	  out[9] = 0;
	  out[10] = 2 * nf;
	  out[11] = 0;
	  out[12] = (left + right) * lr;
	  out[13] = (top + bottom) * bt;
	  out[14] = (far + near) * nf;
	  out[15] = 1;
	  return out;
	}

	/**
	 * Generates a look-at matrix with the given eye position, focal point, and up axis.
	 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {vec3} eye Position of the viewer
	 * @param {vec3} center Point the viewer is looking at
	 * @param {vec3} up vec3 pointing up
	 * @returns {mat4} out
	 */
	function lookAt(out, eye, center, up) {
	  var x0 = void 0,
	      x1 = void 0,
	      x2 = void 0,
	      y0 = void 0,
	      y1 = void 0,
	      y2 = void 0,
	      z0 = void 0,
	      z1 = void 0,
	      z2 = void 0,
	      len = void 0;
	  var eyex = eye[0];
	  var eyey = eye[1];
	  var eyez = eye[2];
	  var upx = up[0];
	  var upy = up[1];
	  var upz = up[2];
	  var centerx = center[0];
	  var centery = center[1];
	  var centerz = center[2];

	  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
	    return identity$3(out);
	  }

	  z0 = eyex - centerx;
	  z1 = eyey - centery;
	  z2 = eyez - centerz;

	  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	  z0 *= len;
	  z1 *= len;
	  z2 *= len;

	  x0 = upy * z2 - upz * z1;
	  x1 = upz * z0 - upx * z2;
	  x2 = upx * z1 - upy * z0;
	  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	  if (!len) {
	    x0 = 0;
	    x1 = 0;
	    x2 = 0;
	  } else {
	    len = 1 / len;
	    x0 *= len;
	    x1 *= len;
	    x2 *= len;
	  }

	  y0 = z1 * x2 - z2 * x1;
	  y1 = z2 * x0 - z0 * x2;
	  y2 = z0 * x1 - z1 * x0;

	  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	  if (!len) {
	    y0 = 0;
	    y1 = 0;
	    y2 = 0;
	  } else {
	    len = 1 / len;
	    y0 *= len;
	    y1 *= len;
	    y2 *= len;
	  }

	  out[0] = x0;
	  out[1] = y0;
	  out[2] = z0;
	  out[3] = 0;
	  out[4] = x1;
	  out[5] = y1;
	  out[6] = z1;
	  out[7] = 0;
	  out[8] = x2;
	  out[9] = y2;
	  out[10] = z2;
	  out[11] = 0;
	  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	  out[15] = 1;

	  return out;
	}

	/**
	 * 3 Dimensional Vector
	 * @module vec3
	 */

	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	function create$4() {
	  var out = new ARRAY_TYPE(3);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  return out;
	}

	/**
	 * Calculates the length of a vec3
	 *
	 * @param {vec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	function length(a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  return Math.sqrt(x * x + y * y + z * z);
	}

	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	function fromValues$4(x, y, z) {
	  var out = new ARRAY_TYPE(3);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  return out;
	}

	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} distance between a and b
	 */
	function distance(a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  var z = b[2] - a[2];
	  return Math.sqrt(x * x + y * y + z * z);
	}

	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	function normalize(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var len = x * x + y * y + z * z;
	  if (len > 0) {
	    //TODO: evaluate use of glm_invsqrt here?
	    len = 1 / Math.sqrt(len);
	    out[0] = a[0] * len;
	    out[1] = a[1] * len;
	    out[2] = a[2] * len;
	  }
	  return out;
	}

	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	function dot(a, b) {
	  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	}

	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	function cross(out, a, b) {
	  var ax = a[0],
	      ay = a[1],
	      az = a[2];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2];

	  out[0] = ay * bz - az * by;
	  out[1] = az * bx - ax * bz;
	  out[2] = ax * by - ay * bx;
	  return out;
	}

	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec3} out
	 */
	function random(out, scale) {
	  scale = scale || 1.0;

	  var r = RANDOM() * 2.0 * Math.PI;
	  var z = RANDOM() * 2.0 - 1.0;
	  var zScale = Math.sqrt(1.0 - z * z) * scale;

	  out[0] = Math.cos(r) * zScale;
	  out[1] = Math.sin(r) * zScale;
	  out[2] = z * scale;
	  return out;
	}

	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */
	var len = length;

	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach = function () {
	  var vec = create$4();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 3;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
	    }

	    return a;
	  };
	}();

	/**
	 * 4 Dimensional Vector
	 * @module vec4
	 */

	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */
	function create$5() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	  }
	  return out;
	}

	/**
	 * Creates a new vec4 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} a new 4D vector
	 */
	function fromValues$5(x, y, z, w) {
	  var out = new ARRAY_TYPE(4);
	  out[0] = x;
	  out[1] = y;
	  out[2] = z;
	  out[3] = w;
	  return out;
	}

	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to normalize
	 * @returns {vec4} out
	 */
	function normalize$1(out, a) {
	  var x = a[0];
	  var y = a[1];
	  var z = a[2];
	  var w = a[3];
	  var len = x * x + y * y + z * z + w * w;
	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    out[0] = x * len;
	    out[1] = y * len;
	    out[2] = z * len;
	    out[3] = w * len;
	  }
	  return out;
	}

	/**
	 * Transforms the vec4 with a mat4.
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec4} out
	 */
	function transformMat4$1(out, a, m) {
	  var x = a[0],
	      y = a[1],
	      z = a[2],
	      w = a[3];
	  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
	  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
	  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
	  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
	  return out;
	}

	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$1 = function () {
	  var vec = create$5();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 4;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
	    }

	    return a;
	  };
	}();

	/**
	 * Quaternion
	 * @module quat
	 */

	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */
	function create$6() {
	  var out = new ARRAY_TYPE(4);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	  }
	  out[3] = 1;
	  return out;
	}

	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {vec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/
	function setAxisAngle(out, axis, rad) {
	  rad = rad * 0.5;
	  var s = Math.sin(rad);
	  out[0] = s * axis[0];
	  out[1] = s * axis[1];
	  out[2] = s * axis[2];
	  out[3] = Math.cos(rad);
	  return out;
	}

	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	function slerp(out, a, b, t) {
	  // benchmarks:
	  //    http://jsperf.com/quaternion-slerp-implementations
	  var ax = a[0],
	      ay = a[1],
	      az = a[2],
	      aw = a[3];
	  var bx = b[0],
	      by = b[1],
	      bz = b[2],
	      bw = b[3];

	  var omega = void 0,
	      cosom = void 0,
	      sinom = void 0,
	      scale0 = void 0,
	      scale1 = void 0;

	  // calc cosine
	  cosom = ax * bx + ay * by + az * bz + aw * bw;
	  // adjust signs (if necessary)
	  if (cosom < 0.0) {
	    cosom = -cosom;
	    bx = -bx;
	    by = -by;
	    bz = -bz;
	    bw = -bw;
	  }
	  // calculate coefficients
	  if (1.0 - cosom > EPSILON) {
	    // standard case (slerp)
	    omega = Math.acos(cosom);
	    sinom = Math.sin(omega);
	    scale0 = Math.sin((1.0 - t) * omega) / sinom;
	    scale1 = Math.sin(t * omega) / sinom;
	  } else {
	    // "from" and "to" quaternions are very close
	    //  ... so we can do a linear interpolation
	    scale0 = 1.0 - t;
	    scale1 = t;
	  }
	  // calculate final values
	  out[0] = scale0 * ax + scale1 * bx;
	  out[1] = scale0 * ay + scale1 * by;
	  out[2] = scale0 * az + scale1 * bz;
	  out[3] = scale0 * aw + scale1 * bw;

	  return out;
	}

	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {mat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */
	function fromMat3(out, m) {
	  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	  // article "Quaternion Calculus and Fast Animation".
	  var fTrace = m[0] + m[4] + m[8];
	  var fRoot = void 0;

	  if (fTrace > 0.0) {
	    // |w| > 1/2, may as well choose w > 1/2
	    fRoot = Math.sqrt(fTrace + 1.0); // 2w
	    out[3] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot; // 1/(4w)
	    out[0] = (m[5] - m[7]) * fRoot;
	    out[1] = (m[6] - m[2]) * fRoot;
	    out[2] = (m[1] - m[3]) * fRoot;
	  } else {
	    // |w| <= 1/2
	    var i = 0;
	    if (m[4] > m[0]) i = 1;
	    if (m[8] > m[i * 3 + i]) i = 2;
	    var j = (i + 1) % 3;
	    var k = (i + 2) % 3;

	    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
	    out[i] = 0.5 * fRoot;
	    fRoot = 0.5 / fRoot;
	    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
	    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
	    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	  }

	  return out;
	}

	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */
	var normalize$2 = normalize$1;

	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {vec3} a the initial vector
	 * @param {vec3} b the destination vector
	 * @returns {quat} out
	 */
	var rotationTo = function () {
	  var tmpvec3 = create$4();
	  var xUnitVec3 = fromValues$4(1, 0, 0);
	  var yUnitVec3 = fromValues$4(0, 1, 0);

	  return function (out, a, b) {
	    var dot$$1 = dot(a, b);
	    if (dot$$1 < -0.999999) {
	      cross(tmpvec3, xUnitVec3, a);
	      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
	      normalize(tmpvec3, tmpvec3);
	      setAxisAngle(out, tmpvec3, Math.PI);
	      return out;
	    } else if (dot$$1 > 0.999999) {
	      out[0] = 0;
	      out[1] = 0;
	      out[2] = 0;
	      out[3] = 1;
	      return out;
	    } else {
	      cross(tmpvec3, a, b);
	      out[0] = tmpvec3[0];
	      out[1] = tmpvec3[1];
	      out[2] = tmpvec3[2];
	      out[3] = 1 + dot$$1;
	      return normalize$2(out, out);
	    }
	  };
	}();

	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {quat} c the third operand
	 * @param {quat} d the fourth operand
	 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
	 * @returns {quat} out
	 */
	var sqlerp = function () {
	  var temp1 = create$6();
	  var temp2 = create$6();

	  return function (out, a, b, c, d, t) {
	    slerp(temp1, a, d, t);
	    slerp(temp2, b, c, t);
	    slerp(out, temp1, temp2, 2 * t * (1 - t));

	    return out;
	  };
	}();

	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {vec3} view  the vector representing the viewing direction
	 * @param {vec3} right the vector representing the local "right" direction
	 * @param {vec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */
	var setAxes = function () {
	  var matr = create$2();

	  return function (out, view, right, up) {
	    matr[0] = right[0];
	    matr[3] = right[1];
	    matr[6] = right[2];

	    matr[1] = up[0];
	    matr[4] = up[1];
	    matr[7] = up[2];

	    matr[2] = -view[0];
	    matr[5] = -view[1];
	    matr[8] = -view[2];

	    return normalize$2(out, fromMat3(out, matr));
	  };
	}();

	/**
	 * 2 Dimensional Vector
	 * @module vec2
	 */

	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */
	function create$8() {
	  var out = new ARRAY_TYPE(2);
	  if (ARRAY_TYPE != Float32Array) {
	    out[0] = 0;
	    out[1] = 0;
	  }
	  return out;
	}

	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	var forEach$2 = function () {
	  var vec = create$8();

	  return function (a, stride, offset, count, fn, arg) {
	    var i = void 0,
	        l = void 0;
	    if (!stride) {
	      stride = 2;
	    }

	    if (!offset) {
	      offset = 0;
	    }

	    if (count) {
	      l = Math.min(count * stride + offset, a.length);
	    } else {
	      l = a.length;
	    }

	    for (i = offset; i < l; i += stride) {
	      vec[0] = a[i];vec[1] = a[i + 1];
	      fn(vec, vec, arg);
	      a[i] = vec[0];a[i + 1] = vec[1];
	    }

	    return a;
	  };
	}();

	function xyz(data) {
	    var lines = data.split('\n');
	    var natoms = parseInt(lines[0]);
	    var nframes = Math.floor(lines.length/(natoms+2));
	    var trajectory = [];
	    for(var i = 0; i < nframes; i++) {
	        var atoms = [];
	        for(var j = 0; j < natoms; j++) {
	            var line = lines[i*(natoms+2)+j+2].split(/\s+/);
	            var atom = {};
	            var k = 0;
	            while (line[k] == "") k++;
	            atom.symbol = line[k++];
	            atom.position = [parseFloat(line[k++]), parseFloat(line[k++]), parseFloat(line[k++])];
	            atoms.push(atom);
	        }
	        trajectory.push(atoms);
	    }
	    return trajectory;
	}


	function ell(data) {
	    var lines = data.split('\n');
	    var nellipsoids = parseInt(lines[0]);
	    var nframes = Math.floor(lines.length/(nellipsoids+2));
	    var trajectory = [];
	    for(var i = 0; i < nframes; i++) {
	        var ellipsoids = [];
	        for(var j = 0; j < nellipsoids; j++) {
	            var line = lines[i*(nellipsoids+2)+j+2].split(/\s+/);
	            var ellipsoid = {};
	            var k = 0;
	            while (line[k] == "") k++;
	            ellipsoid.symbol = line[k++];
	            ellipsoid.position = [parseFloat(line[k++]),
					  parseFloat(line[k++]),
					  parseFloat(line[k++])];
		    ellipsoid.q = [parseFloat(line[k++]),
				   parseFloat(line[k++]),
				   parseFloat(line[k++]),
				   parseFloat(line[k++])];

	            ellipsoid.shape = [parseFloat(line[k++]),
				       parseFloat(line[k++]),
				       parseFloat(line[k++])];

	            ellipsoid.color = [parseFloat(line[k++]),
				       parseFloat(line[k++]),
				       parseFloat(line[k++])];

	            ellipsoids.push(ellipsoid);
	        }
	        trajectory.push(ellipsoids);
	    }
	    return trajectory;
	}

	var config = {
	    atoms: {
	        atomScale: 0.6,
	        relativeAtomScale: 0.64, // 1.0,
	        bondScale: 0.5,
	        ao: 0.75,
	        aoRes: 128, // 256
	        brightness: 0.7,
	        outline: 0.5,
	        spf: 32, // 32
	        bondThreshold: 1.2,
	        bondShade: 0.5,
	        atomShade: 0.5,
	        dofStrength: 0.0,
	        dofPosition: 0.5,
	        fxaa: 1
	    },
	    atomsbonds: {
	        atomScale: 0.24,
	        relativeAtomScale: 0.64,
	        bondScale: 0.5,
	        bondThreshold: 1.2
	    },
	    toon: {
	        ao: 0,
	        spf: 0,
	        brightness: 0.5,
	        outline: 1
	    },
	    licorice: {
	        atomScale: 0.1,
	        relativeAtomScale: 0,
	        bondScale: 1,
	        bonds: true,
	        bondThreshold: 1.2
	    }
	};

	function buildAttribs(gl, layout) {
	    var attribs = {};
	    for (var key in layout) {
	        attribs[key] = {
	            buffer: new GLBuffer(gl),
	            size: layout[key]
	        };
	    }
	    return attribs;
	}


	function Framebuffer(gl, color, depth, ext) {

	    var self = this;

	    self.initialize = function() {
	        self.fb = gl.createFramebuffer();
	        self.bind();

	        if (color.length > 1) {

		    console.warn("FRAMEBUFFER " + color.length);
		    alert("FRAMEBUFFER " + color.length);

	            var drawBuffers = [];
	            for (var i = 0; i < color.length; i++) {
	                drawBuffers.push(ext["COLOR_ATTACHMENT" + i + "_WEBGL"]);
	            }

	            gl.drawBuffers(drawBuffers);
	            // ext.drawBuffersWEBGL(drawBuffers);
	            for (var i = 0; i < color.length; i++) {
	                gl.framebufferTexture2D(gl.FRAMEBUFFER,
						ext["COLOR_ATTACHMENT" + i + "_WEBGL"],
						gl.TEXTURE_2D,
						color[i].texture, 0);
	            }
	        } else {
	            gl.framebufferTexture2D(gl.FRAMEBUFFER,
					    gl.COLOR_ATTACHMENT0,
					    gl.TEXTURE_2D,
					    color[0].texture, 0);
	        }
		
	        if (depth !== undefined) {
		    //console.warn("DEPTH framebuffer");
	            gl.framebufferTexture2D(gl.FRAMEBUFFER,
					    gl.DEPTH_ATTACHMENT,
					    gl.TEXTURE_2D,
					    depth.texture, 0);
		    //console.warn("DEPTH framebuffer DONE");
	        }
	    };

	    self.bind = function() {
	        gl.bindFramebuffer(gl.FRAMEBUFFER, self.fb);
	    };

	    self.initialize();

	}

	function Texture(gl, index, data, width, height, options) {
	    options = options || {};
	    options.target = options.target || gl.TEXTURE_2D;
	    options.mag = options.mag || gl.NEAREST;
	    options.min = options.min || gl.NEAREST;
	    options.wraps = options.wraps || gl.CLAMP_TO_EDGE;
	    options.wrapt = options.wrapt || gl.CLAMP_TO_EDGE;
	    options.internalFormat = options.internalFormat || gl.RGBA;
	    options.format = options.format || gl.RGBA;
	    options.type = options.type || gl.UNSIGNED_BYTE;

	    var self = this;

	    self.initialize = function() {
	        self.index = index;
	        self.activate();
	        self.texture = gl.createTexture();
	        self.bind();
	        gl.texParameteri(options.target, gl.TEXTURE_MAG_FILTER, options.mag);
	        gl.texParameteri(options.target, gl.TEXTURE_MIN_FILTER, options.min);
	        gl.texParameteri(options.target, gl.TEXTURE_WRAP_S, options.wraps);
	        gl.texParameteri(options.target, gl.TEXTURE_WRAP_T, options.wrapt);
	 
		//console.log('ALLOC DATA TYPE: ' + options.type + ' data ' + data);

	        // if (data === null
		//     ||
		//     typeof data === 'undefined'
		//     ||
		//     typeof data === 'null') {

		//     //console.log('alloc data type: ' + options.type);
	        //     if (options.type === gl.UNSIGNED_BYTE) {
	        //         data = new Uint8Array(width * height * 8);
		// 	// data = new Uint8Array([0, 0, 255, 255]);
		// 	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
	        //     } else if (options.type === gl.UNSIGNED_SHORT) {
	        //         data = new Uint16Array(width * height);
		// 	// data = new Uint16Array([0]);
		// 	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	        //     } else {
	        //         console.log('unsupported data type: ' + options.type);
	        //     }
		// }
		
	        // console.log('options.internalFormat: '
	        //             + options.internalFormat.toString(16)
	        //             + ' options.format: '
	        //             + options.format.toString(16)
	        //             + ' gl.RGBA: '
	        //             + gl.RGBA.toString(16)
	        //             + ' gl.DEPTH_COMPONENT: '
	        //             + gl.DEPTH_COMPONENT.toString(16)
	        //             + ' options.type: '
	        //             + options.type.toString(16)
		// 	    + ' size '
		// 	    + width
		// 	    + ' x '
		// 	    + height
	        //             + ' data: '
	        //             + data.toString(16)
		// 	   );

	        gl.texImage2D(options.target,
			      0,
			      options.internalFormat,
			      width, height,
			      0,
			      options.format,
			      options.type,
			      data);

		// if (options.type === gl.UNSIGNED_SHORT) {
		//     // attach the depth texture to the framebuffer
		//     gl.framebufferTexture2D(gl.FRAMEBUFFER,
		// 			    gl.DEPTH_ATTACHMENT,
		// 			    gl.TEXTURE_2D,
		// 			    self.texture,
		// 			    0);
		//     var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		//     console.log('status: '+ status);
		// }
	    };

	    self.bind = function() {
	        gl.bindTexture(options.target, self.texture);
	    };

	    self.activate = function() {
	        gl.activeTexture(gl.TEXTURE0 + self.index);
	    };

	    self.reset = function() {
	        self.activate();
	        self.bind();
	        gl.texImage2D(options.target, 0, options.internalFormat, width, height,
	            0, options.format, options.type, data);
	    };

	    self.initialize();
	}


	function GLBuffer(gl) {

	    var self = this;

	    self.initialize = function() {
	        self.buffer = gl.createBuffer();
	    };

	    self.bind = function() {
	        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
	    };

	    self.set = function(data) {
	        self.bind();
	        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	    };

	    self.initialize();
	}

	function Renderable(gl, program, buffers, primitiveCount) {

	    var self = this;

	    self.primitiveCount = primitiveCount;

	    self.initialize = function() {
	    };

	    self.render = function() {
	        program.use();
	        for (name in buffers) {
	            var buffer = buffers[name].buffer;
	            var size = buffers[name].size;
	            try {
	                var location = program.attribs[name].location;
	            } catch (e) {
	                console.log("Could not find location for", name);
	                throw e;
	            }
	            buffer.bind();
	            gl.enableVertexAttribArray(location);
	            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
	        }
	        gl.drawArrays(gl.TRIANGLES, 0, 3 * primitiveCount);
	        for (name in self.buffers) {
	            gl.disableVertexAttribArray(program.attributes[name].location);
	        }
	    };

	    self.initialize();
	}

	function Program(gl, vertexSource, fragmentSource) {

	    var self = this;

	    self.initialize = function() {
	        self.program = self.compileProgram(vertexSource, fragmentSource);
	        self.attribs = self.gatherAttribs();
	        self.uniforms = self.gatherUniforms();
	    };

	    self.use = function() {
	        gl.useProgram(self.program);
	    };

	    self.compileProgram = function(vertexSource, fragmentSource) {
	        var vertexShader = self.compileShader(vertexSource, gl.VERTEX_SHADER);
	        var fragmentShader = self.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
	        var program = gl.createProgram();
	        gl.attachShader(program, vertexShader);
	        gl.attachShader(program, fragmentShader);
	        gl.linkProgram(program);
	        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	            console.log(gl.getProgramInfoLog(program));
	            throw "Failed to compile program.";
	        }
	        return program;
	    };

	    self.compileShader = function(source, type) {
	        //console.warn("COMPILING: ", source);

	        var shader = gl.createShader(type);
	        gl.shaderSource(shader, source);
	        gl.compileShader(shader);
	        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	            var err = gl.getShaderInfoLog(shader);
	            var lineno = parseInt(err.split(':')[2]);
	            var split = source.split("\n");
	            for (var i in split) {
	                var q = parseInt(i);
	                console.log(q + "  " + split[i]);
	                if (i == lineno - 1) {
	                    console.warn(err);
	                }
	            }
	            var typeString = type == gl.VERTEX_SHADER ? "vertex" : "fragment";
	            throw "Failed to compile " + typeString + " shader.";
	        }
	        return shader;
	    };

	    self.setUniform = function(name, type, value) {
	        var args = Array.prototype.slice.call(arguments, 2);
	        self.use(); // Make this idempotent. At the context level, perhaps?
	        try {
	            var location = self.uniforms[name].location;
	        }
	        catch (e) {
	            console.log(name);
	            throw e;
	        }
	        gl['uniform' + type].apply(gl, [location].concat(args));
	    };

	    self.gatherUniforms = function() {
	        var uniforms = {};
	        var nUniforms = gl.getProgramParameter(self.program, gl.ACTIVE_UNIFORMS);
	        for (var i = 0; i < nUniforms; i++) {
	            var uniform = gl.getActiveUniform(self.program, i);
	            uniforms[uniform.name] = {
	                name: uniform.name,
	                location: gl.getUniformLocation(self.program, uniform.name),
	                type: uniform.type,
	                size: uniform.size
	            };
	        }
	        return uniforms;
	    };

	    self.gatherAttribs = function() {
	        var attribs = {};
	        var nAttribs = gl.getProgramParameter(self.program, gl.ACTIVE_ATTRIBUTES);
	        for (var i = 0; i < nAttribs; i++) {
	            var attrib = gl.getActiveAttrib(self.program, i);
	            attribs[attrib.name] = {
	                name: attrib.name,
	                location: gl.getAttribLocation(self.program, attrib.name),
	                type: attrib.type,
	                size: attrib.size
	            };
	        }
	        return attribs;
	    };

	    self.initialize();
	}

	var atoms = "#version 300 es\nprecision lowp float;\n\nin vec3 aImposter;\nin vec3 aPosition;\nin float aRadius;\nin vec3 aColor;\n\nuniform mat4 uView;\nuniform mat4 uProjection;\nuniform mat4 uModel;\nuniform float uAtomScale;\nuniform float uRelativeAtomScale;\nuniform float uAtomShade;\n\nout vec3 vColor;\nout vec3 vPosition;\nout float vRadius;\n\nvoid main() {\n    vRadius = uAtomScale * (1.0 + (aRadius - 1.0) * uRelativeAtomScale);\n    gl_Position = uProjection * uView * uModel * vec4(vRadius * aImposter\n\t\t\t\t\t\t      + aPosition, 1.0);\n    vColor = mix(aColor, vec3(1,1,1), uAtomShade);\n    vPosition = vec3(uModel * vec4(aPosition, 1));\n}\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform vec2 uBottomLeft;\nuniform vec2 uTopRight;\nuniform float uRes;\nuniform float uDepth;\nuniform int uMode;\n\nin vec3 vPosition;\nin float vRadius;\nin vec3 vColor;\n\nout vec4 color;\n\nfloat raySphereIntersect(vec3 r0, vec3 rd) {\n    float a = dot(rd, rd);\n    vec3 s0_r0 = r0 - vPosition;\n    float b = 2.0 * dot(rd, s0_r0);\n    float c = dot(s0_r0, s0_r0) - (vRadius * vRadius);\n    float disc = b*b - 4.0*a*c;\n    if (disc <= 0.0) {\n        return -1.0;\n    }\n    return (-b -sqrt(disc))/(2.0*a);\n}\n\nvoid main() {\n    vec2 res = vec2(uRes, uRes);\n\n    vec3 r0 = vec3(uBottomLeft + (gl_FragCoord.xy/res) * (uTopRight - uBottomLeft),\n\t\t   0.0);\n    vec3 rd = vec3(0, 0, -1);\n    float t = raySphereIntersect(r0, rd);\n    if (t < 0.0) {\n        discard;\n    }\n    vec3 coord = r0 + rd * t;\n    vec3 normal = normalize(coord - vPosition);\n    if (uMode == 0) {\n      color = vec4(vColor, 1);\n    } else if (uMode == 1) {\n      color = vec4(normal * 0.5 + 0.5, 1);\n    }\n\n// ad-hoc rule for ellipsoid\n    // if (abs(vRadius-5.0) < 0.1) {\n    //     color.a = 0.75;\n    // }\n    \n    gl_FragDepth = -coord.z/uDepth;\n}\n";

	var ellipsoids = "#version 300 es\nprecision lowp float;\n\nin vec3 aImposter;\nin vec3 aPosition;\nin vec4 aQuaternion;\nin vec3 aRadius;\nin vec3 aColor;\nin vec4 a_abcd;\nin vec4 a_efgh;\nin vec2 a_ij;\n\nuniform mat4 uView;\nuniform mat4 uProjection;\nuniform mat4 uModel;\nuniform float uAtomScale;\nuniform float uRelativeAtomScale;\nuniform float uAtomShade;\n\nout vec3 vColor;\nout vec3 vPosition;\nout vec4 vQuaternion;\nout vec3 vRadius;\nout vec4 v_abcd;\nout vec4 v_efgh;\nout vec2 v_ij;\n\nvoid main() {\n    vRadius = uAtomScale * (1.0 + (aRadius - 1.0) * uRelativeAtomScale);\n    gl_Position = uProjection * uView * uModel * vec4(vRadius * aImposter + aPosition, 1.0);\n    vColor = mix(aColor, vec3(1, 1, 1), uAtomShade);\n    vPosition = vec3(uModel * vec4(aPosition, 1));\n    vQuaternion = aQuaternion;\n    v_abcd = a_abcd;\n    v_efgh = a_efgh;\n    v_ij = a_ij;\n}\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform vec2 uBottomLeft;\nuniform vec2 uTopRight;\nuniform float uRes;\nuniform float uDepth;\nuniform int uMode;\n\nin vec3 vPosition;\nin vec4 vQuaternion;\nin vec3 vRadius;\nin vec3 vColor;\nin vec4 v_abcd;\nin vec4 v_efgh;\nin vec2 v_ij;\n\nout vec4 color;\n\nfloat rayQuadricIntersect(vec3 r0, vec3 rd) {\n    // VNorm(&rd);\n\n    vec3 ro = r0 - vPosition;\n\n    float aq = (v_abcd[0] * (rd.x * rd.x)) +\n        (2.0 * v_abcd[1] * rd.x * rd.y) +\n        (2.0 * v_abcd[2] * rd.x * rd.z) +\n        (v_efgh[0] * (rd.y * rd.y)) +\n        (2.0 * v_efgh[1] * rd.y * rd.z) +\n        (v_efgh[3] * (rd.z * rd.z));\n\n    float bq = 2.0 * (\n        (v_abcd[0] * ro.x * rd.x) +\n        (v_abcd[1] * ((ro.x * rd.y) + (rd.x * ro.y))) +\n        (v_abcd[2] * ((ro.x * rd.z) + (rd.x * ro.z))) +\n        (v_abcd[3] * rd.x) +\n        (v_efgh[0] * ro.y * rd.y) +\n        (v_efgh[1] * ((ro.y * rd.z) + (rd.y * ro.z))) +\n        (v_efgh[2] * rd.y) +\n        (v_efgh[3] * ro.z * rd.z) +\n        (v_ij[0] * rd.z)\n    );\n\n    float cq = (v_abcd[0] * (ro.x * ro.x)) +\n        (2.0 * v_abcd[1] * ro.x * ro.y) +\n        (2.0 * v_abcd[2] * ro.x * ro.z) +\n        (2.0 * v_abcd[3] * ro.x) +\n        (v_efgh[0] * (ro.y * ro.y)) +\n        (2.0 * v_efgh[1] * ro.y * ro.z) +\n        (2.0 * v_efgh[2] * ro.y) +\n        (v_efgh[3] * (ro.z * ro.z)) +\n        (2.0 * v_ij[0] * ro.z) +\n        v_ij[1];\n\n    if (aq == 0.0) {\n        return - cq / bq;\n    } else {\n        float disc = (bq * bq - 4.0 * aq * cq);\n        if (disc > 0.0) {\n            disc = sqrt(disc);\n            // t1 = (-bq + disc) / (2.0 * aq);\n            return (-bq - disc) / (2.0 * aq);\n        } else {\n            return -1.0;\n        }\n    }\n}\n\nvoid main() {\n    vec2 res = vec2(uRes, uRes);\n\n    vec3 r0 = vec3(uBottomLeft + (gl_FragCoord.xy / res) * (uTopRight - uBottomLeft),\n        0.0);\n    vec3 rd = vec3(0, 0, -1);\n\n    float t = rayQuadricIntersect(r0, rd);\n    if (t < 0.0) {\n        discard;\n    }\n    vec3 coord = r0 + rd * t;\n    vec3 normal = normalize(coord - vPosition);\n    if (uMode == 0) {\n        color = vec4(vColor, 0.75);\n    } else if (uMode == 1) {\n        color = vec4(normal * 0.5 + 0.5, 0.75);\n    }\n    gl_FragDepth = -coord.z / uDepth;\n}\n";

	var bonds = "#version 300 es\nprecision lowp float;\n\nin vec3 aImposter;\nin vec3 aPosA;\nin vec3 aPosB;\nin float aRadius;\nin float aRadA;\nin float aRadB;\nin vec3 aColA;\nin vec3 aColB;\n\nuniform mat4 uView;\nuniform mat4 uProjection;\nuniform mat4 uModel;\nuniform mat4 uRotation;\nuniform float uAtomScale;\nuniform float uRelativeAtomScale;\n\nout vec3 vNormal;\nout vec3 vPosA, vPosB;\nout float vRadA, vRadB;\nout vec3 vColA, vColB;\nout float vRadius;\n\nmat3 alignVector(vec3 a, vec3 b) {\n    vec3 v = cross(a, b);\n    float s = length(v);\n    float c = dot(a, b);\n    mat3 I = mat3(\n        1, 0, 0,\n        0, 1, 0,\n        0, 0, 1\n    );\n    mat3 vx = mat3(\n        0, v.z, -v.y,\n        -v.z, 0, v.x,\n        v.y, -v.x, 0\n    );\n    return I + vx + vx * vx * ((1.0 - c) / (s * s));\n}\n\nvoid main() {\n    vRadius = aRadius;\n    vec3 pos = vec3(aImposter);\n    // Scale the box in x and z to be bond-radius.\n    pos = pos * vec3(vRadius, 1, vRadius);\n    // Shift the origin-centered cube so that the bottom is at the origin.\n    pos = pos + vec3(0, 1, 0);\n    // Stretch the box in y so that it is the length of the bond.\n    pos = pos * vec3(1, length(aPosA - aPosB) * 0.5, 1);\n    // Find the rotation that aligns vec3(0, 1, 0) with vec3(uPosB - uPosA) and apply it.\n    vec3 a = normalize(vec3(-0.000001, 1.000001, 0.000001));\n    vec3 b = normalize(aPosB - aPosA);\n    mat3 R = alignVector(a, b);\n    pos = R * pos;\n    // Shift the cube so that the bottom is centered at the middle of atom A.\n    pos = pos + aPosA;\n\n    vec4 position = uModel * vec4(pos, 1);\n    gl_Position = uProjection * uView * position;\n    vPosA = aPosA;\n    vPosB = aPosB;\n    vRadA = uAtomScale * (1.0 + (aRadA - 1.0) * uRelativeAtomScale);\n    vRadB = uAtomScale * (1.0 + (aRadB - 1.0) * uRelativeAtomScale);\n    vColA = aColA;\n    vColB = aColB;\n}\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform mat4 uRotation;\nuniform vec2 uBottomLeft;\nuniform vec2 uTopRight;\nuniform float uDepth;\nuniform float uRes;\nuniform float uBondShade;\nuniform int uMode;\n\nin vec3 vPosA, vPosB;\nin float vRadA, vRadB;\nin vec3 vColA, vColB;\nin float vRadius;\n\nout vec4 color;\n\nmat3 alignVector(vec3 a, vec3 b) {\n    vec3 v = cross(a, b);\n    float s = length(v);\n    float c = dot(a, b);\n    mat3 I = mat3(\n        1, 0, 0,\n        0, 1, 0,\n        0, 0, 1\n    );\n    mat3 vx = mat3(\n        0, v.z, -v.y,\n        -v.z, 0, v.x,\n        v.y, -v.x, 0\n    );\n    return I + vx + vx * vx * ((1.0 - c) / (s * s));\n}\n\nvoid main() {\n\n    vec2 res = vec2(uRes, uRes);\n    vec3 r0 = vec3(uBottomLeft + (gl_FragCoord.xy/res) * (uTopRight - uBottomLeft), uDepth/2.0);\n    vec3 rd = vec3(0, 0, -1);\n\n    vec3 i = normalize(vPosB - vPosA);\n         i = vec3(uRotation * vec4(i, 0));\n    vec3 j = normalize(vec3(-0.000001, 1.000001, 0.000001));\n    mat3 R = alignVector(i, j);\n\n    vec3 r0p = r0 - vec3(uRotation * vec4(vPosA, 0));\n    r0p = R * r0p;\n    vec3 rdp = R * rd;\n\n    float a = dot(rdp.xz, rdp.xz);\n    float b = 2.0 * dot(rdp.xz, r0p.xz);\n    float c = dot(r0p.xz, r0p.xz) - vRadius*vRadius;\n    float disc = b*b - 4.0*a*c;\n    if (disc <= 0.0) {\n        discard;\n    }\n    float t = (-b - sqrt(disc))/(2.0*a);\n    if (t < 0.0) {\n        discard;\n    }\n\n    vec3 coord = r0p + rdp * t;\n    if (coord.y < 0.0 || coord.y > length(vPosA - vPosB)) {\n        discard;\n    }\n\n    vec3 color_tmp;\n    if (coord.y < vRadA + 0.5 * (length(vPosA - vPosB) - (vRadA + vRadB))) {\n        color_tmp = vColA;\n    } else {\n        color_tmp = vColB;\n    }\n\n    color_tmp = mix(color_tmp, vec3(1,1,1), uBondShade);\n\n    R = alignVector(j, i);\n    vec3 normal = normalize(R * vec3(coord.x, 0, coord.z));\n\n    coord = r0 + rd * t;\n    if (uMode == 0) {\n        color = vec4(color_tmp, 1);\n    } else if (uMode == 1) {\n        color = vec4(normal * 0.5 + 0.5, 1.0);\n    }\n    gl_FragDepth = -(coord.z - uDepth/2.0)/uDepth;\n}\n";

	var texturedquad = "#version 300 es\nprecision lowp float;\n\nin vec3 aPosition;\n\nvoid main() {\n    gl_Position = vec4(aPosition, 1);\n}\n\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform sampler2D uTexture;\nuniform float uRes;\n\nout vec4 color;\n\nvoid main() {\n    color = texture(uTexture, gl_FragCoord.xy/uRes);\n}\n";

	var accumulator = "#version 300 es\nprecision lowp float;\n\nin vec3 aPosition;\n\nvoid main() {\n    gl_Position = vec4(aPosition, 1);\n}\n\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform sampler2D uSceneDepth;\nuniform sampler2D uSceneNormal;\nuniform sampler2D uRandRotDepth;\nuniform sampler2D uAccumulator;\nuniform mat4 uRot;\nuniform mat4 uInvRot;\nuniform vec2 uSceneBottomLeft;\nuniform vec2 uSceneTopRight;\nuniform vec2 uRotBottomLeft;\nuniform vec2 uRotTopRight;\nuniform float uDepth;\nuniform float uRes;\nuniform int uSampleCount;\n\nout vec4 color;\n\nvoid main() {\n\n    float dScene = texture(uSceneDepth, gl_FragCoord.xy/uRes).r;\n\n    vec3 r = vec3(uSceneBottomLeft + (gl_FragCoord.xy/uRes) * (uSceneTopRight - uSceneBottomLeft), 0.0);\n\n    r.z = -(dScene - 0.5) * uDepth;\n    r = vec3(uRot * vec4(r, 1));\n    float depth = -r.z/uDepth + 0.5;\n\n    vec2 p = (r.xy - uRotBottomLeft)/(uRotTopRight - uRotBottomLeft);\n\n    float dRandRot = texture(uRandRotDepth, p).r;\n\n    float ao = step(dRandRot, depth * 0.99);\n\n    vec3 normal = texture(uSceneNormal, gl_FragCoord.xy/uRes).rgb * 2.0 - 1.0;\n    vec3 dir = vec3(uInvRot * vec4(0, 0, 1, 0));\n    float mag = dot(dir, normal);\n    float sampled = step(0.0, mag);\n\n    ao *= sampled;\n\n    vec4 acc = texture(uAccumulator, gl_FragCoord.xy/uRes);\n\n    if (uSampleCount < 256) {\n        acc.r += ao/255.0;\n    } else if (uSampleCount < 512) {\n        acc.g += ao/255.0;\n    } else if (uSampleCount < 768) {\n        acc.b += ao/255.0;\n    } else {\n        acc.a += ao/255.0;\n    }\n        \n    color = acc;\n}\n";

	var ao = "#version 300 es\nprecision lowp float;\n\nin vec3 aPosition;\n\nvoid main() {\n    gl_Position = vec4(aPosition, 1);\n}\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform sampler2D uSceneColor;\nuniform sampler2D uSceneDepth;\nuniform sampler2D uAccumulatorOut;\nuniform float uRes;\nuniform float uAO;\nuniform float uBrightness;\nuniform float uOutlineStrength;\n\nout vec4 color;\n\nvoid main() {\n    vec2 p = gl_FragCoord.xy/uRes;\n    vec4 sceneColor = texture(uSceneColor, p);\n    if (uOutlineStrength > 0.0) {\n        float depth = texture(uSceneDepth, p).r;\n        float r = 1.0/511.0;\n        float d0 = abs(texture(uSceneDepth, p + vec2(-r,  0)).r - depth);\n        float d1 = abs(texture(uSceneDepth, p + vec2( r,  0)).r - depth);\n        float d2 = abs(texture(uSceneDepth, p + vec2( 0, -r)).r - depth);\n        float d3 = abs(texture(uSceneDepth, p + vec2( 0,  r)).r - depth);\n        float d = max(d0, d1);\n        d = max(d, d2);\n        d = max(d, d3);\n        sceneColor.rgb *= pow(1.0 - d, uOutlineStrength * 32.0);\n        sceneColor.a = max(step(0.003, d), sceneColor.a);\n    }\n    vec4 dAccum = texture(uAccumulatorOut, p);\n    float shade = max(0.0, 1.0 - (dAccum.r + dAccum.g + dAccum.b + dAccum.a) * 0.25 * uAO);\n    shade = pow(shade, 2.0);\n    color = vec4(uBrightness * sceneColor.rgb * shade, sceneColor.a);\n}\n";

	var fxaa = "#version 300 es\nprecision lowp float;\n\nin vec3 aPosition;\n\nvoid main() {\n    gl_Position = vec4(aPosition, 1);\n}\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform sampler2D uTexture;\nuniform float uRes;\n\nout vec4 color;\n\nvoid main() {\n    float FXAA_SPAN_MAX = 8.0;\n    float FXAA_REDUCE_MUL = 1.0/8.0;\n    float FXAA_REDUCE_MIN = 1.0/128.0;\n\n    vec2 texCoords = gl_FragCoord.xy/uRes;\n\n    vec4 rgbNW = texture(uTexture, texCoords + (vec2(-1.0, -1.0) / uRes));\n    vec4 rgbNE = texture(uTexture, texCoords + (vec2(1.0, -1.0) / uRes));\n    vec4 rgbSW = texture(uTexture, texCoords + (vec2(-1.0, 1.0) / uRes));\n    vec4 rgbSE = texture(uTexture, texCoords + (vec2(1.0, 1.0) / uRes));\n    vec4 rgbM  = texture(uTexture, texCoords);\n\n    vec4 luma = vec4(0.299, 0.587, 0.114, 1.0);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\n    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);\n\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) / uRes;\n\n    vec4 rgbA = (1.0/2.0) * \n        (texture(uTexture, texCoords.xy + dir * (1.0/3.0 - 0.5)) + \n         texture(uTexture, texCoords.xy + dir * (2.0/3.0 - 0.5)));\n    vec4 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * \n        (texture(uTexture, texCoords.xy + dir * (0.0/3.0 - 0.5)) +\n         texture(uTexture, texCoords.xy + dir * (3.0/3.0 - 0.5)));\n    float lumaB = dot(rgbB, luma);\n\n    if((lumaB < lumaMin) || (lumaB > lumaMax)){\n        color = rgbA;\n    } else {\n        color = rgbB;\n    }\n\n}";

	var dof = "#version 300 es\nprecision lowp float;\n\nin vec3 aPosition;\n\nvoid main() {\n    gl_Position = vec4(aPosition, 1);\n}\n\n\n// __split__#version 300 es\nprecision lowp float;\n\nuniform sampler2D uColor;\nuniform sampler2D uDepth;\nuniform float uRes;\nuniform float uDOFPosition;\nuniform float uDOFStrength;\nuniform int leftRight;\n\nout vec4 color;\n\nvoid main() {\n\n    vec2 samples[64];\n    samples[0] = vec2(0.857612, 0.019885);\n    samples[1] = vec2(0.563809, -0.028071);\n    samples[2] = vec2(0.825599, -0.346856);\n    samples[3] = vec2(0.126584, -0.380959);\n    samples[4] = vec2(0.782948, 0.594322);\n    samples[5] = vec2(0.292148, -0.543265);\n    samples[6] = vec2(0.130700, 0.330220);\n    samples[7] = vec2(0.236088, 0.159604);\n    samples[8] = vec2(-0.305259, 0.810505);\n    samples[9] = vec2(0.269616, 0.923026);\n    samples[10] = vec2(0.484486, 0.371845);\n    samples[11] = vec2(-0.638057, 0.080447);\n    samples[12] = vec2(0.199629, 0.667280);\n    samples[13] = vec2(-0.861043, -0.370583);\n    samples[14] = vec2(-0.040652, -0.996174);\n    samples[15] = vec2(0.330458, -0.282111);\n    samples[16] = vec2(0.647795, -0.214354);\n    samples[17] = vec2(0.030422, -0.189908);\n    samples[18] = vec2(0.177430, -0.721124);\n    samples[19] = vec2(-0.461163, -0.327434);\n    samples[20] = vec2(-0.410012, -0.734504);\n    samples[21] = vec2(-0.616334, -0.626069);\n    samples[22] = vec2(0.590759, -0.726479);\n    samples[23] = vec2(-0.590794, 0.805365);\n    samples[24] = vec2(-0.924561, -0.163739);\n    samples[25] = vec2(-0.323028, 0.526960);\n    samples[26] = vec2(0.642128, 0.752577);\n    samples[27] = vec2(0.173625, -0.952386);\n    samples[28] = vec2(0.759014, 0.330311);\n    samples[29] = vec2(-0.360526, -0.032013);\n    samples[30] = vec2(-0.035320, 0.968156);\n    samples[31] = vec2(0.585478, -0.431068);\n    samples[32] = vec2(-0.244766, -0.906947);\n    samples[33] = vec2(-0.853096, 0.184615);\n    samples[34] = vec2(-0.089061, 0.104648);\n    samples[35] = vec2(-0.437613, 0.285308);\n    samples[36] = vec2(-0.654098, 0.379841);\n    samples[37] = vec2(-0.128663, 0.456572);\n    samples[38] = vec2(0.015980, -0.568170);\n    samples[39] = vec2(-0.043966, -0.771940);\n    samples[40] = vec2(0.346512, -0.071238);\n    samples[41] = vec2(-0.207921, -0.209121);\n    samples[42] = vec2(-0.624075, -0.189224);\n    samples[43] = vec2(-0.120618, 0.689339);\n    samples[44] = vec2(-0.664679, -0.410200);\n    samples[45] = vec2(0.371945, -0.880573);\n    samples[46] = vec2(-0.743251, 0.629998);\n    samples[47] = vec2(-0.191926, -0.413946);\n    samples[48] = vec2(0.449574, 0.833373);\n    samples[49] = vec2(0.299587, 0.449113);\n    samples[50] = vec2(-0.900432, 0.399319);\n    samples[51] = vec2(0.762613, -0.544796);\n    samples[52] = vec2(0.606462, 0.174233);\n    samples[53] = vec2(0.962185, -0.167019);\n    samples[54] = vec2(0.960990, 0.249552);\n    samples[55] = vec2(0.570397, 0.559146);\n    samples[56] = vec2(-0.537514, 0.555019);\n    samples[57] = vec2(0.108491, -0.003232);\n    samples[58] = vec2(-0.237693, -0.615428);\n    samples[59] = vec2(-0.217313, 0.261084);\n    samples[60] = vec2(-0.998966, 0.025692);\n    samples[61] = vec2(-0.418554, -0.527508);\n    samples[62] = vec2(-0.822629, -0.567797);\n    samples[63] = vec2(0.061945, 0.522105);\n\n    float invRes = 1.0/uRes;\n    vec2 coord = gl_FragCoord.xy * invRes;\n\n    float strength = uDOFStrength * uRes/768.0;\n\n    float depth = texture(uDepth, coord).r;\n    float range = uDOFPosition - depth;\n    float scale = abs(range);\n\n    vec4 samplet = texture(uColor, coord);\n    float count = 1.0;\n    for(int i = 0; i < 64; i++) {\n        vec2 p = samples[i];\n        p = coord + scale * 64.0 * strength * p * invRes;\n        float d = texture(uDepth, p).r;\n        float r = uDOFPosition - d;\n        float s = abs(r);\n        samplet += texture(uColor, p) * s;\n        count += s;\n    }\n\n    color = samplet/count;\n}";

	var ShaderChunk = {
	    atoms: atoms,
	    ellipsoids: ellipsoids,
	    bonds, bonds,
	    texturedquad: texturedquad,
	    accumulator: accumulator,
	    ao: ao,
	    fxaa: fxaa,
	    dof: dof
	};

	var n = -1;
	var p = 1;

	var position = [
	    // -X
	    n, n, n,
	    n, n, p,
	    n, p, p,
	    n, n, n,
	    n, p, p,
	    n, p, n,

	    // +X
	    p, n, p,
	    p, n, n,
	    p, p, n,
	    p, n, p,
	    p, p, n,
	    p, p, p,

	    // -Y
	    n, n, n,
	    p, n, n,
	    p, n, p,
	    n, n, n,
	    p, n, p,
	    n, n, p,

	    // +Y
	    n, p, p,
	    p, p, p,
	    p, p, n,
	    n, p, p,
	    p, p, n,
	    n, p, n,

	    // -Z
	    p, n, n,
	    n, n, n,
	    n, p, n,
	    p, n, n,
	    n, p, n,
	    p, p, n,

	    // +Z
	    n, n, p,
	    p, n, p,
	    p, p, p,
	    n, n, p,
	    p, p, p,
	    n, p, p
	];

	var elements = {
	    'Xx': {'symbol':  'Xx', 'name':       'unknown', 'mass':   1.00000000, 'radius':  1.0000, 'color': [1.000, 0.078, 0.576], 'number': 0},
	    'H': {'symbol':   'H', 'name':      'hydrogen', 'mass':   1.00794000, 'radius':  0.3100, 'color': [1.000, 1.000, 1.000], 'number': 1},
	    'He': {'symbol':  'He', 'name':        'helium', 'mass':   4.00260200, 'radius':  0.2800, 'color': [0.851, 1.000, 1.000], 'number': 2},
	    'Li': {'symbol':  'Li', 'name':       'lithium', 'mass':   6.94100000, 'radius':  1.2800, 'color': [0.800, 0.502, 1.000], 'number': 3},
	    'Be': {'symbol':  'Be', 'name':     'beryllium', 'mass':   9.01218200, 'radius':  0.9600, 'color': [0.761, 1.000, 0.000], 'number': 4},
	    'B': {'symbol':   'B', 'name':         'boron', 'mass':  10.81100000, 'radius':  0.8400, 'color': [1.000, 0.710, 0.710], 'number': 5},
	    'C': {'symbol':   'C', 'name':        'carbon', 'mass':  12.01070000, 'radius':  0.7300, 'color': [0.565, 0.565, 0.565], 'number': 6},
	    'N': {'symbol':   'N', 'name':      'nitrogen', 'mass':  14.00670000, 'radius':  0.7100, 'color': [0.188, 0.314, 0.973], 'number': 7},
	    'O': {'symbol':   'O', 'name':        'oxygen', 'mass':  15.99940000, 'radius':  0.6600, 'color': [1.000, 0.051, 0.051], 'number': 8},
	    'F': {'symbol':   'F', 'name':      'fluorine', 'mass':  18.99840320, 'radius':  0.5700, 'color': [0.565, 0.878, 0.314], 'number': 9},
	    'Ne': {'symbol':  'Ne', 'name':          'neon', 'mass':  20.17970000, 'radius':  0.5800, 'color': [0.702, 0.890, 0.961], 'number': 10},
	    'Na': {'symbol':  'Na', 'name':        'sodium', 'mass':  22.98976928, 'radius':  1.6600, 'color': [0.671, 0.361, 0.949], 'number': 11},
	    'Mg': {'symbol':  'Mg', 'name':     'magnesium', 'mass':  24.30500000, 'radius':  1.4100, 'color': [0.541, 1.000, 0.000], 'number': 12},
	    'Al': {'symbol':  'Al', 'name':      'aluminum', 'mass':  26.98153860, 'radius':  1.2100, 'color': [0.749, 0.651, 0.651], 'number': 13},
	    'Si': {'symbol':  'Si', 'name':       'silicon', 'mass':  28.08550000, 'radius':  1.1100, 'color': [0.941, 0.784, 0.627], 'number': 14},
	    'P': {'symbol':   'P', 'name':    'phosphorus', 'mass':  30.97376200, 'radius':  1.0700, 'color': [1.000, 0.502, 0.000], 'number': 15},
	    'S': {'symbol':   'S', 'name':        'sulfur', 'mass':  32.06500000, 'radius':  1.0500, 'color': [1.000, 1.000, 0.188], 'number': 16},
	    'Cl': {'symbol':  'Cl', 'name':      'chlorine', 'mass':  35.45300000, 'radius':  1.0200, 'color': [0.122, 0.941, 0.122], 'number': 17},
	    'Ar': {'symbol':  'Ar', 'name':         'argon', 'mass':  39.94800000, 'radius':  1.0600, 'color': [0.502, 0.820, 0.890], 'number': 18},
	    'K': {'symbol':   'K', 'name':     'potassium', 'mass':  39.09830000, 'radius':  2.0300, 'color': [0.561, 0.251, 0.831], 'number': 19},
	    'Ca': {'symbol':  'Ca', 'name':       'calcium', 'mass':  40.07800000, 'radius':  1.7600, 'color': [0.239, 1.000, 0.000], 'number': 20},
	    'Sc': {'symbol':  'Sc', 'name':      'scandium', 'mass':  44.95591200, 'radius':  1.7000, 'color': [0.902, 0.902, 0.902], 'number': 21},
	    'Ti': {'symbol':  'Ti', 'name':      'titanium', 'mass':  47.86700000, 'radius':  1.6000, 'color': [0.749, 0.761, 0.780], 'number': 22},
	    'V': {'symbol':   'V', 'name':      'vanadium', 'mass':  50.94150000, 'radius':  1.5300, 'color': [0.651, 0.651, 0.671], 'number': 23},
	    'Cr': {'symbol':  'Cr', 'name':      'chromium', 'mass':  51.99610000, 'radius':  1.3900, 'color': [0.541, 0.600, 0.780], 'number': 24},
	    'Mn': {'symbol':  'Mn', 'name':     'manganese', 'mass':  54.93804500, 'radius':  1.3900, 'color': [0.611, 0.478, 0.780], 'number': 25},
	    'Fe': {'symbol':  'Fe', 'name':          'iron', 'mass':  55.84500000, 'radius':  1.3200, 'color': [0.878, 0.400, 0.200], 'number': 26},
	    'Co': {'symbol':  'Co', 'name':        'cobalt', 'mass':  58.69340000, 'radius':  1.2600, 'color': [0.941, 0.565, 0.627], 'number': 27},
	    'Ni': {'symbol':  'Ni', 'name':        'nickel', 'mass':  58.93319500, 'radius':  1.2400, 'color': [0.314, 0.816, 0.314], 'number': 28},
	    'Cu': {'symbol':  'Cu', 'name':        'copper', 'mass':  63.54600000, 'radius':  1.3200, 'color': [0.784, 0.502, 0.200], 'number': 29},
	    'Zn': {'symbol':  'Zn', 'name':          'zinc', 'mass':  65.38000000, 'radius':  1.2200, 'color': [0.490, 0.502, 0.690], 'number': 30},
	    'Ga': {'symbol':  'Ga', 'name':       'gallium', 'mass':  69.72300000, 'radius':  1.2200, 'color': [0.761, 0.561, 0.561], 'number': 31},
	    'Ge': {'symbol':  'Ge', 'name':     'germanium', 'mass':  72.64000000, 'radius':  1.2000, 'color': [0.400, 0.561, 0.561], 'number': 32},
	    'As': {'symbol':  'As', 'name':       'arsenic', 'mass':  74.92160000, 'radius':  1.1900, 'color': [0.741, 0.502, 0.890], 'number': 33},
	    'Se': {'symbol':  'Se', 'name':      'selenium', 'mass':  78.96000000, 'radius':  1.2000, 'color': [1.000, 0.631, 0.000], 'number': 34},
	    'Br': {'symbol':  'Br', 'name':       'bromine', 'mass':  79.90400000, 'radius':  1.2000, 'color': [0.651, 0.161, 0.161], 'number': 35},
	    'Kr': {'symbol':  'Kr', 'name':       'krypton', 'mass':  83.79800000, 'radius':  1.1600, 'color': [0.361, 0.722, 0.820], 'number': 36},
	    'Rb': {'symbol':  'Rb', 'name':      'rubidium', 'mass':  85.46780000, 'radius':  2.2000, 'color': [0.439, 0.180, 0.690], 'number': 37},
	    'Sr': {'symbol':  'Sr', 'name':     'strontium', 'mass':  87.62000000, 'radius':  1.9500, 'color': [0.000, 1.000, 0.000], 'number': 38},
	    'Y': {'symbol':   'Y', 'name':       'yttrium', 'mass':  88.90585000, 'radius':  1.9000, 'color': [0.580, 1.000, 1.000], 'number': 39},
	    'Zr': {'symbol':  'Zr', 'name':     'zirconium', 'mass':  91.22400000, 'radius':  1.7500, 'color': [0.580, 0.878, 0.878], 'number': 40},
	    'Nb': {'symbol':  'Nb', 'name':       'niobium', 'mass':  92.90638000, 'radius':  1.6400, 'color': [0.451, 0.761, 0.788], 'number': 41},
	    'Mo': {'symbol':  'Mo', 'name':    'molybdenum', 'mass':  95.96000000, 'radius':  1.5400, 'color': [0.329, 0.710, 0.710], 'number': 42},
	    'Tc': {'symbol':  'Tc', 'name':    'technetium', 'mass':  98.00000000, 'radius':  1.4700, 'color': [0.231, 0.620, 0.620], 'number': 43},
	    'Ru': {'symbol':  'Ru', 'name':     'ruthenium', 'mass': 101.07000000, 'radius':  1.4600, 'color': [0.141, 0.561, 0.561], 'number': 44},
	    'Rh': {'symbol':  'Rh', 'name':       'rhodium', 'mass': 102.90550000, 'radius':  1.4200, 'color': [0.039, 0.490, 0.549], 'number': 45},
	    'Pd': {'symbol':  'Pd', 'name':     'palladium', 'mass': 106.42000000, 'radius':  1.3900, 'color': [0.000, 0.412, 0.522], 'number': 46},
	    'Ag': {'symbol':  'Ag', 'name':        'silver', 'mass': 107.86820000, 'radius':  1.4500, 'color': [0.753, 0.753, 0.753], 'number': 47},
	    'Cd': {'symbol':  'Cd', 'name':       'cadmium', 'mass': 112.41100000, 'radius':  1.4400, 'color': [1.000, 0.851, 0.561], 'number': 48},
	    'In': {'symbol':  'In', 'name':        'indium', 'mass': 114.81800000, 'radius':  1.4200, 'color': [0.651, 0.459, 0.451], 'number': 49},
	    'Sn': {'symbol':  'Sn', 'name':           'tin', 'mass': 118.71000000, 'radius':  1.3900, 'color': [0.400, 0.502, 0.502], 'number': 50},
	    'Sb': {'symbol':  'Sb', 'name':      'antimony', 'mass': 121.76000000, 'radius':  1.3900, 'color': [0.620, 0.388, 0.710], 'number': 51},
	    'Te': {'symbol':  'Te', 'name':     'tellurium', 'mass': 127.60000000, 'radius':  1.3800, 'color': [0.831, 0.478, 0.000], 'number': 52},
	    'I': {'symbol':   'I', 'name':        'iodine', 'mass': 126.90470000, 'radius':  1.3900, 'color': [0.580, 0.000, 0.580], 'number': 53},
	    'Xe': {'symbol':  'Xe', 'name':         'xenon', 'mass': 131.29300000, 'radius':  1.4000, 'color': [0.259, 0.620, 0.690], 'number': 54},
	    'Cs': {'symbol':  'Cs', 'name':        'cesium', 'mass': 132.90545190, 'radius':  2.4400, 'color': [0.341, 0.090, 0.561], 'number': 55},
	    'Ba': {'symbol':  'Ba', 'name':        'barium', 'mass': 137.32700000, 'radius':  2.1500, 'color': [0.000, 0.788, 0.000], 'number': 56},
	    'La': {'symbol':  'La', 'name':     'lanthanum', 'mass': 138.90547000, 'radius':  2.0700, 'color': [0.439, 0.831, 1.000], 'number': 57},
	    'Ce': {'symbol':  'Ce', 'name':        'cerium', 'mass': 140.11600000, 'radius':  2.0400, 'color': [1.000, 1.000, 0.780], 'number': 58},
	    'Pr': {'symbol':  'Pr', 'name':  'praseodymium', 'mass': 140.90765000, 'radius':  2.0300, 'color': [0.851, 1.000, 0.780], 'number': 59},
	    'Nd': {'symbol':  'Nd', 'name':     'neodymium', 'mass': 144.24200000, 'radius':  2.0100, 'color': [0.780, 1.000, 0.780], 'number': 60},
	    'Pm': {'symbol':  'Pm', 'name':    'promethium', 'mass': 145.00000000, 'radius':  1.9900, 'color': [0.639, 1.000, 0.780], 'number': 61},
	    'Sm': {'symbol':  'Sm', 'name':      'samarium', 'mass': 150.36000000, 'radius':  1.9800, 'color': [0.561, 1.000, 0.780], 'number': 62},
	    'Eu': {'symbol':  'Eu', 'name':      'europium', 'mass': 151.96400000, 'radius':  1.9800, 'color': [0.380, 1.000, 0.780], 'number': 63},
	    'Gd': {'symbol':  'Gd', 'name':    'gadolinium', 'mass': 157.25000000, 'radius':  1.9600, 'color': [0.271, 1.000, 0.780], 'number': 64},
	    'Tb': {'symbol':  'Tb', 'name':       'terbium', 'mass': 158.92535000, 'radius':  1.9400, 'color': [0.189, 1.000, 0.780], 'number': 65},
	    'Dy': {'symbol':  'Dy', 'name':    'dysprosium', 'mass': 162.50000000, 'radius':  1.9200, 'color': [0.122, 1.000, 0.780], 'number': 66},
	    'Ho': {'symbol':  'Ho', 'name':       'holmium', 'mass': 164.93032000, 'radius':  1.9200, 'color': [0.000, 1.000, 0.612], 'number': 67},
	    'Er': {'symbol':  'Er', 'name':        'erbium', 'mass': 167.25900000, 'radius':  1.8900, 'color': [0.000, 0.902, 0.459], 'number': 68},
	    'Tm': {'symbol':  'Tm', 'name':       'thulium', 'mass': 168.93421000, 'radius':  1.9000, 'color': [0.000, 0.831, 0.322], 'number': 69},
	    'Yb': {'symbol':  'Yb', 'name':     'ytterbium', 'mass': 173.05400000, 'radius':  1.8700, 'color': [0.000, 0.749, 0.220], 'number': 70},
	    'Lu': {'symbol':  'Lu', 'name':      'lutetium', 'mass': 174.96680000, 'radius':  1.8700, 'color': [0.000, 0.671, 0.141], 'number': 71},
	    'Hf': {'symbol':  'Hf', 'name':       'hafnium', 'mass': 178.49000000, 'radius':  1.7500, 'color': [0.302, 0.761, 1.000], 'number': 72},
	    'Ta': {'symbol':  'Ta', 'name':      'tantalum', 'mass': 180.94788000, 'radius':  1.7000, 'color': [0.302, 0.651, 1.000], 'number': 73},
	    'W': {'symbol':   'W', 'name':      'tungsten', 'mass': 183.84000000, 'radius':  1.6200, 'color': [0.129, 0.580, 0.839], 'number': 74},
	    'Re': {'symbol':  'Re', 'name':       'rhenium', 'mass': 186.20700000, 'radius':  1.5100, 'color': [0.149, 0.490, 0.671], 'number': 75},
	    'Os': {'symbol':  'Os', 'name':        'osmium', 'mass': 190.23000000, 'radius':  1.4400, 'color': [0.149, 0.400, 0.588], 'number': 76},
	    'Ir': {'symbol':  'Ir', 'name':       'iridium', 'mass': 192.21700000, 'radius':  1.4100, 'color': [0.090, 0.329, 0.529], 'number': 77},
	    'Pt': {'symbol':  'Pt', 'name':      'platinum', 'mass': 195.08400000, 'radius':  1.3600, 'color': [0.816, 0.816, 0.878], 'number': 78},
	    'Au': {'symbol':  'Au', 'name':          'gold', 'mass': 196.96656900, 'radius':  1.3600, 'color': [1.000, 0.820, 0.137], 'number': 79},
	    'Hg': {'symbol':  'Hg', 'name':       'mercury', 'mass': 200.59000000, 'radius':  1.3200, 'color': [0.722, 0.722, 0.816], 'number': 80},
	    'Tl': {'symbol':  'Tl', 'name':      'thallium', 'mass': 204.38330000, 'radius':  1.4500, 'color': [0.651, 0.329, 0.302], 'number': 81},
	    'Pb': {'symbol':  'Pb', 'name':          'lead', 'mass': 207.20000000, 'radius':  1.4600, 'color': [0.341, 0.349, 0.380], 'number': 82},
	    'Bi': {'symbol':  'Bi', 'name':       'bismuth', 'mass': 208.98040000, 'radius':  1.4800, 'color': [0.620, 0.310, 0.710], 'number': 83},
	    'Po': {'symbol':  'Po', 'name':      'polonium', 'mass': 210.00000000, 'radius':  1.4000, 'color': [0.671, 0.361, 0.000], 'number': 84},
	    'At': {'symbol':  'At', 'name':      'astatine', 'mass': 210.00000000, 'radius':  1.5000, 'color': [0.459, 0.310, 0.271], 'number': 85},
	    'Rn': {'symbol':  'Rn', 'name':         'radon', 'mass': 220.00000000, 'radius':  1.5000, 'color': [0.259, 0.510, 0.588], 'number': 86},
	    'Fr': {'symbol':  'Fr', 'name':      'francium', 'mass': 223.00000000, 'radius':  2.6000, 'color': [0.259, 0.000, 0.400], 'number': 87},
	    'Ra': {'symbol':  'Ra', 'name':        'radium', 'mass': 226.00000000, 'radius':  2.2100, 'color': [0.000, 0.490, 0.000], 'number': 88},
	    'Ac': {'symbol':  'Ac', 'name':      'actinium', 'mass': 227.00000000, 'radius':  2.1500, 'color': [0.439, 0.671, 0.980], 'number': 89},
	    'Th': {'symbol':  'Th', 'name':       'thorium', 'mass': 231.03588000, 'radius':  2.0600, 'color': [0.000, 0.729, 1.000], 'number': 90},
	    'Pa': {'symbol':  'Pa', 'name':  'protactinium', 'mass': 232.03806000, 'radius':  2.0000, 'color': [0.000, 0.631, 1.000], 'number': 91},
	    'U': {'symbol':   'U', 'name':       'uranium', 'mass': 237.00000000, 'radius':  1.9600, 'color': [0.000, 0.561, 1.000], 'number': 92},
	    'Np': {'symbol':  'Np', 'name':     'neptunium', 'mass': 238.02891000, 'radius':  1.9000, 'color': [0.000, 0.502, 1.000], 'number': 93},
	    'Pu': {'symbol':  'Pu', 'name':     'plutonium', 'mass': 243.00000000, 'radius':  1.8700, 'color': [0.000, 0.420, 1.000], 'number': 94},
	    'Am': {'symbol':  'Am', 'name':     'americium', 'mass': 244.00000000, 'radius':  1.8000, 'color': [0.329, 0.361, 0.949], 'number': 95},
	    'Cm': {'symbol':  'Cm', 'name':        'curium', 'mass': 247.00000000, 'radius':  1.6900, 'color': [0.471, 0.361, 0.890], 'number': 96},
	    'Bk': {'symbol':  'Bk', 'name':     'berkelium', 'mass': 247.00000000, 'radius':  1.6600, 'color': [0.541, 0.310, 0.890], 'number': 97},
	    'Cf': {'symbol':  'Cf', 'name':   'californium', 'mass': 251.00000000, 'radius':  1.6800, 'color': [0.631, 0.212, 0.831], 'number': 98},
	    'Es': {'symbol':  'Es', 'name':   'einsteinium', 'mass': 252.00000000, 'radius':  1.6500, 'color': [0.702, 0.122, 0.831], 'number': 99},
	    'Fm': {'symbol':  'Fm', 'name':       'fermium', 'mass': 257.00000000, 'radius':  1.6700, 'color': [0.702, 0.122, 0.729], 'number': 100},
	    'Md': {'symbol':  'Md', 'name':   'mendelevium', 'mass': 258.00000000, 'radius':  1.7300, 'color': [0.702, 0.051, 0.651], 'number': 101},
	    'No': {'symbol':  'No', 'name':      'nobelium', 'mass': 259.00000000, 'radius':  1.7600, 'color': [0.741, 0.051, 0.529], 'number': 102},
	    'Lr': {'symbol':  'Lr', 'name':    'lawrencium', 'mass': 262.00000000, 'radius':  1.6100, 'color': [0.780, 0.000, 0.400], 'number': 103},
	    'Rf': {'symbol':  'Rf', 'name': 'rutherfordium', 'mass': 261.00000000, 'radius':  1.5700, 'color': [0.800, 0.000, 0.349], 'number': 104},
	    'Db': {'symbol':  'Db', 'name':       'dubnium', 'mass': 262.00000000, 'radius':  1.4900, 'color': [0.820, 0.000, 0.310], 'number': 105},
	    'Sg': {'symbol':  'Sg', 'name':    'seaborgium', 'mass': 266.00000000, 'radius':  1.4300, 'color': [0.851, 0.000, 0.271], 'number': 106},
	    'Bh': {'symbol':  'Bh', 'name':       'bohrium', 'mass': 264.00000000, 'radius':  1.4100, 'color': [0.878, 0.000, 0.220], 'number': 107},
	    'Hs': {'symbol':  'Hs', 'name':       'hassium', 'mass': 277.00000000, 'radius':  1.3400, 'color': [0.902, 0.000, 0.180], 'number': 108},
	    'Mt': {'symbol':  'Mt', 'name':    'meitnerium', 'mass': 268.00000000, 'radius':  1.2900, 'color': [0.922, 0.000, 0.149], 'number': 109},
	    'Ds': {'symbol':  'Ds', 'name':            'Ds', 'mass': 271.00000000, 'radius':  1.2800, 'color': [0.922, 0.000, 0.149], 'number': 110},
	    'Uuu': {'symbol': 'Uuu', 'name':           'Uuu', 'mass': 272.00000000, 'radius':  1.2100, 'color': [0.922, 0.000, 0.149], 'number': 111},
	    'Uub': {'symbol': 'Uub', 'name':           'Uub', 'mass': 285.00000000, 'radius':  1.2200, 'color': [0.922, 0.000, 0.149], 'number': 112},
	    'Uut': {'symbol': 'Uut', 'name':           'Uut', 'mass': 284.00000000, 'radius':  1.3600, 'color': [0.922, 0.000, 0.149], 'number': 113},
	    'Uuq': {'symbol': 'Uuq', 'name':           'Uuq', 'mass': 289.00000000, 'radius':  1.4300, 'color': [0.922, 0.000, 0.149], 'number': 114},
	    'Uup': {'symbol': 'Uup', 'name':           'Uup', 'mass': 288.00000000, 'radius':  1.6200, 'color': [0.922, 0.000, 0.149], 'number': 115},
	    'Uuh': {'symbol': 'Uuh', 'name':           'Uuh', 'mass': 292.00000000, 'radius':  1.7500, 'color': [0.922, 0.000, 0.149], 'number': 116},
	    'Uus': {'symbol': 'Uus', 'name':           'Uus', 'mass': 294.00000000, 'radius':  1.6500, 'color': [0.922, 0.000, 0.149], 'number': 117},
	    'Uuo': {'symbol': 'Uuo', 'name':           'Uuo', 'mass': 296.00000000, 'radius':  1.5700, 'color': [0.922, 0.000, 0.149], 'number': 118}
	};

	function extend(out) {
	    out = out || {};
	    for (var i = 1; i < arguments.length; i++) {
	        if (!arguments[i])
	            continue;
	        for (var key in arguments[i]) {
	            if (arguments[i].hasOwnProperty(key))
	                out[key] = arguments[i][key];
	        }
	    }
	    return out;
	}

	function ajax_get(url, success_callback, error_callback) {
	    var request = new XMLHttpRequest();
	    request.open('GET', url, true);

	    request.onload = function() {
	        if (request.status >= 200 && request.status < 400) {
	            success_callback(request.responseText);
	        } else {
	            error_callback();
	        }
	    };

	    request.onerror = function() {
	        throw "Connection Error for ajax get request";
	    };

	    request.send();
	}

	var MIN_ATOM_RADIUS = Infinity;
	var MAX_ATOM_RADIUS = -Infinity;

	for (var symbol in elements) {
	    if (!elements.hasOwnProperty(symbol)) {
	        //The current property is not a direct property of p
	        continue;
	    }
	    MIN_ATOM_RADIUS = Math.min(MIN_ATOM_RADIUS, elements[symbol].radius);
	    MAX_ATOM_RADIUS = Math.max(MAX_ATOM_RADIUS, elements[symbol].radius);
	}

	function clamp(min$$1, max$$1, value) {
	    return Math.min(max$$1, Math.max(min$$1, value));
	}


	function View() {
	    return extend({
	        aspect: 1.0,
	        zoom: 0.125,
	        translation: {
	            x: 0.0,
	            y: 0.0
	        },
	        rotation: create$3(),
	        resolution: 400
	    }, config.atoms);
	}

	function center(v, system) {
	    var maxX = -Infinity;
	    var minX = Infinity;
	    var maxY = -Infinity;
	    var minY = Infinity;
	    for(var i = 0; i < system.atoms.length; i++) {
	        var a = system.atoms[i];
	        var r = elements[a.symbol].radius;
	        r = 2.5 * v.atomScale * (1 + (r - 1) * v.relativeAtomScale);
	        var p = fromValues$5(a.x, a.y, a.z, 0);
	        transformMat4$1(p, p, v.rotation);
	        maxX = Math.max(maxX, p[0] + r);
	        minX = Math.min(minX, p[0] - r);
	        maxY = Math.max(maxY, p[1] + r);
	        minY = Math.min(minY, p[1] - r);
	    }
	    var cx = minX + (maxX - minX) / 2.0;
	    var cy = minY + (maxY - minY) / 2.0;
	    v.translation.x = cx;
	    v.translation.y = cy;
	    var scale$$1 = Math.max(maxX - minX, maxY - minY);
	    v.zoom = 1/(scale$$1 * 1.01);
	}

	function clone$9(v) {
	    return deserialize(serialize(v));
	}

	function serialize(v) {
	    return JSON.stringify(v);
	}

	function deserialize(v) {
	    v = JSON.parse(v);
	    v.rotation = clone$3(v.rotation);
	    return v;
	}

	function resolve(v) {
	    v.dofStrength = clamp(0, 1, v.dofStrength);
	    v.dofPosition = clamp(0, 1, v.dofPosition);
	    v.zoom = clamp(0.001, 2.0, v.zoom);
	    v.atomScale = clamp(0, 1, v.atomScale);
	    v.relativeAtomScale = clamp(0, 1, v.relativeAtomScale);
	    v.bondScale = clamp(0, 1, v.bondScale);
	    v.bondShade = clamp(0, 1, v.bondShade);
	    v.atomShade = clamp(0, 1, v.atomShade);
	    v.ao = clamp(0, 1, v.ao);
	    v.brightness = clamp(0, 1, v.brightness);
	    v.outline = clamp(0, 1, v.outline);
	}

	function translate$4(v, dx, dy) {
	    v.translation.x -= dx/(v.resolution * v.zoom);
	    v.translation.y += dy/(v.resolution * v.zoom);
	    resolve(v);
	}

	function rotate$5(v, dx, dy) {
	    var m = create$3();
	    rotateY(m, m, dx * 0.005);
	    rotateX(m, m, dy * 0.005);
	    multiply$3(v.rotation, m, v.rotation);
	    resolve(v);
	}

	function getRect(v) {
	    var width = 1.0/v.zoom;
	    //console.log('width: ' + width + ' zoom '+ v.zoom);
	    var height = width/v.aspect;
	    var bottom = -height/2 + v.translation.y;
	    var top = height/2 + v.translation.y;
	    var left = -width/2 + v.translation.x;
	    var right = width/2 + v.translation.x;
	    return {
	        bottom: bottom,
	        top: top,
	        left: left,
	        right: right
	    };
	}

	function getBondRadius(v) {
	    return v.bondScale * v.atomScale *
	        (1 + (MIN_ATOM_RADIUS - 1) * v.relativeAtomScale);
	}

	function System() {
	    return {
	        atoms: [],
	        ellipsoids: [],
	        farAtom: undefined,
	        bonds: [],
	        lattice: {}
	    };
	}
	function calculateLattice(s){
	    var l = s.lattice.matrix;
	    var lattice_color = [0.1, 0.1, 0.1];
	    var lattice_radius = 0.03;
	    s.lattice.edges = [];
	    s.lattice.points = [];

	    function add_edge(p1, p2) {
	        s.lattice.edges.push({
	            posA: {x: p1[0], y: p1[1], z: p1[2]},
	            posB: {x: p2[0], y: p2[1], z: p2[2]},
	            radA: lattice_radius, radB: lattice_radius,
	            colA: {r: lattice_color[0], g: lattice_color[1], b: lattice_color[2]},
	            colB: {r: lattice_color[0], g: lattice_color[1], b: lattice_color[2]},
	            cutoff: 1.0
	        });
	    }
	    function add_point(p1) {
	        s.lattice.points.push({
	            position: p1,
	            color: lattice_color,
	            radius: lattice_radius
	        });
	    }

	    // Do calculation to find lattice unless specified
	    var o = [l[3], l[7], l[11]]; //offset
	    var v000 = fromValues$4(0+o[0], 0+o[1], 0+o[2]);
	    var v100 = fromValues$4(l[0]+o[0], l[1]+o[1], l[2]+o[2]);
	    var v010 = fromValues$4(l[4]+o[0], l[5]+o[1], l[6]+o[2]);
	    var v001 = fromValues$4(l[8]+o[0], l[9]+o[1], l[10]+o[2]);
	    var v110 = fromValues$4(l[0]+l[4]+o[0], l[1]+l[5]+o[1], l[2]+l[6]+o[2]);
	    var v101 = fromValues$4(l[0]+l[8]+o[0], l[1]+l[9]+o[1], l[2]+l[10]+o[2]);
	    var v011 = fromValues$4(l[4]+l[8]+o[0], l[5]+l[9]+o[1], l[6]+l[10]+o[2]);
	    var v111 = fromValues$4(l[0]+l[4]+l[8]+o[0], l[1]+l[5]+l[9]+o[1], l[2]+l[6]+l[10]+o[2]);
	    add_point(v000);
	    add_point(v100); add_point(v010); add_point(v001);
	    add_point(v110); add_point(v101); add_point(v011);
	    add_point(v111);

	    add_edge(v000, v100); add_edge(v000, v010); add_edge(v000, v001);
	    add_edge(v110, v010); add_edge(v110, v100); add_edge(v110, v111);
	    add_edge(v011, v111); add_edge(v011, v001); add_edge(v011, v010);
	    add_edge(v101, v001); add_edge(v101, v111); add_edge(v101, v100);
	}

	function calculateBonds(s) {
	    var bonds = [];
	    var sorted = s.atoms.slice();
	    sorted.sort(function(a, b) {
	        return a.z - b.z;
	    });
	    for (var i = 0; i < sorted.length; i++) {
	        var a = sorted[i];
	        var j = i + 1;
	        while(j < sorted.length && sorted[j].z < sorted[i].z + 2.5 * 2 * MAX_ATOM_RADIUS) {
	            var b = sorted[j];
	            var l = fromValues$4(a.x, a.y, a.z);
	            var m = fromValues$4(b.x, b.y, b.z);
	            var d = distance(l, m);
	            var ea = elements[a.symbol];
	            var eb = elements[b.symbol];
	            if (d < 2.5*(ea.radius+eb.radius)) {
	                bonds.push({
	                    posA: {
	                        x: a.x,
	                        y: a.y,
	                        z: a.z
	                    },
	                    posB: {
	                        x: b.x,
	                        y: b.y,
	                        z: b.z
	                    },
	                    radA: ea.radius,
	                    radB: eb.radius,
	                    colA: {
	                        r: ea.color[0],
	                        g: ea.color[1],
	                        b: ea.color[2]
	                    },
	                    colB: {
	                        r: eb.color[0],
	                        g: eb.color[1],
	                        b: eb.color[2]
	                    },
	                    cutoff: d/(ea.radius+eb.radius)
	                });
	            }
	            j++;
	        }
	    }
	    bonds.sort(function(a, b) {
	        return a.cutoff - b.cutoff;
	    });
	    s.bonds = bonds;
	}

	function addAtom(s, symbol, x, y, z) {
	    s.atoms.push({
	        symbol: symbol,
	        x: x,
	        y: y,
	        z: z
	    });
	}

	function addEllipsoid(s, symbol, x, y, z, qw, qx, qy, qz) {
	    s.ellipsoids.push({
	        symbol: symbol,
	        x: x,
	        y: y,
	        z: z,
		qw: qw,
		qx: qx,
		qy: qy,
		qz: qz	
	    });
	}

	function getCentroid(s) {
	    var xsum = 0;
	    var ysum = 0;
	    var zsum = 0;
	    for (var i = 0; i < s.atoms.length; i++) {
	        xsum += s.atoms[i].x;
	        ysum += s.atoms[i].y;
	        zsum += s.atoms[i].z;
	    }
	    return {
	        x: xsum/s.atoms.length,
	        y: ysum/s.atoms.length,
	        z: zsum/s.atoms.length
	    };
	}

	function center$1(s) {
	    var shift = getCentroid(s);
	    for (var i = 0; i < s.atoms.length; i++) {
	        var atom = s.atoms[i];
	        atom.x -= shift.x;
	        atom.y -= shift.y;
	        atom.z -= shift.z;
	    }

	    s.lattice.matrix[3] -= shift.x;
	    s.lattice.matrix[7] -= shift.y;
	    s.lattice.matrix[11] -= shift.z;
	}

	function getFarAtom(s) {
	    if (s.farAtom !== undefined) {
	        return s.farAtom;
	    }
	    s.farAtom = s.atoms[0];
	    var maxd = 0.0;
	    for (var i = 0; i < s.atoms.length; i++) {
	        var atom = s.atoms[i];
	        var r = elements[atom.symbol].radius;
	        var rd = Math.sqrt(r*r + r*r + r*r) * 2.5;
	        var d = Math.sqrt(atom.x*atom.x + atom.y*atom.y + atom.z*atom.z) + rd;
	        if (d > maxd) {
	            maxd = d;
	            s.farAtom = atom;
	        }
	    }
	    return s.farAtom;
	}

	function getRadius(s) {
	    var atom = getFarAtom(s);
	    var r = MAX_ATOM_RADIUS;
	    var rd = Math.sqrt(r*r + r*r + r*r) * 2.5;
	    return Math.sqrt(atom.x*atom.x + atom.y*atom.y + atom.z*atom.z) + rd;
	}

	function Renderer(canvas, resolution, aoResolution) {

	    var self = this;

	    var range,
	        system;

	    var gl;
	        // canvas; // hides arguments

	    var rAtoms = null,
	        rBonds = null,
	        //rDispQuad = null,
	        rAccumulator = null,
	        rAO = null,
	        rDOF = null,
	        rFXAA = null;

	    var tSceneColor, tSceneNormal, tSceneDepth,
	        tRandRotDepth, tRandRotColor,
	        tAccumulator, tAccumulatorOut,
	        tFXAA, tFXAAOut,
	        tDOF,
	        tAO;

	    var fbSceneColor, fbSceneNormal,
	        fbRandRot,
	        fbAccumulator,
	        fbFXAA,
	        fbDOF,
	        fbAO;

	    var progAtoms,
		progEllipsoids,
	        progBonds,
	        progAccumulator,
	        progAO,
	        progFXAA,
	        progDOF; //,
	        //progDisplayQuad;

	    // var ext;
	    
	    var sampleCount = 0,
	        colorRendered = false,
	        normalRendered = false;

	    self.getAOProgress = function() {
	        return sampleCount/1024;
	    };

	    self.initialize = function() {

	        // Initialize canvas/gl.
	        canvas.width = canvas.height = resolution;
	        gl = canvas.getContext('webgl2');
		if (gl === null) {
		    alert("Unable to initialize WebGL. Your browser may not support it.");
		    return;
		}
		
	        gl.enable(gl.DEPTH_TEST);
	        //gl.enable(gl.CULL_FACE);
		//gl.cullFace(GL.BACK);
	        gl.clearColor(0, 0, 0, 0);
	        gl.clearDepth(1);
	        gl.viewport(0, 0, resolution,resolution);
		
	        window.gl = gl; //debug

	        // ext = webgl.getExtensions(gl, [
	        //     "EXT_frag_depth",
	        //     "WEBGL_depth_texture",
	        // ]);

	        self.createTextures();

	        // Initialize shaders.
	        progAtoms = loadProgram(gl, ShaderChunk.atoms);
	        progEllipsoids = loadProgram(gl, ShaderChunk.ellipsoids);
	        progBonds = loadProgram(gl, ShaderChunk.bonds);
	        //progDisplayQuad = loadProgram(gl, ShaderChunk.texturedquad);
	        progAccumulator = loadProgram(gl, ShaderChunk.accumulator);
	        progAO = loadProgram(gl, ShaderChunk.ao);
	        progFXAA = loadProgram(gl, ShaderChunk.fxaa);
	        progDOF = loadProgram(gl, ShaderChunk.dof);

		// 2 triangles filling a quad
	        var position$$1 = [
	            -1, -1, 0,
	             1, -1, 0,
	             1,  1, 0,
	            -1, -1, 0,
	             1,  1, 0,
	            -1,  1, 0
	        ];

	        // Initialize geometry.
	        var attribs = buildAttribs(gl, {aPosition: 3});
	        attribs.aPosition.buffer.set(new Float32Array(position$$1));
	        var count = position$$1.length / 9; // number of indices to render: 2 primitives

		// why rDispQuad commented out in display() ?
	        //rDispQuad = new webgl.Renderable(gl, progDisplayQuad, attribs, count);
	        rAccumulator = new Renderable(gl, progAccumulator, attribs, count);
	        rAO = new Renderable(gl, progAO, attribs, count);
	        rFXAA = new Renderable(gl, progFXAA, attribs, count);
	        rDOF = new Renderable(gl, progDOF, attribs, count);
	    };

	    self.createTextures = function() {
	        // fbRandRot
	        tRandRotColor = new Texture(gl, 0, null, aoResolution, aoResolution);

	        tRandRotDepth = new Texture(gl, 1, null, aoResolution, aoResolution, {
	            internalFormat: gl.DEPTH_COMPONENT24, //gl.DEPTH_COMPONENT,
	            format: gl.DEPTH_COMPONENT,
	            type: gl.UNSIGNED_INT //gl.UNSIGNED_SHORT
	        });

	        fbRandRot = new Framebuffer(gl, [tRandRotColor], tRandRotDepth);

	        // fbScene
	        tSceneColor = new Texture(gl, 2, null, resolution, resolution);

	        tSceneNormal = new Texture(gl, 3, null, resolution, resolution);

	        tSceneDepth = new Texture(gl, 4, null, resolution, resolution, {
	            internalFormat: gl.DEPTH_COMPONENT24, //gl.DEPTH_COMPONENT,
	            format: gl.DEPTH_COMPONENT,
	            type: gl.UNSIGNED_INT //gl.UNSIGNED_SHORT
	            // internalFormat: gl.DEPTH_COMPONENT,
	            // format: gl.DEPTH_COMPONENT,
	            // type: gl.UNSIGNED_SHORT
	        });

	        fbSceneColor = new Framebuffer(gl, [tSceneColor], tSceneDepth);

	        fbSceneNormal = new Framebuffer(gl, [tSceneNormal], tSceneDepth);

	        // fbAccumulator
	        tAccumulator = new Texture(gl, 5, null, resolution, resolution);
	        tAccumulatorOut = new Texture(gl, 6, null, resolution, resolution);
	        fbAccumulator = new Framebuffer(gl, [tAccumulatorOut]);

	        // fbAO
	        tAO = new Texture(gl, 7, null, resolution, resolution);
	        fbAO = new Framebuffer(gl, [tAO]);

	        // fbFXAA
	        tFXAA = new Texture(gl, 8, null, resolution, resolution);
	        tFXAAOut = new Texture(gl, 9, null, resolution, resolution);
	        fbFXAA = new Framebuffer(gl, [tFXAAOut]);

	        // fbDOF
	        tDOF = new Texture(gl, 10, null, resolution, resolution);
	        fbDOF = new Framebuffer(gl, [tDOF]);
	    };

	    self.setResolution = function(res, aoRes) {
	        aoResolution = aoRes;
	        resolution = res;
	        canvas.width = canvas.height = resolution;
	        gl.viewport(0,0,resolution,resolution);
	        self.createTextures();
	    };

	    self.setSystem = function(newSystem, view) {

	        system = newSystem;

	        function make36(arr) {
	            var out = [];
	            for (var i = 0; i < 36; i++) {
	                out.push.apply(out, arr);
	            }
	            return out;
	        }

	        // "Atoms" (Spheres)
	        var attribs = buildAttribs(gl, {
	            aImposter: 3, aPosition: 3, aRadius: 1, aColor: 3
	        });

	        var imposter = [];
	        var position$$1 = [];
	        var radius = [];
	        var color = [];
		
		// atoms
	        for (let i = 0; i < system.atoms.length; i++) {
	            imposter.push.apply(imposter, position);
	            let a = system.atoms[i];
	            position$$1.push.apply(position$$1, make36([a.x, a.y, a.z]));
	            radius.push.apply(radius, make36([elements[a.symbol].radius]));
	            let c = elements[a.symbol].color;
	            color.push.apply(color, make36([c[0], c[1], c[2]]));
	        }

		// ellipsoids
	        for (let i = 0; i < system.ellipsoids.length; i++) {	    
	            imposter.push.apply(imposter, position);
	            let a = system.ellipsoids[i];
	            position$$1.push.apply(position$$1, make36([a.x, a.y, a.z]));
		    let stupidRadius = 5.0;
	            radius.push.apply(radius, make36([stupidRadius]));
	            let stupidColor = [1.0, 0.0, 0.0];
	            color.push.apply(color, make36([stupidColor[0],
						    stupidColor[1],
						    stupidColor[2]]));
	        }
		
	        if (view.lattice && system.lattice.points) {
	            for (var i = 0; i < system.lattice.points.length; i++) {
	                imposter.push.apply(imposter, position);
	                var a = system.lattice.points[i];
	                position$$1.push.apply(position$$1, make36(a.position));
	                radius.push.apply(radius, make36([-4.0 * getBondRadius(view)]));
	                color.push.apply(color, make36(a.color));
	            }
	        }

	        if (imposter.length > 0) { //ensure there are atoms
	            attribs.aImposter.buffer.set(new Float32Array(imposter));
	            attribs.aPosition.buffer.set(new Float32Array(position$$1));
	            attribs.aRadius.buffer.set(new Float32Array(radius));
	            attribs.aColor.buffer.set(new Float32Array(color));

	            var count = imposter.length / 9;

	            rAtoms = new Renderable(gl, progAtoms, attribs, count);
	        }

	        // "Bonds" (Cylinders)

	        if (view.bonds || view.lattice) {
	            rBonds = null;

	            let attribs = buildAttribs(gl, {
	                aImposter: 3,
	                aPosA: 3,
	                aPosB: 3,
	                aRadius: 1,
	                aRadA: 1,
	                aRadB: 1,
	                aColA: 3,
	                aColB: 3
	            });

	            let imposter = [];
	            let posa = [];
	            let posb = [];
	            let radius = [];
	            let rada = [];
	            let radb = [];
	            let cola = [];
	            let colb = [];

	            if (view.bonds && system.bonds.length > 0) {
	                for (var i = 0; i < system.bonds.length; i++) {
	                    var b = system.bonds[i];
	                    if (b.cutoff > view.bondThreshold) break;
	                    imposter.push.apply(imposter, position);
	                    posa.push.apply(posa, make36([b.posA.x, b.posA.y, b.posA.z]));
	                    posb.push.apply(posb, make36([b.posB.x, b.posB.y, b.posB.z]));
	                    radius.push.apply(radius, make36([2.5 * getBondRadius(view)]));
	                    rada.push.apply(rada, make36([b.radA]));
	                    radb.push.apply(radb, make36([b.radB]));
	                    cola.push.apply(cola, make36([b.colA.r, b.colA.g, b.colA.b]));
	                    colb.push.apply(colb, make36([b.colB.r, b.colB.g, b.colB.b]));
	                }
	            }

	            if (view.lattice && system.lattice.edges) {
	                for (var i = 0; i < system.lattice.edges.length; i++) {
	                    var b = system.lattice.edges[i];
	                    imposter.push.apply(imposter, position);
	                    posa.push.apply(posa, make36([b.posA.x, b.posA.y, b.posA.z]));
	                    posb.push.apply(posb, make36([b.posB.x, b.posB.y, b.posB.z]));
	                    radius.push.apply(radius, make36([0.5 * getBondRadius(view)]));
	                    rada.push.apply(rada, make36([b.radA]));
	                    radb.push.apply(radb, make36([b.radB]));
	                    cola.push.apply(cola, make36([b.colA.r, b.colA.g, b.colA.b]));
	                    colb.push.apply(colb, make36([b.colB.r, b.colB.g, b.colB.b]));
	                }
	            }

	            if (imposter.length > 0) { //Ensure that there are actually bonds
	                attribs.aImposter.buffer.set(new Float32Array(imposter));
	                attribs.aPosA.buffer.set(new Float32Array(posa));
	                attribs.aPosB.buffer.set(new Float32Array(posb));
	                attribs.aRadius.buffer.set(new Float32Array(radius));
	                attribs.aRadA.buffer.set(new Float32Array(rada));
	                attribs.aRadB.buffer.set(new Float32Array(radb));
	                attribs.aColA.buffer.set(new Float32Array(cola));
	                attribs.aColB.buffer.set(new Float32Array(colb));

	                var count = imposter.length / 9;

	                rBonds = new Renderable(gl, progBonds, attribs, count);
	            }
	        }
	    };

	    self.reset = function() {
	        sampleCount = 0;
	        colorRendered = false;
	        normalRendered = false;
	        tAccumulator.reset();
	        tAccumulatorOut.reset();
	    };

	    self.render = function(view) {
	        if (system === undefined) {
	            return;
	        }
	        if (rAtoms == null) {
	            return;
	        }

	        range = getRadius(system) * 2.0;
		
	        if (!colorRendered) {
	            color(view);
	        } else if (!normalRendered){
	            normal$$1(view);
	        } else {
		    //console.log('spf; ' + view.spf);
	            for (var i = 0; i < view.spf; i++) {
	                if (sampleCount > 1024) {
	                    break;
	                }

	                sample(view);

			//console.log('sampleCount: ' + sampleCount);

	                sampleCount++;
	            }
	        }
	        display(view);
	    };

	    function color(view) {
	        colorRendered = true;
	        gl.viewport(0, 0, resolution, resolution);
	        fbSceneColor.bind();
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        var rect = getRect(view);
	        var projection$$1 = create$3();
	        ortho(projection$$1,
			       rect.left, rect.right, rect.bottom, rect.top,
			       0, range);
	        var viewMat = create$3();
	        lookAt(viewMat, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
	        var model = create$3();
	        translate$2(model, model, [0, 0, -range/2]);
	        multiply$3(model, model, view.rotation);
	        progAtoms.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	        progAtoms.setUniform("uView", "Matrix4fv", false, viewMat);
	        progAtoms.setUniform("uModel", "Matrix4fv", false, model);
	        progAtoms.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	        progAtoms.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	        progAtoms.setUniform("uAtomScale", "1f", 2.5 * view.atomScale);
	        progAtoms.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	        progAtoms.setUniform("uRes", "1f", resolution);
	        progAtoms.setUniform("uDepth", "1f", range);
	        progAtoms.setUniform("uMode", "1i", 0);
	        progAtoms.setUniform("uAtomShade", "1f", view.atomShade);
	        rAtoms.render();

	        if ((view.bonds || view.lattice) && rBonds != null) {
	            fbSceneColor.bind();
	            progBonds.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	            progBonds.setUniform("uView", "Matrix4fv", false, viewMat);
	            progBonds.setUniform("uModel", "Matrix4fv", false, model);
	            progBonds.setUniform("uRotation", "Matrix4fv", false, view.rotation);
	            progBonds.setUniform("uDepth", "1f", range);
	            progBonds.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	            progBonds.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	            progBonds.setUniform("uRes", "1f", resolution);
	            progBonds.setUniform("uBondShade", "1f", view.bondShade);
	            progBonds.setUniform("uAtomScale", "1f", 2.5 * view.atomScale);
	            progBonds.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	            progBonds.setUniform("uMode", "1i", 0);
	            rBonds.render();
	        }
	    }


	    function normal$$1(view) {
	        normalRendered = true;
	        gl.viewport(0, 0, resolution, resolution);
	        fbSceneNormal.bind();
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        var rect = getRect(view);
	        var projection$$1 = create$3();
	        ortho(projection$$1, rect.left, rect.right, rect.bottom, rect.top,
			       0, range);
	        var viewMat = create$3();
	        lookAt(viewMat, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
	        var model = create$3();
	        translate$2(model, model, [0, 0, -range/2]);
	        multiply$3(model, model, view.rotation);
	        progAtoms.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	        progAtoms.setUniform("uView", "Matrix4fv", false, viewMat);
	        progAtoms.setUniform("uModel", "Matrix4fv", false, model);
	        progAtoms.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	        progAtoms.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	        progAtoms.setUniform("uAtomScale", "1f", 2.5 * view.atomScale);
	        progAtoms.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	        progAtoms.setUniform("uRes", "1f", resolution);
	        progAtoms.setUniform("uDepth", "1f", range);
	        progAtoms.setUniform("uMode", "1i", 1);
	        progAtoms.setUniform("uAtomShade", "1f", view.atomShade);
	        rAtoms.render();

	        if ((view.bonds || view.lattice) && rBonds != null) {
	            fbSceneNormal.bind();
	            progBonds.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	            progBonds.setUniform("uView", "Matrix4fv", false, viewMat);
	            progBonds.setUniform("uModel", "Matrix4fv", false, model);
	            progBonds.setUniform("uRotation", "Matrix4fv", false, view.rotation);
	            progBonds.setUniform("uDepth", "1f", range);
	            progBonds.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	            progBonds.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	            progBonds.setUniform("uRes", "1f", resolution);
	            progBonds.setUniform("uBondShade", "1f", view.bondShade);
	            progBonds.setUniform("uAtomScale", "1f", 2.5 * view.atomScale);
	            progBonds.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	            progBonds.setUniform("uMode", "1i", 1);
	            rBonds.render();
	        }
	    }

	    function sample(view) {
	        gl.viewport(0, 0, aoResolution, aoResolution);
	        var v = clone$9(view);
	        v.zoom = 1/range;
	        v.translation.x = 0;
	        v.translation.y = 0;
	        var rot = create$3();
	        for (var i = 0; i < 3; i++) {
	            var axis = random(create$4(), 1.0);
	            rotate$3(rot, rot, Math.random() * 10, axis);
	        }
	        v.rotation = multiply$3(create$3(), rot, v.rotation);
	        fbRandRot.bind();
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        var rect = getRect(v);
	        var projection$$1 = create$3();
	        ortho(projection$$1, rect.left, rect.right, rect.bottom, rect.top, 0, range);
	        var viewMat = create$3();
	        lookAt(viewMat, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
	        var model = create$3();
	        translate$2(model, model, [0, 0, -range/2]);
	        multiply$3(model, model, v.rotation);
	        progAtoms.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	        progAtoms.setUniform("uView", "Matrix4fv", false, viewMat);
	        progAtoms.setUniform("uModel", "Matrix4fv", false, model);
	        progAtoms.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	        progAtoms.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	        progAtoms.setUniform("uAtomScale", "1f", 2.5 * v.atomScale);
	        progAtoms.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	        progAtoms.setUniform("uRes", "1f", aoResolution);
	        progAtoms.setUniform("uDepth", "1f", range);
	        progAtoms.setUniform("uMode", "1i", 0);
	        progAtoms.setUniform("uAtomShade", "1f", view.atomShade);
	        rAtoms.render();

	        if ((view.bonds || view.lattice) && rBonds != null) {
	            progBonds.setUniform("uProjection", "Matrix4fv", false, projection$$1);
	            progBonds.setUniform("uView", "Matrix4fv", false, viewMat);
	            progBonds.setUniform("uModel", "Matrix4fv", false, model);
	            progBonds.setUniform("uRotation", "Matrix4fv", false, v.rotation);
	            progBonds.setUniform("uDepth", "1f", range);
	            progBonds.setUniform("uBottomLeft", "2fv", [rect.left, rect.bottom]);
	            progBonds.setUniform("uTopRight", "2fv", [rect.right, rect.top]);
	            progBonds.setUniform("uRes", "1f", aoResolution);
	            progBonds.setUniform("uBondShade", "1f", view.bondShade);
	            progBonds.setUniform("uAtomScale", "1f", 2.5 * view.atomScale);
	            progBonds.setUniform("uRelativeAtomScale", "1f", view.relativeAtomScale);
	            progBonds.setUniform("uMode", "1i", 0);
	            rBonds.render();
	        }

	        gl.viewport(0, 0, resolution, resolution);
	        var sceneRect = getRect(view);
	        var rotRect = getRect(v);
	        var invRot = invert$3(create$3(), rot);
	        fbAccumulator.bind();
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        progAccumulator.setUniform("uSceneDepth", "1i", tSceneDepth.index);
	        progAccumulator.setUniform("uSceneNormal", "1i", tSceneNormal.index);
	        progAccumulator.setUniform("uRandRotDepth", "1i", tRandRotDepth.index);
	        progAccumulator.setUniform("uAccumulator", "1i", tAccumulator.index);
	        progAccumulator.setUniform("uSceneBottomLeft", "2fv", [sceneRect.left, sceneRect.bottom]);
	        progAccumulator.setUniform("uSceneTopRight", "2fv", [sceneRect.right, sceneRect.top]);
	        progAccumulator.setUniform("uRotBottomLeft", "2fv", [rotRect.left, rotRect.bottom]);
	        progAccumulator.setUniform("uRotTopRight", "2fv", [rotRect.right, rotRect.top]);
	        progAccumulator.setUniform("uRes", "1f", resolution);
	        progAccumulator.setUniform("uDepth", "1f", range);
	        progAccumulator.setUniform("uRot", "Matrix4fv", false, rot);
	        progAccumulator.setUniform("uInvRot", "Matrix4fv", false, invRot);
	        progAccumulator.setUniform("uSampleCount", "1i", sampleCount);
	        rAccumulator.render();
	        tAccumulator.activate();
	        tAccumulator.bind();
	        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, resolution, resolution,0);
	    }

	    function display(view) {
	        gl.viewport(0, 0, resolution, resolution);
	        if (view.fxaa > 0 || view.dofStrength > 0) {
	            fbAO.bind();
	        } else {
	            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	        }
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        progAO.setUniform("uSceneColor", "1i", tSceneColor.index);
	        progAO.setUniform("uSceneDepth", "1i", tSceneDepth.index);
	        progAO.setUniform("uAccumulatorOut", "1i", tAccumulatorOut.index);
	        progAO.setUniform("uRes", "1f", resolution);
	        progAO.setUniform("uAO", "1f", 2.0 * view.ao);
	        progAO.setUniform("uBrightness", "1f", 2.0 * view.brightness);
	        progAO.setUniform("uOutlineStrength", "1f", view.outline);
	        rAO.render();

	        if (view.fxaa > 0) {
	            if (view.dofStrength > 0) {
	                fbFXAA.bind();
	            } else {
	                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	            }
	            for (var i = 0; i < view.fxaa; i++) {
	                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	                if (i == 0) {
	                    progFXAA.setUniform("uTexture", "1i", tAO.index);
	                } else {
	                    progFXAA.setUniform("uTexture", "1i", tFXAA.index);
	                }
	                progFXAA.setUniform("uRes", "1f", resolution);
	                rFXAA.render();
	                tFXAA.activate();
	                tFXAA.bind();
	                gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
					  0, 0, resolution, resolution, 0);
	            }
	        }

	        if (view.dofStrength > 0) {
	            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	            if (view.fxaa > 0) {
	                progDOF.setUniform("uColor", "1i", tFXAA.index);
	            } else {
	                progDOF.setUniform("uColor", "1i", tAO.index);
	            }
	            progDOF.setUniform("uDepth", "1i", tSceneDepth.index);
	            progDOF.setUniform("uDOFPosition", "1f", view.dofPosition);
	            progDOF.setUniform("uDOFStrength", "1f", view.dofStrength);
	            progDOF.setUniform("uRes", "1f", resolution);
	            rDOF.render();
	        }

		// why commented out?
	        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	        // progDisplayQuad.setUniform("uTexture", "1i", tSceneColor.index);
	        // progDisplayQuad.setUniform("uRes", "1f", resolution);
	        // rDispQuad.render();
	    }

	    self.initialize();
	}

	function loadProgram(gl, src) {
	    src = src.split('// __split__');
	    return new Program(gl, src[0], src[1]);
	}

	var StructureViewProto = Object.create(HTMLElement.prototype);
	StructureViewProto.createdCallback = function() {
	    this.style.display = "inline-block";

	    // var root = this.createShadowRoot();

	    var resolution = Math.min(this.clientWidth, this.clientHeight);
	    if (resolution < 100) {
	        resolution = 100;
	    }
	    var canvas = document.createElement('canvas');
	    canvas.width = resolution;
	    canvas.height = resolution;
	    canvas.style.cssText = "display: block; margin: auto;";
	    this.appendChild(canvas);

	    this._view = View();
	    this._view.resolution = resolution;
	    this._state = {
	        needReset: false,
	        lastX: 0.0,
	        lastY: 0.0,
	        buttonDown: false
	    };

	    add_event_handlers(this);

	    // Rendering pipeline
	    this._renderer = new Renderer(canvas, this._view.resolution, this._view.aoRes);
	    this._renderer.setResolution(this._view.resolution, this._view.aoRes);
	    this._system = System();

	    if (this.hasAttribute('lattice')) {
	        this._view.lattice = true;
	    } else {
	        this._view.lattice = false;
	    }

	    if (this.hasAttribute('bonds')) {
	        this._view.bonds = true;
	        this._view = extend(this._view, config.atomsbonds);
	    } else {
	        this._view.bonds = false;
	    }
	    resolve(this._view);

	    var that = this;
	    var atoms;
	    var ellipsoids;
	    
	    if (this.hasAttribute('src')) {
	        // this.readStructure(this.getAttribute('src'),
		// 		   this.getAttribute('format'));
		let url = this.getAttribute('src');
		let format = this.getAttribute('format');
		let extension = url.split('.').slice(-1)[0];
		if (format && ['xyz'].indexOf(format) >= 0) {
	            extension = format;
		} else if (format) {
	            throw "Unrecognized structure format: " + format;
		}

		// changed below to load sequentially xyz and ell in order to
		// call loadStructure once
		// was:

		// if (this.hasAttribute('src')) {
	        //     this.readStructure(this.getAttribute('src'), this.getAttribute('format'));
		// }
	    	// if (that.hasAttribute('ellipsoids')) {
		//     that.readEllipsoids(that.getAttribute('ellipsoids'),
		//     			that.getAttribute('format'));
		// }
	    	
		if (extension === 'xyz') {
	            ajax_get(url, function(content) {
			atoms = xyz(content)[0]; //grab first frame for now

			if (that.hasAttribute('ellipsoids')) {
			    // that.readEllipsoids(that.getAttribute('ellipsoids'),
			    // 		    that.getAttribute('format'));
			    let url = that.getAttribute('ellipsoids');
			    let format = that.getAttribute('ellformat');
			    let extension = url.split('.').slice(-1)[0];
			    if (format && ['ell'].indexOf(format) >= 0) {
				extension = format;
			    } else if (format) {
				throw "Unrecognized structure format: " + format;
			    }

			    if (extension === 'ell') {
				ajax_get(url, function(content) {
				    ellipsoids = ell(content)[0]; //grab first frame for now
				    that.loadStructure({atoms: atoms, ellipsoids: ellipsoids});
				}, function(){
				    throw "Unable to load file from url";
				});
			    } else {
				throw "Unrecognized filename extension for src!";
			    }
			} else {
			    that.loadStructure({atoms: atoms});
			}
	            }, function(){
			throw "Unable to load file from url";
	            });
		} else {
	            throw "Unrecognized filename extension for src!";
		}
	    }
	};


	StructureViewProto.readStructure = function(url, format) {
	    var extension = url.split('.').slice(-1)[0];
	    if (format && ['xyz'].indexOf(format) >= 0) {
	        extension = format;
	    } else if (format) {
	        throw "Unrecognized structure format: " + format;
	    }
	    var that = this;
	    if (extension === 'xyz') {
	        ajax_get(url, function(content) {
	            var data = xyz(content)[0]; //grab first frame for now
	            that.loadStructure({atoms: data});
	        }, function(){
	            throw "Unable to load file from url";
	        });
	    } else {
	        throw "Unrecognized filename extension for src!";
	    }
	};

	StructureViewProto.readEllipsoids = function(url, format) {
	    var extension = url.split('.').slice(-1)[0];
	    if (format && ['ell'].indexOf(format) >= 0) {
	        extension = format;
	    } else if (format) {
	        throw "Unrecognized structure format: " + format;
	    }
	    var that = this;
	    if (extension === 'ell') {
	        ajax_get(url, function(content) {
	            var data = ell(content)[0]; //grab first frame for now
	            that.loadEllipsoids({ellipsoids: data});
	        }, function(){
	            throw "Unable to load file from url";
	        });
	    } else {
	        throw "Unrecognized filename extension for src!";
	    }
	};


	StructureViewProto.loadStructure = function(data) {
	    // Expects objects of {lattice: 3x3, atoms: Nx3}
	    // lattice is not required
	    this._system = System();

	    var minx = Infinity,
	        miny = Infinity,
	        minz = Infinity,
	        maxx = -Infinity,
	        maxy = -Infinity,
	        maxz = -Infinity;

	    for (var i = 0; i < data.atoms.length; i++) {
	        var atom = data.atoms[i];
	        var x = atom.position[0];
	        var y = atom.position[1];
	        var z = atom.position[2];

	        if (x < minx) minx = x;
	        if (y < miny) miny = y;
	        if (z < minz) minz = z;
	        if (x > maxx) maxx = x;
	        if (y > maxy) maxy = y;
	        if (z > maxz) maxz = z;

	        addAtom(this._system, atom.symbol, x, y, z);
	    }

	    if (data.lattice) {
	        var l = data.lattice;
	        this._system.lattice.matrix = fromValues$3(
	            l[0], l[1], l[2], 0,
	            l[3], l[4], l[5], 0,
	            l[6], l[7], l[8], 0,
	            0, 0, 0, 1);

	    } else {
	        this._system.lattice.matrix = fromValues$3(
	            maxx-minx, 0, 0, minx,
	            0, maxy-miny, 0, miny,
	            0, 0, maxz-minz, minz,
	            0, 0, 0, 1);
	    }

	    center$1(this._system);

	    if (this._view.lattice) {
	        calculateLattice(this._system);
	    }

	    if (this._view.bonds) {
	        calculateBonds(this._system);
	    }

	    if (data.ellipsoids != undefined) {
		for (var i = 0; i < data.ellipsoids.length; i++) {
	            var ellipsoid = data.ellipsoids[i];
	            var x = ellipsoid.position[0];
	            var y = ellipsoid.position[1];
	            var z = ellipsoid.position[2];
	            var qw = ellipsoid.q[0];
	            var qx = ellipsoid.q[1];
	            var qy = ellipsoid.q[2];
	            var qz = ellipsoid.q[3];

		    addEllipsoid(this._system, ellipsoid.symbol,
					x, y, z, qw, qx, qy, qz);
		}
	    }
	    
	    this._renderer.setSystem(this._system, this._view);
	    center(this._view, this._system);
	    this._state.needReset = true;

	    render(this);
	};


	StructureViewProto.attributeChangedCallback = function(attrName, oldValue, newValue) {
	    if (attrName === "bonds") {
	        if (this.hasAttribute("bonds")) {
	            calculateBonds(this._system);
	            this._view.bonds = true;
	            this._view = extend(this._view, config.atomsbonds);
	        } else {
	            this._view.bonds = false;
	            this._view = extend(this._view, config.atoms);
	        }
	        resolve(this._view);
	        this._renderer.setSystem(this._system, this._view);
	        this._state.needReset = true;
	    } else if (attrName === "lattice") {
	        if (this.hasAttribute("lattice")) {
	            calculateLattice(this._system);
	            this._view.lattice = true;
	        } else {
	            this._view.lattice = false;
	        }
	        resolve(this._view);
	        this._renderer.setSystem(this._system, this._view);
	        this._state.needReset = true;
	    } else if (attrName === "src") {
	        if (this.hasAttribute('src')) {
	            this.readStructure(this.getAttribute('src'), this.getAttribute('format'));
	        }
	    }
	};


	var StructureView = document.registerElement('structure-view', {
	    prototype: StructureViewProto
	});


	function render(speck) {
	    if (speck._state.needReset) {
	        speck._renderer.reset();
	        speck._state.needReset = false;
	    }
	    speck._renderer.render(speck._view);
	    requestAnimationFrame(function(){
	        render(speck);
	    });
	}

	function add_event_handlers(speck) {
	    speck.addEventListener('mousedown', function(e) {
	        document.body.style.cursor = "none";
	        if (e.button == 0) {
	            speck._state.buttonDown = true;
	        }
	        speck._state.lastX = e.clientX;
	        speck._state.lastY = e.clientY;
	    });

	    window.addEventListener("mouseup", function(e) {
	        document.body.style.cursor = "";
	        if (e.button == 0) {
	            speck._state.buttonDown = false;
	        }
	    });

	    setInterval(function() {
	        if (!speck._state.buttonDown) {
	            document.body.style.cursor = "";
	        }
	    }, 10);

	    window.addEventListener("mousemove", function(e) {
	        if ((speck.clientWidth != speck._state.width)
		    || (speck.clientHeight != speck._state.height)) {
	            speck.dispatchEvent(new CustomEvent("resize-canvas",
							{"detail": "resize canvas"}));
	        }

	        speck._state.width = speck.clientWidth;
	        speck._state.height = speck.clientHeight;

	        if (!speck._state.buttonDown) {
	            return;
	        }

	        var dx = e.clientX - speck._state.lastX;
	        var dy = e.clientY - speck._state.lastY;
	        if (dx == 0 && dy == 0) {
	            return;
	        }
	        speck._state.lastX = e.clientX;
	        speck._state.lastY = e.clientY;
	        if (e.shiftKey) {
	            translate$4(speck._view, dx, dy);
	        } else {
	            rotate$5(speck._view, dx, dy);
	        }
	        speck._state.needReset = true;
	    });

	    speck.addEventListener("wheel", function(e) {
	        var wd = 0;
	        if (e.deltaY < 0) {
	            wd = 1;
	        }
	        else {
	            wd = -1;
	        }
	        speck._view.zoom = speck._view.zoom * (wd === 1 ? 1/0.9 : 0.9);
	        resolve(speck._view);
	        speck._state.needReset = true;

	        e.preventDefault();
	    });

	    speck.addEventListener("resize-canvas", function(e) {
	        var resolution = Math.min(speck.clientWidth, speck.clientHeight);
	        if (resolution < 100) {
	            resolution = 100;
	        }
	        speck._view.resolution = resolution;
	        resolve(speck._view);
	        speck._renderer.setResolution(speck._view.resolution, speck._view.aoRes);
	        speck._state.needReset = true;
	    });
	}

})));
