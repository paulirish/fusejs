  /*------------------------------ LANG: ARRAY -------------------------------*/

  global.$A = (function() {
    function $A(iterable) {
      if (!iterable) return [];
      // Safari 2.x will crash when accessing a non-existent property of a
      // node list that contains a text node unless we use the `in` operator
      if ('toArray' in iterable) return iterable.toArray();
      var length = iterable.length || 0, results = new Array(length);
      while (length--) results[length] = iterable[length];
      return results;
    }
    return $A;
  })();

  global.$w = (function() {
   function $w(string) {
      if (typeof string !== 'string') return [];
      string = string.trim();
      return string ? string.split(/\s+/) : [];
    }
    return $w;
  })();

  Array.from = $A;

  (function() {
    this._each = function _each(callback) {
      this.forEach(callback);
    };

    this.clear = function clear() {
      this.length = 0;
      return this;
    };

    this.clone = function clone() {
      return slice.call(this, 0);
    };

    this.compact = function compact(falsy) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (!(this[i] == null || falsy && !this[i]))
          results.push(this[i]);
      return results;
    };

    this.each = function each(callback, thisArg) {
      try {
        this.forEach(callback, thisArg);
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    };

    this.first = function first(callback, thisArg) {
      var length = this.length;
      if (callback == null) return this[0];
      if (typeof callback === 'function') {
        for (var i = 0; i < length; i++)
          if (callback.call(thisArg, this[i], i))
            return this[i];
        return;
      }
      // Fast numeric type conversion:
      // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
      var count = +callback;
      if (isNaN(count)) return [];
      count = count < 1 ? 1 : count > length ? length : count;
      return slice.call(this, 0, count);
    };

    this.flatten = function flatten() {
      for (var i = 0, results = [], length = this.length; i < length; i++) {
        if (Object.isArray(this[i])) 
          concatList(results, this[i].flatten());
        else results.push(this[i]);
      }
      return results;
    };

    this.insert = function insert(index, value) {
      if (this.length < index) this.length = index;
      if (index < 0) index = this.length;
      if (arguments.length > 2)
        this.splice.apply(this, concatList([index, 0], slice.call(arguments, 1)));
      else this.splice(index, 0, value);
      return this;
    };

    this.inspect = function inspect() {
      return '[' + this.map(Object.inspect).join(', ') + ']';
    };

    this.intersect = function intersect(array) {
      for (var i = 0, results = [], length = array.length; i < length; i++)
        if (this.indexOf(array[i]) !== -1 && results.indexOf(array[i]) === -1)
          results.push(array[i]);
      return results;
    };

    this.last = function last(callback, thisArg) {
      var length = this.length;
      if (callback == null)
        return this[length && length - 1];
      if (typeof callback === 'function') {
        while (length--)
          if (callback.call(thisArg, this[length], length, this))
            return this[length];
        return;        
      }
      var count = +callback;
      if (isNaN(count)) return [];
      count = count < 1 ? 1 : count > length ? length : count;
      return slice.call(this, length - count);
    };

    this.size = function size() {
      return this.length;
    };

    this.toJSON = function toJSON() {
      for (var value, i = 0, results = [], length = this.length; i < length; i++) {
        value = Object.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    this.unique = function unique() {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (results.indexOf(this[i]) < 0) results.push(this[i]);
      return results.length && results || this;
    };

    this.without = function without() {
      var results = [], i = 0, length = this.length, args = slice.call(arguments, 0);
      for ( ; i < length; i++)
        if (args.indexOf(this[i]) === -1) results.push(this[i]);
      return results;
    };

    /* Create optimized Enumerable equivalents */

    this.contains = (function() {
      var contains = function contains(object, strict) {
        var i = 0, length = this.length
        if (strict) {
          while (i < length) if (this[i++] === object) return true;
        } else {
          while (i < length) if (this[i++] == object) return true;
        }
        return false;
      };

      if (typeof Array.prototype.indexOf === 'function') {
        var _contains = contains;
        contains = function contains(object, strict) {
          // attempt a fast strict search first
          var result = this.indexOf(object) > -1;
          if (strict || result) return result;
          return _contains.call(this, object);
        };
      }
      return contains;
    })();

    this.inject = (function() {
      var inject = function inject(accumulator, callback, thisArg) {
        var i = 0, length = this.length;
        if (thisArg) while (i < length)
          accumulator = callback.call(thisArg, accumulator, this[i], i++, this);
        else while (i < length)
          accumulator = callback(accumulator, this[i], i++, this);
        return accumulator;
      };

      // use Array#reduce if available
      if (typeof Array.prototype.reduce === 'function') {
        var _inject = inject;
        inject = function inject(accumulator, callback, thisArg) {
          if (thisArg)
            return _inject.call(this, accumulator, callback, thisArg);
          return this.reduce(callback, accumulator);
        };
      }
      return inject;
    })();

    this.invoke = function invoke(method) {
      var args, results = [], length = this.length;
      if (arguments.length < 2) {
        while (length--) results[length] = Function.prototype.call
          .call(this[length][method], this[length]);
      } else {
        args = slice.call(arguments, 1);
        while (length--) results[length] = Function.prototype.apply
          .call(this[length][method], this[length], args);
      }
      return results;
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) this.toArray();
      callback = callback || Fuse.K;
      var results = [];
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      for (var i = 0, length = this.length; i < length; i++)
        if (pattern.match(this[i]))
          results[results.length] = callback.call(thisArg, this[i], i, this);
      return results;
    };

    this.max = function max(callback, thisArg) {
      var result;
      if (!callback) {
        // John Resig's fast Array max|min:
        // http://ejohn.org/blog/fast-javascript-maxmin
        result = Math.max.apply(Math, this);
        if (!isNaN(result)) return result;
      }
      result = null; callback = Fuse.K;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = callback.call(thisArg, this[i], i, this);
        if (result == null || value >= result)
          result = value;
      }
      return result;
    };

    this.min = function min(callback, thisArg) {
      var result;
      if (!callback) {
        result = Math.min.apply(Math, this);
        if (!isNaN(result)) return result;
      }
      result = null; callback = Fuse.K;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = callback.call(thisArg, this[i], i, this);
        if (result == null || value < result)
          result = value;
      }
      return result;
    };

    this.partition = function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var trues = [], falses = [];
      for (var i = 0, length = this.length; i < length; i++)
        (callback.call(thisArg, this[i], i, this) ?
          trues : falses).push(this[i]);
      return [trues, falses];
    };

    this.pluck = function pluck(property) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = this[i][property];
      return results;
    };

    this.sortBy = function sortBy(callback, thisArg) {
      var results = [], i = 0, length = this.length;
      while (i < length)
        results[i] = { 'value': this[i], 'criteria': callback.call(thisArg, this[i], i++, this) };
      return results.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    this.zip = function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        callback = args.pop();

      var results = [], i = 0, length = this.length,
       collections = prependList(args.map($A), this);
      while (i < length) results[i] = callback(collections.pluck(i), i++, this);
      return results;
    };

    /* Use native browser JS 1.6 implementations if available */

    if (this.every && !this._every) {
      this._every = this.every;
      this.every  = function every(callback, thisArg) {
        return this._every(callback || Fuse.K, thisArg);
      };
    }

    if (this.filter && !this._filter) {
      this._filter = this.filter;
      this.filter  = function filter(callback, thisArg) {
        return this._filter(callback || function(value) { return value != null }, thisArg);
      };
    }

    if (this.map && !this._map) {
      this._map = this.map;
      this.map  = function map(callback, thisArg) {
        return this._map(callback || Fuse.K, thisArg);
      };
    }

    if (this.some && !this._some) {
      this._some = this.some;
      this.some  = function some(callback, thisArg) {
        return this._some(callback || Fuse.K, thisArg);
      };
    }

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    if (!this.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      this.concat = function concat() {
        var args = arguments, results = slice.call(this, 0);
        for (var i = 0, length = args.length; i < length; i++) {
          if (Object.isArray(args[i])) {
            for (var j = 0, subLen = args[i].length; j < subLen; j++)
              results.push(args[i][j]);
          }
          else results.push(args[i]);
        }
        return results;
      };

    if (!this.every)
      this.every = function every(callback, thisArg) {
        callback = callback || Fuse.K;
        for (var i = 0, length = this.length; i < length; i++)
          if (!callback.call(thisArg, this[i], i))
            return false;
        return true;
      };

    if (!this.filter)
      this.filter = function filter(callback, thisArg) {
        callback = callback || function(value) { return value != null };
        for (var i = 0, results = [], length = this.length; i < length; i++)
          if (callback.call(thisArg, this[i], i))
            results[results.length] = this[i];
        return results;
      };

    if (!this.forEach)
      this.forEach = function forEach(callback, thisArg) {
        // ECMA-3.1 15.4.4.18
        var i = 0, length = this.length;
        if (thisArg) while (i < length)
          callback.call(thisArg, this[i], i++, this);
        else while (i < length) callback(this[i], i++, this);
      };    

    if (!this.indexOf)
      this.indexOf = function indexOf(item, fromIndex) {
        fromIndex = fromIndex || 0;
        var length = this.length;
        if (fromIndex < 0) fromIndex = length + fromIndex;
        for ( ; fromIndex < length; fromIndex++)
          if (this[fromIndex] === item) return fromIndex;
        return -1;
      };

    if (!this.lastIndexOf)
      this.lastIndexOf = function lastIndexOf(item, fromIndex) {
        fromIndex = isNaN(fromIndex) ? this.length :
          (fromIndex < 0 ? this.length + fromIndex : fromIndex) + 1;
        var n = this.slice(0, fromIndex).reverse().indexOf(item);
        return (n < 0) ? n : fromIndex - n - 1;
      };

    if (!this.map)
      this.map = function map(callback, thisArg) {
        if (!callback) return slice.call(this, 0);
        var results = [], i = 0, length = this.length;
        if (thisArg) while (i < length)
          results[i] = callback.call(thisArg, this[i], i++, this);
        else while (i < length)
          results[i] = callback(this[i], i++, this);
        return results;
      };

    if (!this.some)
      this.some = function some(callback, thisArg) {
        callback = callback || Fuse.K;
        for (var i = 0, length = this.length; i < length; i++)
          if (callback.call(thisArg, this[i], i, this))
            return true;
        return false;
      };

    // alias
    this.toArray = this.clone;

    // assign any missing Enumerable methods
    Object._each(Enumerable, function(value, key) {
      if (typeof Array.prototype[key] !== 'function')
        Array.prototype[key] = value;
    });

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
     toJSON =      null,
     unique =      null,
     without =     null,
     zip =         null;
  }).call(Array.prototype);
