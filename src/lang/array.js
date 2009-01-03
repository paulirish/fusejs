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
    function _each(iterator) {
      for (var i = 0, length = this.length; i < length; i++)
        iterator(this[i]);
    }

    function clear() {
      this.length = 0;
      return this;
    }

    function clone() {
      return slice.call(this, 0);
    }

    function compact() {
      return this.select(function(value) {
        return value != null;
      });
    }

    function concat() {
      var array = Array.prototype.slice.call(this, 0);
      for (var i = 0, length = arguments.length; i < length; i++) {
        if (Object.isArray(arguments[i])) {
          for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++) 
            array.push(arguments[i][j]);
        } else { 
          array.push(arguments[i]);
        }
      }
    }

    function every(iterator, context) {
      iterator = iterator || K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          return false;
      return true;
    }

    function filter(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        if (iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    }

    function first() {
      return this[0];
    }

    function flatten() {
      return this.inject([], function(array, value) {
        if (Object.isArray(value))
          return mergeList(array, value.flatten());
        return array.push(value) && array;
      });
    }

    function indexOf(item, i) {
      i || (i = 0);
      var length = this.length;
      if (i < 0) i = length + i;
      for (; i < length; i++)
        if (this[i] === item) return i;
      return -1;
    }

    function inspect() {
      return '[' + this.map(Object.inspect).join(', ') + ']';
    }

    function intersect(other) {
      var arr = this, result = [];
      other._each(function(item) {
        if (arr.indexOf(item) !== -1 && result.indexOf(item) === -1)
          result.push(item);
      });
      return result;
    }

    function last() {
      return this[this.length - 1];
    }

    function lastIndexOf(item, i) {
      i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
      var n = this.slice(0, i).reverse().indexOf(item);
      return (n < 0) ? n : i - n - 1;
    }

    function map(iterator, context) {
      iterator = iterator || K;
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = iterator.call(context, this[i], i);
      return results;
    }

    function reverse(inline) {
      return (inline !== false ? this : this.toArray())._reverse();
    }

    function size() {
      return this.length;
    }

    function some(iterator, context) {
      iterator = iterator || K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!!iterator.call(context, this[i], i))
          return true;
      return false;
    }

    function toJSON() {
      var results = [];
      this._each(function(object) {
        var value = Object.toJSON(object);
        if (typeof value !== 'undefined') results.push(value);
      });
      return '[' + results.join(', ') + ']';
    }

    function uniq(sorted) {
      return this.inject([], function(array, value, index) {
        if (0 == index || (sorted ? array.last() != value : !array.include(value)))
          array.push(value);
        return array;
      });
    }

    function without() {
      var values = slice.call(arguments, 0);
      return this.select(function(value) {
        return !values.include(value);
      });
    }

    /* Create optimized Enumerable equivalents */

    function detect(iterator, context) {
      for (var i = 0, length = this.length; i < length; i++)
        if (iterator.call(context, this[i], i))
          return this[i];
    }

    function include(object) {
      if (typeof this.indexOf === 'function')
        if (this.indexOf(object) != -1) return true;

      for (var i = 0, length = this.length; i < length; i++)
        if (this[i] == object) return true;
      return false;
    }

    function inject(memo, iterator, context) {
      for (var i = 0, length = this.length; i < length; i++)
        memo = iterator.call(context, memo, this[i], i);
      return memo;
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

    function grep(pattern, iterator, context) {
      if (!pattern) this.toArray();
      iterator = iterator || K;
      var results = [];

      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      for (var i = 0, length = this.length; i < length; i++)
        if (pattern.match(this[i]))
          results[results.length] = iterator.call(context, this[i], i);
      return results;
    }

    function max(iterator, context) {
      iterator = iterator || K;
      var result;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = iterator.call(context, this[i], i);
        if (result == null || value >= result)
          result = value;
      }
      return result;
    }

    function min(iterator, context) {
      iterator = iterator || K;
      var result;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = iterator.call(context, this[i], i);
        if (result == null || value < result)
          result = value;
      }
      return result;
    }

    function partition(iterator, context) {
      iterator = iterator || K;
      var trues = [], falses = [];
      for (var i = 0, length = this.length; i < length; i++)
        (iterator.call(context, this[i], i) ?
          trues : falses).push(this[i]);
      return [trues, falses];
    }

    function pluck(property) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = this[i][property];
      return results;
    }

    function reject(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    }

    function sortBy(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length;
        results[i] = { value: this[i], criteria: iterator.call(context, this[i], i++) });
      return results.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    }

    function zip() {
      var iterator = K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var results = [], collections = prependList(args.map($A), this);
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = iterator(collections.pluck(i));
      return results;
    }

    /* Use native browser JS 1.6 implementations if available */

    if (!AP._reverse)
      AP._reverse = AP.reverse;

    (function() {
      for (var i = 0, method; method = arguments[i++]; ) {
        if (!(AP[method] && !AP['_' + method])) continue;
        (function(m) {
          AP['_' + m] = AP[m];
          AP[m] = function(iterator, context) {
            return this['_' + m](iterator || K, context);
          };
        })(method);
      }
    })('every', 'map', 'some');

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    if (!AP.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      AP.concat = concat;

    if (!AP.every)       AP.every       = every;
    if (!AP.filter)      AP.filter      = filter;
    if (!AP.forEach)     AP.forEach     = _each;
    if (!AP.indexOf)     AP.indexOf     = indexOf;
    if (!AP.lastIndexOf) AP.lastIndexOf = lastIndexOf;
    if (!AP.map)         AP.map         = map;
    if (!AP.some)        AP.some        = some;

    /*--------------------------------------------------------------------------*/

    Object.extend(AP, {
      '_each':     AP.forEach,
      'all':       AP.every,
      'any':       AP.some,
      'clear':     clear,
      'clone':     clone,
      'collect':   AP.map,
      'compact':   compact,
      'detect':    detect,
      'entries':   clone,
      'find':      detect,
      'findAll':   AP.filter,
      'first':     first,
      'flatten':   flatten,
      'grep':      grep,
      'include':   include,
      'inject':    inject,
      'intersect': intersect,
      'inspect':   inspect,
      'invoke':    invoke,
      'last':      last,
      'max':       max,
      'member':    include,
      'min':       min,
      'partition': partition,
      'pluck':     pluck,
      'reject':    reject,
      'reverse':   reverse,
      'select':    AP.filter,
      'size':      size,
      'sortBy':    sortBy,
      'toArray':   clone,
      'toJSON':    toJSON,
      'uniq':      uniq,
      'without':   without,
      'zip':       zip
    });

    // Assign any missing Enumerable methods
    for (var i in Enumerable) {
      if (typeof AP[i] !== 'function')
        AP[i] = Enumerable[i];
    }
  })(Array.prototype);
