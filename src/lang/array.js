  /*------------------------------ LANG: ARRAY -------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$A = (function() {
    function $A(iterable) {
      if (!iterable) return Fuse.List();
      // Safari 2.x will crash when accessing a non-existent property of a
      // node list that contains a text node unless we use the `in` operator
      if ('toArray' in iterable) iterable = iterable.toArray();
      var length = iterable.length || 0, results = new Fuse.List(length);
      while (length--) results[length] = iterable[length];
      return results;
    }
    return $A;
  })();

  Fuse.Util.$w = (function() {
   function $w(string) {
      if (typeof string !== 'string') return Fuse.List();
      string = Fuse.String(string).trim();
      return string ? string.split(/\s+/) : Fuse.List();
    }
    return $w;
  })();

  Fuse.List.from = Fuse.Util.$A;

  /*--------------------------------------------------------------------------*/

  (function() {
    this._each = function _each(callback) {
      this.forEach(callback);
    };

    this.clear = function clear() {
      this.length = 0;
      return this;
    };

    this.clone = function clone() {
      return this.slice(0);
    };

    this.compact = function compact(falsy) {
      for (var i = 0, results = Fuse.List(), length = this.length; i < length; i++)
        if (!(this[i] == null || falsy && !this[i]))
          results.push(this[i]);
      return results;
    };

    this.each = function each(callback, thisArg) {
      try {
        this.forEach(callback, thisArg);
      } catch (e) {
        if (e !== Fuse.$break) throw e;
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
      }
      else {
        // Fast numeric type conversion:
        // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
        var count = +callback;
        if (isNaN(count)) return Fuse.List();
        count = count < 1 ? 1 : count > length ? length : count;
        return this.slice(0, count);
      }
    };

    this.flatten = function flatten() {
      for (var i = 0, results = Fuse.List(), length = this.length; i < length; i++) {
        if (Fuse.Object.isArray(this[i])) 
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
      return '[' + this.map(Fuse.Object.inspect).join(', ') + ']';
    };

    this.intersect = function intersect(array) {
      for (var i = 0, results = Fuse.List(), length = array.length; i < length; i++)
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
      }
      else {
        var count = +callback;
        if (isNaN(count)) return Fuse.List();
        count = count < 1 ? 1 : count > length ? length : count;
        return this.slice(length - count);
      }
    };

    this.size = function size() {
      return this.length;
    };

    this.toJSON = function toJSON() {
      for (var value, i = 0, results = Fuse.List(), length = this.length; i < length; i++) {
        value = Fuse.Object.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    this.unique = function unique() {
      for (var i = 0, results = Fuse.List(), length = this.length; i < length; i++)
        if (results.indexOf(this[i]) < 0) results.push(this[i]);
      return results.length && results || this;
    };

    this.without = function without() {
      var results = Fuse.List(), i = 0, length = this.length, args = slice.call(arguments, 0);
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
      if (typeof Fuse.List.Plugin.reduce === 'function') {
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
      var args, results = Fuse.List(), length = this.length;
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
      if (!pattern || Fuse.Object.isRegExp(pattern) &&
         !pattern.source) return this.toList();
      callback = callback || Fuse.K;
      var results = Fuse.List();
      if (Fuse.Object.isString(pattern))
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
      var trues = Fuse.List(), falses = Fuse.List();
      for (var i = 0, length = this.length; i < length; i++)
        (callback.call(thisArg, this[i], i, this) ?
          trues : falses).push(this[i]);
      return [trues, falses];
    };

    this.pluck = function pluck(property) {
      var results = Fuse.List();
      for (var i = 0, length = this.length; i < length; i++)
        results[i] = this[i][property];
      return results;
    };

    this.sortBy = function sortBy(callback, thisArg) {
      var results = Fuse.List(), i = 0, length = this.length;
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

      var results = Fuse.List(), i = 0, length = this.length,
       collections = prependList(this.map.call(args, Fuse.Util.$A), this);
      while (i < length) results[i] = callback(collections.pluck(i), i++, this);
      return results;
    };

    /* Use native browser JS 1.6 implementations if available */

    // wrap some native methods to make the callback argument optional
    (function() {
      var m, i = 0, methods = 'every filter map some'.split(' ');
      while (m = methods[i++]) {
        if (this[m] && !this['_' + m])
          this[m] = new Function('', [
            'this._' + m +' = this.' + m + ';',
            'function ' + m + '(callback, thisArg) {',
            'return this._' + m + '(callback || Fuse.K, thisArg);',
            '} return ' + m].join('\n')).call(this);
      }
    }).call(this);

    // Opera's implementation of Array.prototype.concat treats a functions arguments
    // object as an array so we overwrite concat to fix it.
    // ECMA-5 15.4.4.4
    if (!this.concat || Bug('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
      this.concat = function concat() {
        var args = arguments, results = this.clone(this);
        for (var i = 0, length = args.length; i < length; i++) {
          if (Fuse.Object.isArray(args[i])) {
            for (var j = 0, subLen = args[i].length; j < subLen; j++)
              results.push(args[i][j]);
          }
          else results.push(args[i]);
        }
        return results;
      };

    // ECMA-5 15.4.4.16
    this.every = this.every || function every(callback, thisArg) {
      callback = callback || Fuse.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (!callback.call(thisArg, this[i], i))
          return false;
      return true;
    };

    // ECMA-5 15.4.4.20
    this.filter = this.filter || function filter(callback, thisArg) {
      callback = callback || function(value) { return value != null };
      for (var i = 0, results = Fuse.List(), length = this.length; i < length; i++)
        if (callback.call(thisArg, this[i], i))
          results[results.length] = this[i];
      return results;
    };

    // ECMA-5 15.4.4.18
    this.forEach = this.forEach || function forEach(callback, thisArg) {
      var i = 0, length = this.length;
      if (thisArg) while (i < length)
        callback.call(thisArg, this[i], i++, this);
      else while (i < length) callback(this[i], i++, this);
    };

    // ECMA-5 15.4.4.14
    this.indexOf = this.indexOf || function indexOf(item, fromIndex) {
      fromIndex = fromIndex || 0;
      var length = this.length;
      if (fromIndex < 0) fromIndex = length + fromIndex;
      for ( ; fromIndex < length; fromIndex++)
        if (this[fromIndex] === item) return fromIndex;
      return -1;
    };

    // ECMA-5 15.4.4.15
    this.lastIndexOf = this.lastIndexOf || function lastIndexOf(item, fromIndex) {
      fromIndex = isNaN(fromIndex) ? this.length :
        (fromIndex < 0 ? this.length + fromIndex : fromIndex) + 1;
      var n = this.slice(0, fromIndex).reverse().indexOf(item);
      return (n < 0) ? n : fromIndex - n - 1;
    };

    // ECMA-5 15.4.4.19
    this.map = this.map || function map(callback, thisArg) {
      if (!callback) return this.clone();
      var results = Fuse.List(), i = 0, length = this.length;
      if (thisArg) while (i < length)
        results[i] = callback.call(thisArg, this[i], i++, this);
      else while (i < length)
        results[i] = callback(this[i], i++, this);
      return results;
    };

    // ECMA-5 15.4.4.17
    this.some = this.some || function some(callback, thisArg) {
      callback = callback || Fuse.K;
      for (var i = 0, length = this.length; i < length; i++)
        if (callback.call(thisArg, this[i], i, this))
          return true;
      return false;
    };

    // aliases
    this.toArray = 
    this.toList  = this.clone;

    // assign any missing Enumerable methods
    Fuse.Object.each(Fuse.Enumerable, function(value, key) {
      if (typeof Fuse.List.Plugin[key] !== 'function')
        Fuse.List.Plugin[key] = value;
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
  }).call(Fuse.List.Plugin);
