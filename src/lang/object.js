  /*------------------------------ LANG: OBJECT ------------------------------*/

  Object._each = (function() {
    // use switch statement to avoid creating a temp variable
    var _each;
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1 };
      klass.prototype.toString = 0;
      for (key in new klass()) count++;
      return count;
    }()) {
      case 0: // IE
        var dontEnumProperties = ['constructor', 'hasOwnkey', 'isPrototypeOf',
          'propertyIsEnumerable', 'prototype', 'toLocaleString', 'toString', 'valueOf'];
        _each =  function _each(object, callback) {
          if (object) {
            var key, i = 0;
            for (key in object)
              callback(object[key], key, object);
            while(key = dontEnumProperties[i++])
              if (Object.hasKey(object, key))
                 callback(object[key], key, object);
          }
          return object;
        };
        break;

      case 1:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        _each = function _each(object, callback) {
          var key, keys = { };
          for (key in object) {
            if (!Object.hasKey(keys, key)) {
              keys[key] = true;
              callback(object[key], key, object);
            }
          }
          return object;
        };
        break;

      default: // Others
        _each = function _each(object, callback) {
          for (var key in object)
            callback(object[key], key, object);
          return object;
        };
    }
    return _each;
  })();

  Object._extend = (function() {
    function _extend(destination, source) {
      for (var key in source)
         destination[key] = source[key]; 
      return destination;
    }
    return _extend;
  })();

  Object.extend = (function() {
    function extend(destination, source) {
      Object._each(source || { }, function(value, key) { 
         destination[key] = value; 
      });
      return destination;
    }
    return extend;
  })();

  Object.hasKey = (function() {
    var hasKey, hasOwnProperty = Object.prototype.hasOwnProperty;
    if (typeof hasOwnProperty !== 'function') {
      if (Feature('OBJECT_PROTO')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives into objects so they work with the IN statement
          if (typeof object !== 'object' && !Object.isFunction(object))
            object = new object.constructor(object);

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
          return object[property] !== object.constructor.prototype[property];
        };
      }
    }
    else hasKey = function(object, property) {
      // ECMA-3.1 Draft 15.2.4.5
      if (object == null) throw new TypeError;
      return hasOwnProperty.call(object, property);
    };

    // Opera (bug occurs with the window object and not the global)
    if (typeof window !== 'undefined' && window.Object &&
        !hasKey(window, 'Object')) {
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

  (function() {
    this.clone = function clone(object) {
      return Object.extend({ }, object);
    };

    this.each = function each(object, callback, thisArg) {
      try {
        Object._each(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return object;
    };

    this.inspect = function inspect(object) {
      if (typeof object === 'undefined') return 'undefined';
      if (object === null) return 'null';
      if (typeof object.inspect === 'function') return object.inspect();

      try {
        return String(object);
      } catch (e) {
        if (e.constructor === RangeError) return '...';
        throw e;
      }
    };

    this.isElement = function isElement(value) {
      return !!value && value.nodeType === 1;
    };

    this.isHash = function isHash(value) {
      return !!value && value.constructor === Hash;
    };

    this.isPrimitive = function isPrimitive(value) {
      // ECMA-3.1 Draft 4.3.2
      var type = typeof value;
      return value == null || type === 'boolean' || type === 'number' || type === 'string';
    };

    this.isSameOrigin = function isSameOrigin(url) {
      // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
      var domain = document.domain,
       protocol = global.location.protocol,
       // http://www.iana.org/assignments/port-numbers
       defaultPort = (protocol === 'ftp:') ? 21 :
         (protocol === 'https:') ? 443 : 80,
       // #{protocol}//#{hostname}#{port}
       parts = String(url)
         .match(/([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^/:$]+)(?:\:(\d+))?/) || [];

      return !parts[0] || (parts[1] === protocol &&
        parts[2].endsWith(domain) && (parts[3] || 
          defaultPort) === (global.location.port || defaultPort));
    };

    this.isUndefined = function isUndefined(value) {
      return typeof value === 'undefined';
    };

    this.toHTML = function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? object.toHTML()
        : String.interpret(object);
    };

    this.toJSON = function toJSON(object) {
      var type = typeof object;
      switch (type) {
        case 'undefined':
        case 'function':
        case 'unknown': return;
        case 'boolean': return object.toString();
      }

      if (object === null) return 'null';
      if (typeof object.toJSON === 'function') return object.toJSON();
      if (Object.isElement(object)) return;

      var results = [];
      Object._each(object, function(value, key) {
        value = Object.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(key.toJSON() + ': ' + value);
      });
      return '{' + results.join(', ') + '}';
    };

    this.toQueryPair = function toQueryPair(key, value) {
      if (typeof value === 'undefined') return key;
      return key + '=' + encodeURIComponent(String.interpret(value));
    };

    this.toQueryString = function toQueryString(object) {
      var toQueryPair = Object.toQueryPair, results = [];
      Object._each(object, function(value, key) {
        key = encodeURIComponent(key);
        if (value && typeof value === 'object') {
          if (Object.isArray(value))
            concatList(results, value.map(toQueryPair.curry(key)));
        } else results.push(toQueryPair(key, value));
      });
      return results.join('&');
    };

    this.keys = function keys(object) {
      // ECMA-3.1 Draft 15.2.3.14
      if (Object.isPrimitive(object))
        throw new TypeError;
      var results = [];
      Object._each(object, function(value, key) {
        if (Object.hasKey(object, key))
          results.push(key);
      });
      return results;
    };

    this.values = function values(object) {
      if (Object.isPrimitive(object))
        throw new TypeError;
      var results = [];
      Object._each(object, function(value, key) {
        if (Object.hasKey(object, key))
          results.push(value);
      });
      return results;
    };

    // prevent JScript bug with named function expressions
    var clone =      null,
     each =          null,
     inspect =       null,
     isElement =     null,
     isHash =        null,
     isPrimitive =   null,
     isSameOrigin =  null,
     isUndefined =   null,
     keys =          null,
     toJSON =        null,
     toQueryPair =   null,
     toQueryString = null,
     toHTML =        null,
     values =        null;
  }).call(Object);

  (function() {
    // used to access the an object's internal [[Class]] property
    var toString = Object.prototype.toString;

    this.isArray = function isArray(value) {
      return toString.call(value) === '[object Array]';
    };

    this.isFunction = function isFunction(value) {
      return toString.call(value) === '[object Function]';
    };

    this.isNumber = function isNumber(value) {
      return toString.call(value) === '[object Number]' && isFinite(value);
    };

    this.isRegExp = function isRegExp(value) {
      return toString.call(value) === '[object RegExp]';
    };

    this.isString = function isString(value) {
      return toString.call(value) === '[object String]';
    };

    // prevent JScript bug with named function expressions
    var isArray = null,
     isFunction = null,
     isNumber =   null,
     isRegExp =   null,
     isString =   null;
  }).call(Object);
