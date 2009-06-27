  /*------------------------------ LANG: ARRAY -------------------------------*/

  (function() {
    this.from = function from(iterable) {
      if (!iterable || iterable == '') return Fuse.Array();

      // Safari 2.x will crash when accessing a non-existent property of a
      // node list, not in the document, that contains a text node unless we
      // use the `in` operator
      var object = Fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return Fuse.Array.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = Fuse.Array(length);
      while (length--) if (length in object) results[length] = iterable[length];
      return results;
    }

    this.fromNodeList = function fromNodeList(nodeList) {
      var i = 0, results = Fuse.Array();
      while (results[i] = nodeList[i++]) { }
      return results.length-- && results;
    };

    // prevent JScript bug with named function expressions
    var from = null, fromNodeList = null;
  }).call(Fuse.Array);

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$A = Fuse.Array.from;

  Fuse.Util.$w = (function() {
    function $w(string) {
      if (!Fuse.Object.isString(string)) return Fuse.Array();
      string = proto.trim.call(string);
      return string != '' ? string.split(/\s+/) : Fuse.Array();
    }
    var proto = Fuse.String.prototype;
    return $w;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    var proto = this;

    this._each = function _each(callback) {
      this.forEach(callback);
      return this;
    };

    this.clear = function clear() {
      if (this == null) throw new TypeError;
      var object = Object(this);

      if (!Fuse.Object.isArray(object)) {
        var length = object.length >>> 0;
        while (length--) if (length in object) delete object[length];
      }
      object.length = 0;
      return object;
    };

    this.clone = function clone() {
      var object = Object(this);
      if (this == null) throw new TypeError;

      if (Fuse.Object.isArray(object)) {
        return object.constructor !== Fuse.Array
          ? Fuse.Array.fromArray(object)
          : object.slice(0);
      }
      return Fuse.Array.from(object);
    };

    this.compact = function compact(falsy) {
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

    this.each = function each(callback, thisArg) {
      try {
        proto.forEach.call(this, callback, thisArg);
      } catch (e) {
        if (e !== Fuse.$break) throw e;
      }
      return this;
    };

    this.first = function first(callback, thisArg) {
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
        // Fast numeric type conversion:
        // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
        var count = +callback;
        if (isNaN(count)) return Fuse.Array();
        count = count < 1 ? 1 : count > length ? length : count;
        return proto.slice.call(object, 0, count);
      }
    };

    this.flatten = function flatten() {
      if (this == null) throw new TypeError;
      var i = 0, isArray = Fuse.Array.isArray, results = Fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) {
        if (isArray(object[i]))
          concatList(results, proto.flatten.call(object[i]));
        else results.push(object[i]);
      }
      return results;
    };

    this.insert = function insert(index, value) {
      if (this == null) throw new TypeError;
      var object = Object(this),
       length = object.length >>> 0;

      if (length < index) object.length = index;
      if (index < 0) index = length;
      if (arguments.length > 2)
        proto.splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
      else proto.splice.call(object, index, 0, value);
      return object;
    };

    this.inspect = function inspect() {
      if (this == null) throw new TypeError;
      var i = 0, results = result = [], object = Object(this),
       length = object.length >>> 0;

      while (length--) results[length] = Fuse.Object.inspect(object[length]);
      return '[' + results.join(', ') + ']';
    };

    this.intersect = function intersect(array) {
      if (this == null) throw new TypeError;
      var item, i = 0, indexOf = proto.indexOf, results = Fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) {
        item = array[i];
        if (i in object && indexOf.call(object, item) != -1 &&
            results.indexOf(item) == -1)
          results.push(item);
      }
      return results;
    };

    this.last = function last(callback, thisArg) {
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
        var results = Fuse.Array(), count = +callback;
        if (isNaN(count)) return results;

        count = count < 1 ? 1 : count > length ? length : count;
        return proto.slice.call(object, length - count);
      }
    };

    this.size = function size() {
      if (this == null) throw new TypeError;
      return Fuse.Number(Object(this).length >>> 0);
    };

    this.unique = function unique() {
      var i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++)
        if (i in object && results.indexOf(object[i]) == -1)
          results.push(object[i]);
      return results;
    };

    this.without = function without() {
      if (this == null) throw new TypeError;
      var i = 0, args = slice.call(arguments, 0), indexOf = proto.indexOf,
       results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++)
        if (i in object && indexOf.call(args, object[i]) == -1)
          results.push(object[i]);
      return results;
    };

    /* Create optimized Enumerable equivalents */

    this.contains = (function() {
      var contains = function contains(value, strict) {
        if (this == null) throw new TypeError;
        var object = Object(this), length = object.length >>> 0;

        if (strict) {
          while (length--)
            if (length in object && object[length] === value) return true;
        } else {
          while (length--)
            if (length in object && object[length] == value) return true;
        }
        return false;
      };

      if (typeof proto.indexOf === 'function') {
        var _contains = contains;
        contains = function contains(value, strict) {
          // attempt a fast strict search first
          if (this == null) throw new TypeError;
          var object = Object(this),
           result = proto.indexOf.call(object, value) != -1;

          if (strict || result) return result;
          return _contains.call(object, value);
        };
      }
      return contains;
    })();

    this.inject = (function() {
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
      if (typeof proto.reduce === 'function') {
        var _inject = inject;
        inject = function inject(accumulator, callback, thisArg) {
          return thisArg
            ? _inject.call(this, accumulator, callback, thisArg)
            : proto.reduce.call(this, callback, accumulator);
        };
      }
      return inject;
    })();

    this.invoke = function invoke(method) {
      if (this == null) throw new TypeError;
      var args, i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) if (length in object)
          results[length] = Function.prototype.call.call(object[length][method], object[length]);
      } else {
        args = slice.call(arguments, 1);
        while (length--) if (length in object)
          results[length] = Function.prototype.apply.call(object[length][method], object[length], args);
      }
      return results;
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (this == null) throw new TypeError;
      if (!pattern || pattern == '' || Fuse.Object.isRegExp(pattern) &&
         !pattern.source) return proto.toArray.call(this);

      callback = callback || Fuse.K;
      var item, i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (Fuse.Object.isString(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      for ( ; i < length; i++)
        if (i in object && pattern.test(object[i]))
          results.push(callback.call(thisArg, object[i], i, object));
      return results;
    };

    this.max = function max(callback, thisArg) {
      if (this == null) throw new TypeError;
      var result;
      
      if (!callback && (callback = Fuse.K) && Fuse.Object.isArray(this)) {
        // John Resig's fast Array max|min:
        // http://ejohn.org/blog/fast-javascript-maxmin
        result = Math.max.apply(Math, this);
        if (!isNaN(result)) return result;
        result = null;
      }

      var value, i = 0, object = Object(this), length = object.length >>> 0;
      for ( ; i < length; i++) {
        if (i in object) {
          value = callback.call(thisArg, object[i], i, object);
          if (result == null || value >= result)
            result = value;
        }
      }
      return result;
    };

    this.min = function min(callback, thisArg) {
      if (this == null) throw new TypeError;
      var result;

      if (!callback && (callback = Fuse.K) && Fuse.Object.isArray(this)) {
        result = Math.min.apply(Math, this);
        if (!isNaN(result)) return result;
        result = null;
      }

      var value, i = 0, object = Object(this), length = object.length >>> 0;
      for ( ; i < length; i++) {
        if (i in object) {
          value = callback.call(thisArg, object[i], i, object);
          if (result == null || value < result)
            result = value;
        }
      }
      return result;
    };

    this.partition = function partition(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || Fuse.K;
      var i = 0, trues = Fuse.Array(), falses = Fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      for ( ; i < length; i++) if (i in object)
        (callback.call(thisArg, object[i], i, object) ?
          trues : falses).push(object[i]);
      return Fuse.Array(trues, falses);
    };

    this.pluck = function pluck(property) {
      if (this == null) throw new TypeError;
      var i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++) if (i in object)
        results[i] = object[i][property];
      return results;
    };

    this.sortBy = function sortBy(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || Fuse.K;
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

    this.zip = function zip() {
      if (this == null) throw new TypeError;

      var i = 0, results = Fuse.Array(), callback = Fuse.K,
       args = slice.call(arguments, 0), object = Object(this),
       length = object.length >>> 0;

      if (typeof proto.last.call(args) === 'function')
        callback = args.pop();

      var collection = prependList(proto.map.call(args, Fuse.Util.$A), object, Fuse.Array());
      for ( ; i < length; i++)
        results.push(callback(collection.pluck(i), i, object));
      return results;
    };

    /* Use native browser JS 1.6 implementations if available */

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    // ECMA-5 15.4.4.4
    if (!this.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      this.concat = function concat() {
        if (this == null) throw new TypeError;

        var i = 0, args = arguments, length = args.length, object = Object(this),
         results = Fuse.Array.isArray(object) ? Fuse.Array.fromArray(object) : Fuse.Array(object);

        for ( ; i < length; i++) {
          if (Fuse.Array.isArray(args[i])) {
            for (var j = 0, sub = args[i], subLen = sub.length; j < subLen; j++)
              results.push(sub[j]);
          } else results.push(args[i]);
        }
        return results;
      };

    // ECMA-5 15.4.4.16
    if (!this.every) this.every = function every(callback, thisArg) {
      callback = callback || Fuse.K;
      if (this == null || !Fuse.Object.isFunction(callback)) throw new TypeError;

      var i = 0, object = Object(this), length = object.length >>> 0;
      for ( ; i < length; i++)
        if (i in object && !callback.call(thisArg, object[i], i, object))
          return false;
      return true;
    };

    // ECMA-5 15.4.4.20
    if (!this.filter) this.filter = function filter(callback, thisArg) {
      callback = callback || function(value) { return value != null };
      if (this == null || !Fuse.Object.isFunction(callback)) throw new TypeError;

      var i = 0, results = Fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      for ( ; i < length; i++)
        if (i in object && callback.call(thisArg, object[i], i, object))
          results.push(object[i]);
      return results;
    };

    // ECMA-5 15.4.4.18
    if (!this.forEach) this.forEach = function forEach(callback, thisArg) {
      if (this == null || !Fuse.Object.isFunction(callback)) throw new TypeError;

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
    if (!this.indexOf) this.indexOf = function indexOf(item, fromIndex) {
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
    if (!this.lastIndexOf) this.lastIndexOf = function lastIndexOf(item, fromIndex) {
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
    if (!this.map) this.map = function map(callback, thisArg) {
      if (!callback) return proto.clone.call(this);
      if (this == null || !Fuse.Object.isFunction(callback)) throw new TypeError;

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
    if (!this.some) this.some = function some(callback, thisArg) {
      callback = callback || Fuse.K;
      if (this == null || !Fuse.Object.isFunction(callback)) throw new TypeError;

      var i = 0, object = Object(this), length = object.length >>> 0;
      for ( ; i < length; i++)
        if (i in object && callback.call(thisArg, object[i], i, object))
          return true;
      return false;
    };

    // aliases
    this.toArray =
    this.toList  = this.clone;

    // assign any missing Enumerable methods
    if (Fuse.Enumerable) {
      Fuse.Object.each(Fuse.Enumerable.Plugin, function(value, key) {
        if (typeof proto[key] !== 'function') proto[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var _each =    null,
     clear =       null,
     clone =       null,
     compact =     null,
     concat =      null,
     each =        null,
     every =       null,
     filter =      null,
     first =       null,
     flatten =     null,
     forEach =     null,
     grep =        null,
     indexOf =     null,
     insert =      null,
     inspect =     null,
     intersect =   null,
     invoke =      null,
     last =        null,
     lastIndexOf = null,
     map =         null,
     max =         null,
     min =         null,
     partition =   null,
     pluck =       null,
     size =        null,
     some =        null,
     sortBy =      null,
     unique =      null,
     without =     null,
     zip =         null;
  }).call(Fuse.Array.Plugin);
