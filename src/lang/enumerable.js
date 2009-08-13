  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  Fuse.$break = (function() {
    function $break() { }
    return $break;
  })();

  Fuse.addNS('Enumerable');

  (function(proto) {
    proto.contains = function contains(object, strict) {
      var result = 0, $break = Fuse.$break;
      if (strict)
        this.each(function(value) { if (value === object && result++) throw $break; });
      else
        this.each(function(value) { if (value == object && result++) throw $break; });
      return !!result;
    };

    proto.each = function each(callback, thisArg) {
      try {
        this._each(function(value, index, iterable) {
          callback.call(thisArg, value, index, iterable);
        });
      } catch (e) {
        if (e !== Fuse.$break) throw e;
      }
      return this;
    };

    proto.eachSlice = function eachSlice(size, callback, thisArg) {
      var index = -size, slices = Fuse.List(), list = this.toList();
      if (size < 1) return list;
      while ((index += size) < list.length)
        slices[slices.length] = list.slice(index, index + size);
      return slices.map(callback, thisArg);
    };

    proto.every = function every(callback, thisArg) {
      callback = callback || K;
      var result = true;
      this.each(function(value, index, iterable) {
        if (!callback.call(thisArg, value, index, iterable)) {
          result = false; throw Fuse.$break;
        }
      });
      return result;
    };

    proto.filter = function filter(callback, thisArg) {
      var results = Fuse.List();
      callback = callback || function(value) { return value != null };
      this._each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable))
          results.push(value);
      });
      return results;
    };

    proto.first = function first(callback, thisArg) {
      if (callback == null) {
        var result;
        this.each(function(value) { result = value; throw Fuse.$break; });
        return result;
      }
      return this.toList().first(callback, thisArg);
    };

    proto.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || pattern == '' || isRegExp(pattern) &&
         !pattern.source) return this.toList();

      callback = callback || K;
      var results = Fuse.List();
      if (isString(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      this._each(function(value, index, iterable) {
        if (pattern.test(value))
          results.push(callback.call(thisArg, value, index, iterable));
      });
      return results;
    };

    proto.inGroupsOf = function inGroupsOf(size, filler) {
      filler = typeof filler === 'undefined' ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    };

    proto.inject = function inject(accumulator, callback, thisArg) {
      this._each(function(value, index, iterable) {
        accumulator = callback.call(thisArg, accumulator, value, index, iterable);
      });
      return accumulator;
    };

    proto.inspect = (function() {
      function inspect() { return '#<Enumerable:' + this.toList().inspect() + '>' }
      return inspect;
    })();

    proto.invoke = function invoke(method) {
      var args = slice.call(arguments, 1), funcProto = Function.prototype;
      return this.map(function(value) {
        return funcProto.apply.call(value[method], value, args);
      });
    };

    proto.last = function last(callback, thisArg) {
      return this.toList().last(callback, thisArg);
    };

    proto.map = function map(callback, thisArg) {
      if (!callback) return this.toList();
      var results = Fuse.List();
      if (thisArg) {
        this._each(function(value, index, iterable) {
          results.push(callback.call(thisArg, value, index, iterable));
        });
      } else {
        this._each(function(value, index, iterable) {
          results.push(callback(value, index, iterable));
        });
      }
      return results;
    };

    proto.max = function max(callback, thisArg) {
      callback = callback || K;
      var comparable, max, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (max == null || comparable > max) {
          max = comparable; result = value;
        }
      });
      return result;
    };

    proto.min = function min(callback, thisArg) {
      callback = callback || K;
      var comparable, min, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (min == null || comparable < min) {
          min = comparable; result = value;
        }
      });
      return result;
    };

    proto.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var trues = Fuse.List(), falses = Fuse.List();
      this._each(function(value, index, iterable) {
        (callback.call(thisArg, value, index, iterable) ?
          trues : falses).push(value);
      });
      return Fuse.List(trues, falses);
    };

    proto.pluck = function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    };

    proto.size = function size() {
      return Fuse.Number(this.toList().length);
    };

    proto.some = function some(callback, thisArg) {
      callback = callback || K;
      var result = false;
      this.each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable)) {
          result = true; throw Fuse.$break;
        }
      });
      return result;
    };

    proto.sortBy = function sortBy(callback, thisArg) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': callback.call(thisArg, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    proto.toArray = function toArray() {
      var results = Fuse.List();
      this._each(function(value, index) { results[index] = value });
      return results;
    };

    proto.zip = function zip() {
      var callback = K, args = slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length-1] === 'function')
        callback = args.pop();

      var collection = prependList(Fuse.List.prototype.map.call(args, Fuse.Util.$A),
        this.toArray(), Fuse.List());

      return this.map(function(value, index, iterable) {
        return callback(collection.pluck(index), index, iterable);
      });
    };

    // alias
    proto.toList = proto.toArray;

    // prevent JScript bug with named function expressions
    var contains = null,
     each =        null,
     eachSlice =   null,
     every =       null,
     filter =      null,
     first =       null,
     grep =        null,
     inject =      null,
     inGroupsOf =  null,
     invoke =      null,
     last =        null,
     map =         null,
     max =         null,
     min =         null,
     partition =   null,
     pluck =       null,
     size =        null,
     some =        null,
     sortBy =      null,
     toArray =     null,
     zip =         null;
  })(Fuse.Enumerable.Plugin);
