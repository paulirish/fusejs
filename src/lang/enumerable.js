  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  $break = { };

  Enumerable = (function() {
    function detect(iterator, context) {
      var result;
      this.each(function(value, index, iterable) {
        if (iterator.call(context, value, index, iterable)) {
          result = value;
          throw $break;
        }
      });
      return result;
    }

    function each(callback, thisArg) {
      try {
        this._each(function(value, index, iterable) {
          callback.call(thisArg, value, index, iterable);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    }

    function eachSlice(size, iterator, context) {
      var index = -size, slices = [], array = this.toArray();
      if (size < 1) return array;
      while ((index += size) < array.length)
        slices[slices.length] = array.slice(index, index + size);
      return slices.map(iterator, context);
    }

    function every(iterator, context) {
      iterator = iterator || Fuse.K;
      var result = true;
      this.each(function(value, index, iterable) {
        if (!iterator.call(context, value, index, iterable)) {
          result = false; throw $break;
        }
      });
      return result;
    }

    function filter(iterator, context) {
      var results = [];
      if (!iterator)
        iterator = function() { return value != null };
      this._each(function(value, index, iterable) {
        if (iterator.call(context, value, index, iterable))
          results.push(value);
      });
      return results;
    }

    function grep(pattern, iterator, context) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) return this.toArray();
      iterator = iterator || Fuse.K;
      var results = [];
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      this._each(function(value, index, iterable) {
        if (pattern.match(value))
          results.push(iterator.call(context, value, index, iterable));
      });
      return results;
    }

    function include(object) {
      var found = false;
      this.each(function(value) {
        if (value == object) {
          found = true;
          throw $break;
        }
      });
      return found;
    }

    function inGroupsOf(size, filler) {
      filler = (typeof filler === 'undefined') ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    }

    function inject(accumulator, iterator, context) {
      this._each(function(value, index, iterable) {
        accumulator = iterator.call(context, accumulator, value, index, iterable);
      });
      return accumulator;
    }

    function inspect() {
      return '#<Enumerable:' + this.toArray().inspect() + '>';
    }

    function invoke(method) {
      var args = slice.call(arguments, 1);
      return this.map(function(value) {
        return Function.prototype.apply.call(value[method], value, args);
      });
    }

    function map(callback, thisArg) {
      if (!callback) return this.toArray();
      var results = [];
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
    }

    function max(iterator, context) {
      iterator = iterator || Fuse.K;
      var result;
      this._each(function(value, index, iterable) {
        value = iterator.call(context, value, index, iterable);
        if (result == null || value >= result)
          result = value;
      });
      return result;
    }

    function min(iterator, context) {
      iterator = iterator || Fuse.K;
      var result;
      this._each(function(value, index, iterable) {
        value = iterator.call(context, value, index, iterable);
        if (result == null || value < result)
          result = value;
      });
      return result;
    }

    function partition(iterator, context) {
      iterator = iterator || Fuse.K;
      var trues = [], falses = [];
      this._each(function(value, index, iterable) {
        (iterator.call(context, value, index, iterable) ?
          trues : falses).push(value);
      });
      return [trues, falses];
    }

    function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    }

    function reject(iterator, context) {
      var results = [];
      this._each(function(value, index, iterable) {
        if (!iterator.call(context, value, index, iterable))
          results.push(value);
      });
      return results;
    }

    function size() {
      return this.toArray().length;
    }

    function some(iterator, context) {
      iterator = iterator || Fuse.K;
      var result = false;
      this.each(function(value, index, iterable) {
        if (iterator.call(context, value, index, iterable)) {
          result = true; throw $break;
        }
      });
      return result;
    }

    function sortBy(iterator, context) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': iterator.call(context, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    }

    function toArray() {
      var results = [];
      this._each(function(value) { results.push(value) });
      return results;
    }

    function zip() {
      var iterator = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var sequences = prependList(args.map($A), this);
      return this.map(function(value, index, iterable) {
        return iterator(sequences.pluck(index), index, iterable);
      });
    }

    return {
      'all':        every,
      'any':        some,
      'collect':    map,
      'detect':     detect,
      'each':       each,
      'eachSlice':  eachSlice,
      'entries':    toArray,
      'every':      every,
      'filter':     filter,
      'find':       detect,
      'findAll':    filter,
      'grep':       grep,
      'include':    include,
      'inject':     inject,
      'inGroupsOf': inGroupsOf,
      'inspect':    inspect,
      'invoke':     invoke,
      'map':        map,
      'max':        max,
      'member':     include,
      'min':        min,
      'partition':  partition,
      'pluck':      pluck,
      'reject':     reject,
      'select':     filter,
      'size':       size,
      'some':       some,
      'sortBy':     sortBy,
      'toArray':    toArray,
      'zip':        zip
    };
  })();
