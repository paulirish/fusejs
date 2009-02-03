  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  $break = { };

  Enumerable = (function() {
    function _map(context, iterator) {
      var results = [];
      context._each(function(value) {
        results.push(iterator(value));
      });
      return results;
    }

    function detect(iterator, context) {
      var result;
      this.each(function(value, index) {
        if (iterator.call(context, value, index)) {
          result = value;
          throw $break;
        }
      });
      return result;
    }

    function each(iterator, context) {
      var index = 0;
      try {
        this._each(function(value) {
          iterator.call(context, value, index++);
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
      iterator = iterator || K;
      var result = true;
      this.each(function(value, index) {
        result = !!iterator.call(context, value, index);
        if (!result) throw $break;
      });
      return result;
    }

    function filter(iterator, context) {
      var results = [], index = 0;
      if (!iterator)
        iterator = function() { return value != null };
      this._each(function(value) {
        if (iterator.call(context, value, index++))
          results.push(value);
      });
      return results;
    }

    function grep(pattern, iterator, context) {
      if (!pattern) this.toArray();
      iterator = iterator || K;

      var results = [], index = 0;
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      this._each(function(value) {
        if (pattern.match(value))
          results.push(iterator.call(context, value, index++));
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
      var index = 0;
      this._each(function(value) {
        accumulator = iterator.call(context, accumulator, value, index++);
      });
      return accumulator;
    }

    function inspect() {
      return '#<Enumerable:' + this.toArray().inspect() + '>';
    }

    function invoke(method) {
      var args = slice.call(arguments, 1);
      return _map(this, function(value) {
        return Function.prototype.apply.call(value[method], value, args);
      });
    }

    function map(iterator, context) {
      if (!iterator) return this.toArray();
      var results = [], index = 0;
      this._each(function(value) {
        results.push(iterator.call(context, value, index++));
      });
      return results;
    }

    function max(iterator, context) {
      iterator = iterator || K;
      var result, index = 0;
      this._each(function(value) {
        value = iterator.call(context, value, index++);
        if (result == null || value >= result)
          result = value;
      });
      return result;
    }

    function min(iterator, context) {
      iterator = iterator || K;
      var result, index = 0;
      this._each(function(value) {
        value = iterator.call(context, value, index++);
        if (result == null || value < result)
          result = value;
      });
      return result;
    }

    function partition(iterator, context) {
      iterator = iterator || K;
      var trues = [], falses = [], index = 0;
      this._each(function(value) {
        (iterator.call(context, value, index++) ?
          trues : falses).push(value);
      });
      return [trues, falses];
    }

    function pluck(property) {
      return _map(this, function(value) {
        return value[property];
      });
    }

    function reject(iterator, context) {
      var results = [], index = 0;
      this._each(function(value) {
        if (!iterator.call(context, value, index++))
          results.push(value);
      });
      return results;
    }

    function size() {
      return this.toArray().length;
    }

    function some(iterator, context) {
      iterator = iterator || K;
      var result = false;
      this.each(function(value, index) {
        if (result = !!iterator.call(context, value, index))
          throw $break;
      });
      return result;
    }

    function sortBy(iterator, context) {
      var index = 0;
      return _map(this, function(value) {
        return {
          'value': value,
          'criteria': iterator.call(context, value, index)
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
      var index = 0, iterator = K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var sequences = prependList(args.map($A), this);
      return _map(this, function(value) {
        return iterator(sequences.pluck(index++));
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
