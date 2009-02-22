  /*------------------------------ LANG: OBJECT ------------------------------*/

  (function() {
    // used to access the an object's internal [[Class]] property
    var toString = Object.prototype.toString;

    function clone(object) {
      return Object.extend({ }, object);
    }

    function each(object, callback, thisArg) {
      try {
        Object._each(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return object;
    }

    function extend(destination, source) {
      Object._each(source || { }, function(value, key) { 
         destination[key] = value; 
      });
      return destination;
    }

    function inspect(object) {
      if (typeof object === 'undefined') return 'undefined';
      if (object === null) return 'null';
      if (typeof object.inspect === 'function') return object.inspect();

      try {
        return String(object);
      } catch (e) {
        if (e.constructor === RangeError) return '...';
        throw e;
      }
    }

    function isArray(object) {
      return toString.call(object) === '[object Array]';
    }

    function isElement(object) {
      return !!object && object.nodeType === 1;
    }

    function isFunction(object) {
      return toString.call(object) === '[object Function]';
    }

    function isHash(object) {
      return !!object && object.constructor === Hash;
    }

    function isNumber(object) {
      return toString.call(object) === '[object Number]' && isFinite(object);
    }

    function isRegExp(object) {
      return toString.call(object) === '[object RegExp]';
    }

    /* https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript */
    function isSameOrigin(url) {
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
    }

    function isString(object) {
      return toString.call(object) === '[object String]';
    }

    function isUndefined(object) {
      return typeof object === 'undefined';
    }

    function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? object.toHTML()
        : String.interpret(object);
    }

    function toJSON(object) {
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
    }

    function toQueryPair(key, value) {
      if (typeof value === 'undefined') return key;
      return key + '=' + encodeURIComponent(String.interpret(value));
    }

    function toQueryString(object) {
      var results = [];
      Object._each(object, function(value, key) {
        key = encodeURIComponent(key);
        if (value && typeof value === 'object') {
          if (Object.isArray(value))
            results = concatList(results, value.map(toQueryPair.curry(key)));
        } else results.push(toQueryPair(key, value));
      });
      return results.join('&');
    }

    function keys(object) {
      // ECMA 3.1 Draft: 15.2.3.14
      if (!object || typeof object !== 'object')
        throw new TypeError;
      var results = [];
      Object._each(object, function(value, key) {
        if (Object.isOwnProperty(object, key))
          results.push(key);
      });
      return results;
    }

    function values(object) {
      if (!object || typeof object !== 'object')
        throw new TypeError;
      var results = [];
      Object._each(object, function(value, key) {
        if (Object.isOwnProperty(object, key))
          results.push(value);
      });
      return results;
    }

    var _each = (function() {
      var iterations = (function() {
        var key, count = 0, klass = function() { this.toString = 1 };
        klass.prototype.toString = 0;
        for (key in new klass()) count++;
        return count;
      })();

      // IE
      if (iterations === 0) {
        var dontEnumProperties = ['constructor', 'hasOwnkey', 'isPrototypeOf',
          'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];
        delete iterations;
        return function(object, callback) {
          if (object) {
            var key, i = 0;
            for (key in object)
              callback(object[key], key, object);
            while(key = dontEnumProperties[i++])
              if (Object.isOwnProperty(object, key))
                 callback(object[key], key, object);
          }
          return object;
        };
      }
      // Tobie Langel: Safari 2 broken for-in loop
      // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
      if (iterations === 2) {
        delete iterations;
        return function(object, callback) {
          var key, keys = { };
          for (key in object) {
            if (!Object.isOwnProperty(keys, key)) {
              keys[key] = true;
              callback(object[key], key, object);
            }
          }
          return object;
        };
      }
      // Others
      delete iterations;
      return function(object, callback) {
        for (var key in object)
          callback(object[key], key, object);
        return object;
      };
    })();

    var isOwnProperty = (function() {
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      if (typeof hasOwnProperty !== 'function') {
        if (Feature('OBJECT_PROTO')) {
          // Safari 2
          return function(object, property) {
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
          return function(object, property) {
            if (object == null) throw new TypeError;
            return object[property] !== object.constructor.prototype[property];
          };
        }
      }
      return function(object, property) {
        // ECMA-3.1 15.2.4.5
        if (object == null) throw new TypeError;
        return hasOwnProperty.call(object, property);
      };
    })();

    (function() {
      // Opera (bug occurs with the window object and not the global)
      if (typeof window !== 'undefined' && window.Object &&
          !isOwnProperty(window, 'Object')) {

        var _isOwnProperty = isOwnProperty;
        isOwnProperty = function(object, property) {
          if (object == null) throw new TypeError;
          if(object == global) {
            return property in object && 
              object[property] !== Object.prototype[property];
          }
          return _isOwnProperty(object, property);
        };
      }
    })();

    Object._each = _each;
    Object.isOwnProperty = isOwnProperty;

    extend(Object, {
      'clone':         clone,
      'each':          each,
      'extend':        extend,
      'inspect':       inspect,
      'isArray':       isArray,
      'isElement':     isElement,
      'isFunction':    isFunction,
      'isHash':        isHash,
      'isNumber':      isNumber,
      'isRegExp':      isRegExp,
      'isSameOrigin':  isSameOrigin,
      'isString':      isString,
      'isUndefined':   isUndefined,
      'keys':          keys,
      'toJSON':        toJSON,
      'toQueryString': toQueryString,
      'toHTML':        toHTML,
      'values':        values
    });
  })();
