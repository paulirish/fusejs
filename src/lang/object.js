  /*------------------------------ LANG: OBJECT ------------------------------*/

  (function() {
    function clone(object) {
      return Object.extend({ }, object);
    }

    function extend (destination, source) {
      for (var property in source)
        destination[property] = source[property];
      return destination;
    }

    function inspect(object) {
      try {
        if (typeof object === 'undefined') return 'undefined';
        if (object === null) return 'null';
        return object.inspect ? object.inspect() : String(object);
      } catch (e) {
        if (e instanceof RangeError) return '...';
        throw e;
      }
    }

    function isArray(object) {
      return object != null && typeof object === 'object' &&
        'splice' in object && 'join' in object;
    }

    function isElement(object) {
      return !!(object && object.nodeType == 1);
    }

    function isFunction(object) {
      return typeof object === 'function';
    }

    function isHash(object) {
      return !!(object && object instanceof Hash);
    }

    function isNumber(object) {
      return object != null && typeof object.valueOf === 'function' && 
        typeof object.valueOf() === 'number' && isFinite(object);
    }

    function isString(object) {
      return object != null && typeof object.valueOf === 'function' &&
        typeof object.valueOf() === 'string';
    }

    function isUndefined(object) {
      return typeof object == 'undefined';
    }

    function toHTML(object) {
      return object && object.toHTML ? object.toHTML() : String.interpret(object);
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
      if (object.toJSON) return object.toJSON();
      if (Object.isElement(object)) return;

      var results = [];
      for (var property in object) {
        var value = Object.toJSON(object[property]);
        if (typeof value !== 'undefined')
          results.push(property.toJSON() + ': ' + value);
      }

      return '{' + results.join(', ') + '}';
    }

    function toQueryString(object) {
      return $H(object).toQueryString();
    }

    function keys(object) {
      var results = [];
      for (var property in object)
        results.push(property);
      return results;
    }

    function values(object) {
      var results = [];
      for (var property in object)
        results.push(object[property]);
      return results;
    }

    extend(Object, {
      'clone':         clone,
      'extend':        extend,
      'inspect':       inspect,
      'isArray':       isArray,
      'isElement':     isElement,
      'isFunction':    isFunction,
      'isHash':        isHash,
      'isNumber':      isNumber,
      'isString':      isString,
      'isUndefined':   isUndefined,
      'keys':          keys,
      'toJSON':        toJSON,
      'toQueryString': toQueryString,
      'toHTML':        toHTML,
      'values':        values
    });
  })();
