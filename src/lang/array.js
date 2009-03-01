  /*------------------------------ LANG: ARRAY -------------------------------*/

  $A = (function() {
    // Safari returns 'function' for HTMLCollection `typeof`
    if (Feature('TYPEOF_NODELIST_IS_FUNCTION')) {
      return function(iterable) {
        if (!iterable) return [];    
        // In Safari, only use the `toArray` method if it's not a NodeList.
        // A NodeList is a function, has an function `item` property, and a numeric
        // `length` property. Adapted from Google Doctype.
        if (!(typeof iterable === 'function' && typeof iterable.length ===
            'number' && typeof iterable.item === 'function') && iterable.toArray)
          return iterable.toArray();
        var length = iterable.length || 0, results = new Array(length);
        while (length--) results[length] = iterable[length];
        return results;
      };
    }

    return function(iterable) {
      if (!iterable) return [];
      if (iterable.toArray) return iterable.toArray();
      var length = iterable.length || 0, results = new Array(length);
      while (length--) results[length] = iterable[length];
      return results;
    };
  })();

  $w = function(string) {
    if (typeof string !== 'string') return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
  };

  Array.from = $A;

  (function(AP) {
    function _each(callback) {
      this.forEach(callback);
    }

    function clear() {
      this.length = 0;
      return this;
    }

    function clone() {
      return slice.call(this, 0);
    }

    function compact(falsy) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (!(this[i] == null || falsy && !this[i]))
          results.push(this[i]);
      return results;
    }

    function concat() {
      var args = arguments, results = slice.call(this, 0);
      for (var i = 0, length = args.length; i < length; i++) {
        if (Object.isArray(args[i])) {
          for (var j = 0, subLen = args[i].length; j < subLen; j++)
            results.push(args[i][j]);
        }
        else results.push(args[i]);
      }
      return results;
    }

    function each(callback, thisArg) {
      try {
        this.forEach(callback, thisArg);
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    }

    function every(callback, thisArg) {
      callback = callback || Fuse.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!callback.call(thisArg, this[i], i))
          return false;
      return true;
    }

    function filter(callback, thisArg) {
      callback = callback || function(value) { return value != null };
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (callback.call(thisArg, this[i], i))
          results[results.length] = this[i];
      return results;
    }

    function first(callback, thisArg) {
      var length = this.length;
      if (arguments.length === 0) return this[0];
      if (typeof callback === 'function') {
        for (var i = 0; i < length; i++)
          if (callback.call(thisArg, this[i], i))
            return this[i];
        return;
      }
      // Fast numeric type conversion:
      // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
      var count = +callback;
      if (!isNaN(count)) {
        count = count < 1 ? 1 : count > length ? length : count;
        return slice.call(this, 0, count);
      } else return [];
    }

    function flatten() {
      for (var i = 0, results = [], length = this.length; i < length; i++) {
        if (Object.isArray(this[i])) 
          results = concatList(results, this[i].flatten());
        else results.push(this[i]);
      }
      return results;
    }

    function forEach(callback, thisArg) {
      // ECMA-3.1 15.4.4.18
      var i = 0, length = this.length;
      if (thisArg) while (i < length)
        callback.call(thisArg, this[i], i++, this);
      else while (i < length) callback(this[i], i++, this);
    }

    function indexOf(item, fromIndex) {
      fromIndex = fromIndex || 0;
      var length = this.length;
      if (fromIndex < 0) fromIndex = length + fromIndex;
      for ( ; fromIndex < length; fromIndex++)
        if (this[fromIndex] === item) return fromIndex;
      return -1;
    }

    function insert(index, value) {
      if (this.length < index) this.length = index;
      if (index < 0) index = this.length;
      if (arguments.length > 2)
        this.splice.apply(this, concatList([index, 0], slice.call(arguments, 1)));
      else this.splice(index, 0, value);
      return this;
    }

    function inspect() {
      return '[' + this.map(Object.inspect).join(', ') + ']';
    }

    function intersect(array) {
      for (var i = 0, results = [], length = array.length; i < length; i++)
        if (this.indexOf(array[i]) !== -1 && results.indexOf(array[i]) === -1)
          results.push(array[i]);
      return results;
    }

    function last(callback, thisArg) {
      var length = this.length;
      if (arguments.length === 0)
        return this[length && length - 1];
      if (typeof callback === 'function') {
        while (length--)
          if (callback.call(thisArg, this[length], length, this))
            return this[length];
        return;        
      }
      var count = +arguments[0];
      if (!isNaN(count)) {
        count = count < 1 ? 1 : count > length ? length : count;
        return slice.call(this, length - count);
      } else return [];     
    }

    function lastIndexOf(item, fromIndex) {
      fromIndex = isNaN(fromIndex) ? this.length :
        (fromIndex < 0 ? this.length + fromIndex : fromIndex) + 1;
      var n = this.slice(0, fromIndex).reverse().indexOf(item);
      return (n < 0) ? n : fromIndex - n - 1;
    }

    function map(callback, thisArg) {
      if (!callback) return slice.call(this, 0);
      var results = [], i = 0, length = this.length;
      if (thisArg) while (i < length)
        results[i] = callback.call(thisArg, this[i], i++, this);
      else while (i < length)
        results[i] = callback(this[i], i++, this);
      return results;
    }

    function size() {
      return this.length;
    }

    function some(callback, thisArg) {
      callback = callback || Fuse.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (callback.call(thisArg, this[i], i, this))
          return true;
      return false;
    }

    function toJSON() {
      for (var value, i = 0, results = [], length = this.length; i < length; i++) {
        value = Object.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    }

    function unique() {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (results.indexOf(this[i]) < 0) results.push(this[i]);
      return results.length && results || this;
    }

    function without() {
      var results = [], i = 0, length = this.length, args = slice.call(arguments, 0);
      for ( ; i < length; i++)
        if (args.indexOf(this[i]) === -1) results.push(this[i]);
      return results;
    }

    /* Create optimized Enumerable equivalents */

    function contains(object, strict) {
      // attempt a fast strict search first
      var result = this.indexOf(object) > -1;
      if (strict || result) return result;
      for (var i = 0, length = this.length; i < length; i++)
        if (this[i] == object) return true;
      return false;
    }

    function inject(accumulator, callback, thisArg) {
      var i = 0, length = this.length;
      if (thisArg) while (i < length)
        accumulator = callback.call(thisArg, accumulator, this[i], i++, this);
      else while (i < length)
        accumulator = callback(accumulator, this[i], i++, this);
      return accumulator;
    }

    function injectUsingReduce(accumulator, callback, thisArg) {
      if (thisArg)
        return inject.call(this, accumulator, callback, thisArg);
      return this.reduce(callback, accumulator);
    }

    function invoke(method) {
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
    }

    function grep(pattern, callback, thisArg) {
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
    }

    function max(callback, thisArg) {
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
    }

    function min(callback, thisArg) {
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
    }

    function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var trues = [], falses = [];
      for (var i = 0, length = this.length; i < length; i++)
        (callback.call(thisArg, this[i], i, this) ?
          trues : falses).push(this[i]);
      return [trues, falses];
    }

    function pluck(property) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = this[i][property];
      return results;
    }

    function reject(callback, thisArg) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (!callback.call(thisArg, this[i], i, this))
          results[results.length] = this[i];
      return results;
    }

    function sortBy(callback, thisArg) {
      var results = [], i = 0, length = this.length;
      while (i < length)
        results[i] = { 'value': this[i], 'criteria': callback.call(thisArg, this[i], i++, this) };
      return results.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    }

    function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        callback = args.pop();

      var results = [], i = 0, length = this.length,
       collections = prependList(args.map($A), this);
      while (i < length) results[i] = callback(collections.pluck(i), i++, this);
      return results;
    }

    /* Use native browser JS 1.6 implementations if available */

    (function() {
      for (var i = 0, method; method = arguments[i++]; ) {
        if (!(AP[method] && !AP['_' + method])) continue;
        (function(m) {
          // backup original
          AP['_' + m] = AP[m];
          // overwrite allowing callback || Fuse.K
          AP[m] = function(callback, thisArg) {
            return this['_' + m](callback || Fuse.K, thisArg);
          };
        })(method);
      }
    })('every', 'map', 'some');

    if (AP.filter && !AP._filter) {
      AP._filter = AP.filter;
      AP.filter = function(callback, thisArg) {
        return this._filter(callback || function(value) { return value != null }, thisArg);
      };
    }

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    if (!AP.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      AP.concat = concat;

    // optimize Array#inject if Array#reduce is available
    AP.inject = AP.reduce ? injectUsingReduce : inject;

    if (!AP.every)       AP.every       = every;
    if (!AP.filter)      AP.filter      = filter;
    if (!AP.forEach)     AP.forEach     = forEach;
    if (!AP.indexOf)     AP.indexOf     = indexOf;
    if (!AP.lastIndexOf) AP.lastIndexOf = lastIndexOf;
    if (!AP.map)         AP.map         = map;
    if (!AP.some)        AP.some        = some;

    /*--------------------------------------------------------------------------*/

    Object.extend(AP, {
      '_each':     _each,
      'clear':     clear,
      'clone':     clone,
      'compact':   compact,
      'contains':  contains,
      'each':      each,
      'first':     first,
      'flatten':   flatten,
      'grep':      grep,
      'insert':    insert,
      'inspect':   inspect,
      'intersect': intersect,
      'invoke':    invoke,
      'last':      last,
      'max':       max,
      'min':       min,
      'partition': partition,
      'pluck':     pluck,
      'size':      size,
      'sortBy':    sortBy,
      'toArray':   clone,
      'toJSON':    toJSON,
      'unique':    unique,
      'without':   without,
      'zip':       zip
    });

    // Assign any missing Enumerable methods
    Object._each(Enumerable, function(value, key) {
      if (typeof AP[key] !== 'function')
        AP[key] = value;
    });
  })(Array.prototype);
