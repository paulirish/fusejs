  $A = function(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  };

  // Safari returns 'function' for HTMLCollection `typeof`
  if (typeof docEl.childNodes === 'function') {
    $A = function(iterable) {
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

  Array.from = $A;

  if (!Array.prototype._reverse)
    Array.prototype._reverse = Array.prototype.reverse;

  Object.extend(Array.prototype, {
    clear: function() {
      this.length = 0;
      return this;
    },

    first: function() {
      return this[0];
    },

    last: function() {
      return this[this.length - 1];
    },

    compact: function() {
      return this.select(function(value) {
        return value != null;
      });
    },

    flatten: function() {
      return this.inject([], function(array, value) {
        if (Object.isArray(value))
          return mergeList(array, value.flatten());
        return array.push(value) && array;
      });
    },

    without: function() {
      var values = slice.call(arguments, 0);
      return this.select(function(value) {
        return !values.include(value);
      });
    },

    reverse: function(inline) {
      return (inline !== false ? this : this.toArray())._reverse();
    },

    uniq: function(sorted) {
      return this.inject([], function(array, value, index) {
        if (0 == index || (sorted ? array.last() != value : !array.include(value)))
          array.push(value);
        return array;
      });
    },

    intersect: function(other) {
      var arr = this, result = [];
      other._each(function(item) {
        if (arr.indexOf(item) !== -1 && result.indexOf(item) === -1)
          result.push(item);
      });
      return result;
    },

    clone: function() {
      return slice.call(this, 0);
    },

    size: function() {
      return this.length;
    },

    inspect: function() {
      return '[' + this.map(Object.inspect).join(', ') + ']';
    },

    toJSON: function() {
      var results = [];
      this._each(function(object) {
        var value = Object.toJSON(object);
        if (typeof value !== 'undefined') results.push(value);
      });
      return '[' + results.join(', ') + ']';
    },

    /* create optimized Enumerable equivalents */
    detect: function(iterator, context) {
      for (var i = 0, length = this.length; i < length; i++)
        if (iterator.call(context, this[i], i))
          return this[i];
    },

    grep: function(filter, iterator, context) {
      iterator = iterator || P.K;
      var results = [];

      if (typeof filter === 'string')
        filter = new RegExp(RegExp.escape(filter));

      for (var i = 0, length = this.length; i < length; i++)
        if (filter.match(this[i]))
          results[results.length] = iterator.call(context, this[i], i);
      return results;
    },

    include: function(object) {
      if (typeof this.indexOf === 'function')
        if (this.indexOf(object) != -1) return true;

      for (var i = 0, length = this.length; i < length; i++)
        if (this[i] == object) return true;
      return false;
    },

    inject: function(memo, iterator, context) {
      for (var i = 0, length = this.length; i < length; i++)
        memo = iterator.call(context, memo, this[i], i);
      return memo;
    },

    max: function(iterator, context) {
      iterator = iterator || P.K;
      var result;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = iterator.call(context, this[i], i);
        if (result == null || value >= result)
          result = value;
      }
      return result;
    },

    min: function(iterator, context) {
      iterator = iterator || P.K;
      var result;
      for (var i = 0, length = this.length, value; i < length; i++) {
        value = iterator.call(context, this[i], i);
        if (result == null || value < result)
          result = value;
      }
      return result;
    },

    partition: function(iterator, context) {
      iterator = iterator || P.K;
      var trues = [], falses = [];
      for (var i = 0, length = this.length; i < length; i++)
        (iterator.call(context, this[i], i) ?
          trues : falses).push(this[i]);
      return [trues, falses];
    },

    pluck: function(property) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = this[i][property];
      return results;
    },

    reject: function(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    },

    sortBy: function(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length;
        results[i] = { value: this[i], criteria: iterator.call(context, this[i], i++) });
      return results.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    },

    zip: function() {
      var iterator = P.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var results = [], collections = prependList(args.map($A), this);
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = iterator(collections.pluck(i));
      return results;
    }
  });

  (function(AP) {
    // use native browser JS 1.6 implementations if available
    if (!AP.forEach) {
      AP._each = function(iterator) {
        for (var i = 0, length = this.length; i < length; i++)
          iterator(this[i]);
      };
    } else AP._each = AP.forEach; 

    if (!AP.every) AP.every = function(iterator, context) {
      iterator = iterator || P.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!iterator.call(context, this[i], i))
          return false;
      return true;
    };

    if (!AP.filter) AP.filter = function(iterator, context) {
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        if (iterator.call(context, this[i], i))
          results[results.length] = this[i];
      return results;
    };

    if (!AP.indexOf) AP.indexOf = function(item, i) {
      i || (i = 0);
      var length = this.length;
      if (i < 0) i = length + i;
      for (; i < length; i++)
        if (this[i] === item) return i;
      return -1;
    };

    if (!AP.lastIndexOf) AP.lastIndexOf = function(item, i) {
      i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
      var n = this.slice(0, i).reverse().indexOf(item);
      return (n < 0) ? n : i - n - 1;
    };

    if (!AP.map) AP.map = function(iterator, context) {
      iterator = iterator || P.K;
      var results = [];
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = iterator.call(context, this[i], i);
      return results;
    };

    if (!AP.some) AP.some = function(iterator, context) {
      iterator = iterator || P.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!!iterator.call(context, this[i], i))
          return true;
      return false;
    };

    // assign aliases
    Object.extend(AP, {
      all:     AP.every,
      any:     AP.some,
      collect: AP.map,
      entries: AP.clone,
      find:    AP.detect,
      findAll: AP.filter,
      member:  AP.include,
      select:  AP.filter,
      toArray: AP.clone
    });
    
    // assign any missing Enumerable methods
    for (var i in Enumerable) {
      if (typeof AP[i] !== 'function')
        AP[i] = Enumerable[i];
    }
  })(Array.prototype);

  $w = function(string) {
    if (typeof string !== 'string') return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
  };

  // Opera's implementation of Array.prototype.concat treats a functions arguments
  // object as an array. We overwrite concat to fix this.
  (function() {
    if ([].concat(arguments) === 1) return;
    Array.prototype.concat = function() {
      var array = Array.prototype.slice.call(this, 0);
      for (var i = 0, length = arguments.length; i < length; i++) {
        if (Object.isArray(arguments[i])) {
          for (var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++) 
            array.push(arguments[i][j]);
        } else { 
          array.push(arguments[i]);
        }
      }
      return array;
    };
  })(1, 2);
