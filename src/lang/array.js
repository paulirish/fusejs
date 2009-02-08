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

    function compact(falsy) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (!(this[i] == null || falsy && !this[i]))
          results.push(this[i]);
      return results;
    }

    function concat() {
      var item, subItem, j, i = 0, results = slice.call(this, 0);
      while (item = arguments[i++]) {
        if (Object.isArray(item)) {
          j = 0;
          while (subItem = item[j++])
            results.push(subItem);
        }
        else results.push(item);
      }
      return results;
    }

    function every(iterator, context) {
      iterator = iterator || K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          return false;
      return true;
    }

    function filter(iterator, context) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    }

    function first(iterator, context) {
      var length = this.length;
      if (arguments.length === 0) return this[0];
      if (typeof iterator === 'function') {
        for (var i = 0; i < length; i++)
          if (iterator.call(context, this[i], i))
            return this[i];
        return;
      }
      // Fast numeric type conversion:
      // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
      var count = +iterator;
      if (!isNaN(count)) {
        count = count < 1 ? 1 : count > length ? length : count;
        return slice.call(this, 0, count);
      } else return [];
    }

    function flatten() {
      for (var i = 0, results = [], length = this.length; i < length; i++) {
        if (Object.isArray(this[i])) 
          results = mergeList(results, this[i].flatten());
        else results.push(this[i]);
      }
      return results;
    }

    function indexOf(item, fromIndex) {
      fromIndex || (fromIndex = 0);
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
        this.splice.apply(this, mergeList([index, 0], slice.call(arguments, 1)));
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

    function last(iterator, context) {
      var length = this.length;
      if (arguments.length === 0)
        return this[length && length - 1];
      if (typeof iterator === 'function') {
        while (length--)
          if (iterator.call(context, this[length], length))
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

    function map(iterator, context) {
      if (!iterator) return slice.call(this, 0);
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = iterator.call(context, this[i], i);
      return results;
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

    function inject(accumulator, iterator, context) {
      for (var i = 0, length = this.length; i < length; i++)
        accumulator = iterator.call(context, accumulator, this[i], i);
      return accumulator;
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
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) this.toArray();
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
      var result;
      if (!iterator) {
        // John Resig's fast Array max|min:
        // http://ejohn.org/blog/fast-javascript-maxmin
        result = Math.max.apply(Math, this);
        if (!isNaN(result)) return result;
      }
      result = null; iterator = K;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = iterator.call(context, this[i], i);
        if (result == null || value >= result)
          result = value;
      }
      return result;
    }

    function min(iterator, context) {
      var result;
      if (!iterator) {
        result = Math.min.apply(Math, this);
        if (!isNaN(result)) return result;
      }
      result = null; iterator = K;
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
      for (var i = 0, results = [], length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    }

    function sortBy(iterator, context) {
      for (var i = 0, results = [], length = this.length; i < length; i++)
        results[i] = { 'value': this[i], 'criteria': iterator.call(context, this[i], i) };
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

    (function() {
      for (var i = 0, method; method = arguments[i++]; ) {
        if (!(AP[method] && !AP['_' + method])) continue;
        (function(m) {
          // backup original
          AP['_' + m] = AP[m];
          // overwrite allowing iterator || k
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
      'clear':     clear,
      'clone':     clone,
      'compact':   compact,
      'contains':  contains,
      'first':     first,
      'flatten':   flatten,
      'grep':      grep,
      'inject':    inject,
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
    for (var i in Enumerable) {
      if (typeof AP[i] !== 'function')
        AP[i] = Enumerable[i];
    }
  })(Array.prototype);
