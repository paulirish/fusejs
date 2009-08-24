  /*------------------------------ LANG: ARRAY -------------------------------*/

  (function(List) {
    List.from = function from(iterable) {
      if (!iterable || iterable == '') return List();

      // Safari 2.x will crash when accessing a non-existent property of a
      // node list, not in the document, that contains a text node unless we
      // use the `in` operator
      var object = Fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return List.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = List(length);
      while (length--) if (length in object) results[length] = iterable[length];
      return results;
    };

    List.fromNodeList = function fromNodeList(nodeList) {
      var i = 0, results = List();
      while (results[i] = nodeList[i++]) { }
      return results.length-- && results;
    };

    // prevent JScript bug with named function expressions
    var from = null, fromNodeList = null;
  })(Fuse.Array);

  Fuse.addNS('Util');

  Fuse.Util.$A = Fuse.Array.from;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin._each = function _each(callback) {
      this.forEach(callback);
      return this;
    };

    plugin.clear = function clear() {
      if (this == null) throw new TypeError;
      var object = Object(this);

      if (!isArray(object)) {
        var length = object.length >>> 0;
        while (length--) if (length in object) delete object[length];
      }
      object.length = 0;
      return object;
    };

    plugin.clone = (function() {
      function clone() {
        var object = Object(this);
        if (this == null) throw new TypeError;

        if (isArray(object)) {
          return object.constructor !== Fuse.Array
            ? Fuse.Array.fromArray(object)
            : object.slice(0);
        }
        return Fuse.Array.from(object);
      }
      return clone;
    })();

    plugin.compact = function compact(falsy) {
      if (this == null) throw new TypeError;
      var i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (falsy) {
        for ( ; i < length; i++)
          if (object[i] && object[i] != '') results.push(object[i]);
      } else {
        for ( ; i < length; i++)
          if (object[i] != null) results.push(object[i]);
      }
      return results;
    };

    plugin.flatten = function flatten() {
      if (this == null) throw new TypeError;
      var i = 0, results = Fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) {
        if (isArray(object[i]))
          concatList(results, plugin.flatten.call(object[i]));
        else results.push(object[i]);
      }
      return results;
    };

    plugin.insert = function insert(index, value) {
      if (this == null) throw new TypeError;
      var object = Object(this),
       length = object.length >>> 0;

      if (length < index) object.length = index;
      if (index < 0) index = length;
      if (arguments.length > 2)
        plugin.splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
      else plugin.splice.call(object, index, 0, value);
      return object;
    };

    plugin.unique = function unique() {
      var item, i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++)
        if (i in object && !results.contains(item = object[i]))
          results.push(item);
      return results;
    };

    plugin.without = function without() {
      if (this == null) throw new TypeError;
      var i = 0, args = slice.call(arguments, 0), indexOf = plugin.indexOf,
       results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++)
        if (i in object && indexOf.call(args, object[i]) == -1)
          results.push(object[i]);
      return results;
    };

    /* Create optimized Enumerable equivalents */

    plugin.contains = (function() {
      var contains = function contains(value) {
        if (this == null) throw new TypeError;
        var item, object = Object(this), length = object.length >>> 0;

        while (length--) {
          if (length in object) {
            // basic strict match
            if ((item = object[length]) === value) return true;
            // match String and Number object instances
            try { if (item.valueOf() === value.valueOf()) return true } catch (e) { }
          }
        }
        return false;
      };

      if (typeof plugin.indexOf === 'function') {
        var __contains = contains;
        contains = function contains(value) {
          // attempt a fast strict search first
          if (this == null) throw new TypeError;
          var object = Object(this);

          if (plugin.indexOf.call(object, value) > -1) return true;
          return __contains.call(object, value);
        };
      }
      return contains;
    })();

    plugin.each = function each(callback, thisArg) {
      try {
        plugin.forEach.call(this, callback, thisArg);
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    };

    plugin.first = function first(callback, thisArg) {
      if (this == null) throw new TypeError;
      var i = 0, object = Object(this),
       length = object.length >>> 0;

      if (callback == null) {
        for ( ; i < length; i++)
          if (i in object) return object[i];
      }
      else if (typeof callback === 'function') {
        for ( ; i < length; i++)
          if (callback.call(thisArg, object[i], i))
            return object[i];
      }
      else {
        var count = 1 * callback; // fast coerce to number
        if (isNaN(count)) return Fuse.Array();
        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, 0, count);
      }
    };

    plugin.inject = (function() {
      var inject = function inject(accumulator, callback, thisArg) {
        if (this == null) throw new TypeError;
        var i = 0, object = Object(this), length = object.length >>> 0;

        if (thisArg) {
          for ( ; i < length; i++) if (i in object)
            accumulator = callback.call(thisArg, accumulator, object[i], i, object);
        }
        else {
          for ( ; i < length; i++) if (i in object)
            accumulator = callback(accumulator, object[i], i, object);
        }
        return accumulator;
      };

      // use Array#reduce if available
      if (typeof plugin.reduce === 'function') {
        var _inject = inject;
        inject = function inject(accumulator, callback, thisArg) {
          return thisArg
            ? _inject.call(this, accumulator, callback, thisArg)
            : plugin.reduce.call(this, callback, accumulator);
        };
      }
      return inject;
    })();

    plugin.intersect = (function() {
      function intersect(array) {
        if (this == null) throw new TypeError;
        var item, i = 0, results = Fuse.Array(),
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (i in object &&
              contains.call(array, item = object[i]) && !results.contains(item))
            results.push(item);
        }
        return results;
      }

      var contains = plugin.contains;
      return intersect;
    })();

    plugin.invoke = function invoke(method) {
      if (this == null) throw new TypeError;
      var args, i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0, funcProto = Function.prototype;

      if (arguments.length < 2) {
        while (length--) if (length in object)
          results[length] = funcProto.call.call(object[length][method], object[length]);
      } else {
        args = slice.call(arguments, 1);
        while (length--) if (length in object)
          results[length] = funcProto.apply.call(object[length][method], object[length], args);
      }
      return results;
    };

    plugin.last = function last(callback, thisArg) {
      if (this == null) throw new TypeError;
      var object = Object(this), length = object.length >>> 0;

      if (callback == null)
        return object[length && length - 1];
      if (typeof callback === 'function') {
        while (length--)
          if (callback.call(thisArg, object[length], length, object))
            return object[length];
      }
      else {
        var results = Fuse.Array(), count = 1 * callback;
        if (isNaN(count)) return results;

        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, length - count);
      }
    };

    plugin.max = function max(callback, thisArg) {
      if (this == null) throw new TypeError;

      var result;
      if (!callback && (callback = K) && isArray(this)) {
        // John Resig's fast Array max|min:
        // http://ejohn.org/blog/fast-javascript-maxmin
        result = Math.max.apply(Math, this);
        if (!isNaN(result)) return result;
        result = undef;
      }

      var comparable, max, value, i = 0,
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) {
        if (i in object) {
          comparable = callback.call(thisArg, value = object[i], i, object);
          if (max == null || comparable > max) {
            max = comparable; result = value;
          }
        }
      }
      return result;
    };

    plugin.min = function min(callback, thisArg) {
      if (this == null) throw new TypeError;

      var result;
      if (!callback && (callback = K) && isArray(this)) {
        result = Math.min.apply(Math, this);
        if (!isNaN(result)) return result;
        result = undef;
      }

      var comparable, min, value, i = 0,
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) {
        if (i in object) {
          comparable = callback.call(thisArg, value = object[i], i, object);
          if (min == null || comparable < min) {
            min = comparable; result = value;
          }
        }
      }
      return result;
    };

    plugin.partition = function partition(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || K;
      var i = 0, trues = Fuse.Array(), falses = Fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) if (i in object)
        (callback.call(thisArg, object[i], i, object) ?
          trues : falses).push(object[i]);
      return Fuse.Array(trues, falses);
    };

    plugin.pluck = function pluck(property) {
      if (this == null) throw new TypeError;
      var i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++) if (i in object)
        results[i] = object[i][property];
      return results;
    };

    plugin.size = function size() {
      if (this == null) throw new TypeError;
      return Fuse.Number(Object(this).length >>> 0);
    };

    plugin.sortBy = function sortBy(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || K;
      var value, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      while (length--) {
        value = object[length];
        results[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
      }

      return results.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    plugin.zip = function zip() {
      if (this == null) throw new TypeError;

      var i = 0, results = Fuse.Array(), callback = K,
       args = slice.call(arguments, 0), object = Object(this),
       length = object.length >>> 0;

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();

      var collection = prependList(plugin.map.call(args, Fuse.Util.$A), object, Fuse.Array());
      for ( ; i < length; i++)
        results.push(callback(collection.pluck(i), i, object));
      return results;
    };

    // aliases
    plugin.toArray =
    plugin.toList  = plugin.clone;

    // prevent JScript bug with named function expressions
    var _each =  null,
     clear =     null,
     compact =   null,
     each =      null,
     first =     null,
     flatten =   null,
     insert =    null,
     invoke =    null,
     last =      null,
     max =       null,
     min =       null,
     partition = null,
     pluck =     null,
     size =      null,
     sortBy =    null,
     unique =    null,
     without =   null,
     zip =       null;
  })(Fuse.Array.plugin);

  /*--------------------------------------------------------------------------*/

  /* Use native browser JS 1.6 implementations if available */

  (function(plugin) {

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    // ECMA-5 15.4.4.4
    if (!plugin.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      plugin.concat = function concat() {
        if (this == null) throw new TypeError;

        var i = 0, args = arguments, length = args.length, object = Object(this),
         results = isArray(object) ? Fuse.Array.fromArray(object) : Fuse.Array(object);

        for ( ; i < length; i++) {
          if (isArray(args[i])) {
            for (var j = 0, sub = args[i], subLen = sub.length; j < subLen; j++)
              results.push(sub[j]);
          } else results.push(args[i]);
        }
        return results;
      };

    // ECMA-5 15.4.4.16
    if (!plugin.every)
      plugin.every = function every(callback, thisArg) {
        callback = callback || K;
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = 0, object = Object(this), length = object.length >>> 0;
        for ( ; i < length; i++)
          if (i in object && !callback.call(thisArg, object[i], i, object))
            return false;
        return true;
      };

    // ECMA-5 15.4.4.20
    if (!plugin.filter)
      plugin.filter = function filter(callback, thisArg) {
        callback = callback || function(value) { return value != null };
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = 0, results = Fuse.Array(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++)
          if (i in object && callback.call(thisArg, object[i], i, object))
            results.push(object[i]);
        return results;
      };

    // ECMA-5 15.4.4.18
    if (!plugin.forEach)
      plugin.forEach = function forEach(callback, thisArg) {
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = 0, object = Object(this), length = object.length >>> 0;
        if (thisArg) {
          for ( ; i < length; i++)
            i in object && callback.call(thisArg, object[i], i, object);
        } else {
          for ( ; i < length; i++)
            i in object && callback(object[i], i, object);
        }
      };

    // ECMA-5 15.4.4.14
    if (!plugin.indexOf)
      plugin.indexOf = function indexOf(item, fromIndex) {
        if (this == null) throw new TypeError;

        fromIndex = fromIndex >> 0;
        var object = Object(this), length = object.length >>> 0;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        for ( ; fromIndex < length; fromIndex++)
          if (fromIndex in object && object[fromIndex] === item)
            return Fuse.Number(fromIndex);
        return Fuse.Number(-1);
      };

    // ECMA-5 15.4.4.15
    if (!plugin.lastIndexOf)
      plugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        if (this == null) throw new TypeError;

        var object = Object(this), length = object.length >>> 0;
        fromIndex = arguments.length === 2 ? fromIndex >> 0 : length;

        if (!length) return Fuse.Number(-1);
        if (fromIndex > length) fromIndex = length - 1;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        for ( ; fromIndex > -1; fromIndex--)
          if (fromIndex in object && object[fromIndex] === item) break;
        return Fuse.Number(fromIndex);
      };

    // ECMA-5 15.4.4.19
    if (!plugin.map)
      plugin.map = function map(callback, thisArg) {
        if (!callback) return plugin.clone.call(this);
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = 0, results = Fuse.Array(), object = Object(this),
         length = object.length >>> 0;

        if (thisArg) {
          for ( ; i < length; i++)
            if (i in object) results[i] = callback.call(thisArg, object[i], i, object);
        } else {
          for ( ; i < length; i++)
            if (i in object) results[i] = callback(object[i], i, object);
        }
        return results;
      };

    // ECMA-5 15.4.4.17
    if (!plugin.some)
      plugin.some = function some(callback, thisArg) {
        callback = callback || K;
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = 0, object = Object(this), length = object.length >>> 0;
        for ( ; i < length; i++)
          if (i in object && callback.call(thisArg, object[i], i, object))
            return true;
        return false;
      };

    // assign any missing Enumerable methods
    if (Fuse.Enumerable) {
      eachKey(Fuse.Enumerable.plugin, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function')
          plugin[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var concat =   null,
     every =       null,
     filter =      null,
     forEach =     null,
     indexOf =     null,
     lastIndexOf = null,
     map =         null,
     some =        null;
  })(Fuse.Array.plugin);
