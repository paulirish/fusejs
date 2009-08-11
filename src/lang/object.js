  /*------------------------------ LANG: OBJECT ------------------------------*/

  Fuse.Object._each = (function() {
    // use switch statement to avoid creating a temp variable
    var _each;
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1 };
      klass.prototype.toString = 1;
      for (key in new klass()) count++;
      return count;
    }()) {
      case 0: // IE
        var dontEnumProperties = ['constructor', 'hasOwnkey', 'isPrototypeOf',
          'propertyIsEnumerable', 'prototype', 'toLocaleString', 'toString', 'valueOf'];
        return _each = function _each(object, callback) {
          if (object) {
            var key, i = 0;
            for (key in object) callback(object[key], key, object);
            while(key = dontEnumProperties[i++])
              if (Fuse.Object.hasKey(object, key))
                callback(object[key], key, object);
          }
          return object;
        };

      case 2:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        return _each = function _each(object, callback) {
          var key, keys = { };
          for (key in object)
            if (!Fuse.Object.hasKey(keys, key) && (keys[key] = 1))
              callback(object[key], key, object);
          return object;
        };

      default: // Others
        return _each = function _each(object, callback) {
          for (var key in object) callback(object[key], key, object);
          return object;
        };
    }
  })();

  Fuse.Object.hasKey = (function() {
    var hasKey, hasOwnProperty = Object.prototype.hasOwnProperty;
    if (typeof hasOwnProperty !== 'function') {
      if (Feature('OBJECT__PROTO__')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives to objects so IN operator will work
          object = Object(object);

          var result, proto = object['__proto__'];
          object['__proto__'] = null;
          result = property in object;
          object['__proto__'] = proto;
          return result;
        };
      } else {
        // Other
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          object = Object(object);
          return object[property] !== object.constructor.prototype[property];
        };
      }
    }
    else hasKey = function(object, property) {
      // ECMA-5 15.2.4.5
      if (object == null) throw new TypeError;
      return hasOwnProperty.call(object, property);
    };

    // Opera (bug occurs with the window object and not the global)
    if (typeof window !== 'undefined' && window.Object && !hasKey(window, 'Object')) {
      var _hasKey = hasKey;
      hasKey = function hasKey(object, property) {
        if (object == null) throw new TypeError;
        if(object == global) {
          return property in object &&
            object[property] !== Object.prototype[property];
        }
        return _hasKey(object, property);
      };
    }
    return hasKey;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    this._extend = function _extend(destination, source) {
      for (var key in source)
         destination[key] = source[key];
      return destination;
    };

    this.clone = function clone(object) {
      if (object && typeof object.clone === 'function')
        return object.clone();
      return Fuse.Object.extend(Fuse.Object(), object);
    };

    this.each = function each(object, callback, thisArg) {
      try {
        Fuse.Object._each(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== Fuse.$break) throw e;
      }
      return object;
    };

    this.extend = function extend(destination, source) {
      if (source) {
        Fuse.Object._each(source, function(value, key) {
          destination[key] = value;
        });
      }
      return destination;
    };

    // ECMA-5 15.2.3.14
    if (!this.keys) this.keys = function keys(object) {
      if (Fuse.Object.isPrimitive(object))
        throw new TypeError;
      var results = Fuse.List();
      Fuse.Object._each(object, function(value, key) {
        if (Fuse.Object.hasKey(object, key))
          results.push(key);
      });
      return results;
    };

    this.values = function values(object) {
      if (Fuse.Object.isPrimitive(object))
        throw new TypeError;
      var results = Fuse.List();
      Fuse.Object._each(object, function(value, key) {
        if (Fuse.Object.hasKey(object, key))
          results.push(value);
      });
      return results;
    };

    // prevent JScript bug with named function expressions
    var _extend = null,
     clone =      null,
     each =       null,
     extend =     null,
     keys =       null,
     values =     null;
  }).call(Fuse.Object);

  /*--------------------------------------------------------------------------*/

  (function() {
    // used to access the an object's internal [[Class]] property
    var toString = Object.prototype.toString;

    this.inspect = function inspect(value) {
      if (value != null) {
        var object = Fuse.Object(value);
        if (typeof object.inspect === 'function')
          return object.inspect();

        // Attempt to avoid inspecting DOM nodes.
        // IE treats nodes like objects:
        // IE7 and below are missing the node's constructor property 
        // IE8 node constructors are typeof "object"
        try {
          var string = toString.call(object), constructor = object.constructor;
          if (string === '[object Object]' && constructor &&
              typeof constructor !== 'object') {
            var results = [];
            Fuse.Object._each(object, function(value, key) {
              if (Fuse.Object.hasKey(object, key))
                results.push(Fuse.String(key).inspect() + ': ' +
                  Fuse.Object.inspect(object[key]));
            });
            return Fuse.String('{' + results.join(', ') + '}');
          }
        } catch (e) { }
      }

      // try coercing to string
      try {
        return Fuse.String(value);
      } catch (e) {
        if (e.constructor === global.RangeError) return Fuse.String('...');
        throw e;
      }
    };

    this.isArray = function isArray(value) {
      return Fuse.List.isArray(value);
    };

    this.isElement = function isElement(value) {
      return !!value && value.nodeType === 1;
    };

    this.isEmpty = (function() {
      var isEmpty = function isEmpty(object) {
        for (var key in object)
          if (Fuse.Object.hasKey(object, key))
            return false;
        return true;
      };

      if (Feature('OBJECT__COUNT__')) {
        // __count__ is buggy on arrays so we check for push because it's fast.
        var _isEmpty = isEmpty;
        isEmpty = function isEmpty(object) {
          return !object || object.push ? _isEmpty(object) : !object['__count__'];
        };
      }
      return isEmpty;
    })();

    this.isFunction = function isFunction(value) {
      return toString.call(value) === '[object Function]';
    };

    this.isHash = function isHash(value) {
      return value instanceof Fuse.Hash;
    };

    this.isNumber = function isNumber(value) {
      return toString.call(value) === '[object Number]' && isFinite(value);
    };

    this.isPrimitive = function isPrimitive(value) {
      // ECMA-5 4.3.2
      var type = typeof value;
      return value == null || type === 'boolean' || type === 'number' || type === 'string';
    };

    this.isRegExp = function isRegExp(value) {
      return toString.call(value) === '[object RegExp]';
    };

    this.isSameOrigin = function isSameOrigin(url) {
      // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
      // http://www.iana.org/assignments/port-numbers
      var domain = Fuse._doc.domain, protocol = global.location.protocol,
       defaultPort = protocol === 'ftp:' ? 21 : protocol === 'https:' ? 443 : 80,
       parts = String(url).match(/([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/) || [];

      return !parts[0] || (parts[1] === protocol &&
        Fuse.String.Plugin.endsWith.call(parts[2], domain) &&
          (parts[3] || defaultPort) === (global.location.port || defaultPort));
    };

    this.isString = function isString(value) {
      return toString.call(value) === '[object String]';
    };

    this.isUndefined = function isUndefined(value) {
      return typeof value === 'undefined';
    };

    // prevent JScript bug with named function expressions
    var inspect =   null,
     isArray =      null,
     isElement =    null,
     isFunction =   null,
     isHash =       null,
     isNumber =     null,
     isPrimitive =  null,
     isRegExp =     null,
     isSameOrigin = null,
     isString =     null,
     isUndefined =  null;
  }).call(Fuse.Object);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.toHTML = function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? Fuse.String(object.toHTML())
        : Fuse.String.interpret(object);
    };

    this.toQueryString = (function() {
      function toQueryPair(key, value) {
        return Fuse.String(typeof value === 'undefined' ? key :
          key + '=' + encodeURIComponent(Fuse.String.interpret(value)));
      }

      function toQueryString(object) {
        var Obj = Fuse.Object, hasKey = Obj.hasKey, results = Fuse.List();

        Obj._each(object, function(value, key) {
          if (hasKey(object, key)) {
            key = encodeURIComponent(key);
            if (value && typeof value === 'object') {
              if (Fuse.List.isArray(value)) {
                var i = results.length, j = 0, length = i + value.length;
                while (i < length) results[i++] = toQueryPair(key, value[j++]);
              }
            } else results.push(toQueryPair(key, value));
          }
        });
        return results.join('&');
      }

      return toQueryString;
    })();

    // prevent JScript bug with named function expressions
    var toHTML = null;
  }).call(Fuse.Object);
