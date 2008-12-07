  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  $break = { };

  Enumerable = (function() {
    function all(iterator, context) {
      iterator = iterator || K;
      var result = true;
      this.each(function(value, index) {
        result = result && !!iterator.call(context, value, index);
        if (!result) throw $break;
      });
      return result;
    }

    function any(iterator, context) {
      iterator = iterator || K;
      var result = false;
      this.each(function(value, index) {
        if (result = !!iterator.call(context, value, index))
          throw $break;
      });
      return result;
    }

    function collect(iterator, context) {
      iterator = iterator || K;
      var results = [];
      this.each(function(value, index) {
        results.push(iterator.call(context, value, index));
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
        if (e != $break) throw e;
      }
      return this;
    }

    function eachSlice(number, iterator, context) {
      var index = -number, slices = [], array = this.toArray();
      if (number < 1) return array;
      while ((index += number) < array.length)
        slices[slices.length] = array.slice(index, index + number);
      return slices.collect(iterator, context);
    }

    function findAll(iterator, context) {
      var results = [];
      this.each(function(value, index) {
        if (iterator.call(context, value, index))
          results.push(value);
      });
      return results;
    }

    function grep(pattern, iterator, context) {
      if (!pattern) this.toArray();
      iterator = iterator || K;
      var results = [];

      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      this.each(function(value, index) {
        if (pattern.match(value))
          results.push(iterator.call(context, value, index));
      });
      return results;
    }

    function include(object) {
      if (typeof this.indexOf === 'function')
        if (this.indexOf(object) != -1) return true;

      var found = false;
      this.each(function(value) {
        if (value == object) {
          found = true;
          throw $break;
        }
      });
      return found;
    }

    function inGroupsOf(number, fillWith) {
      fillWith = (typeof fillWith === 'undefined') ? null : fillWith;
      return this.eachSlice(number, function(slice) {
        while (slice.length < number) slice.push(fillWith);
        return slice;
      });
    }

    function inject(memo, iterator, context) {
      this.each(function(value, index) {
        memo = iterator.call(context, memo, value, index);
      });
      return memo;
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

    function max(iterator, context) {
      iterator = iterator || K;
      var result;
      this.each(function(value, index) {
        value = iterator.call(context, value, index);
        if (result == null || value >= result)
          result = value;
      });
      return result;
    }

    function min(iterator, context) {
      iterator = iterator || K;
      var result;
      this.each(function(value, index) {
        value = iterator.call(context, value, index);
        if (result == null || value < result)
          result = value;
      });
      return result;
    }

    function partition(iterator, context) {
      iterator = iterator || K;
      var trues = [], falses = [];
      this.each(function(value, index) {
        (iterator.call(context, value, index) ?
          trues : falses).push(value);
      });
      return [trues, falses];
    }

    function pluck(property) {
      var results = [];
      this._each(function(value) {
        results.push(value[property]);
      });
      return results;
    }

    function reject(iterator, context) {
      var results = [];
      this.each(function(value, index) {
        if (!iterator.call(context, value, index))
          results.push(value);
      });
      return results;
    }

    function size() {
      return this.toArray().length;
    }

    function sortBy(iterator, context) {
      return this.map(function(value, index) {
        return {
          value: value,
          criteria: iterator.call(context, value, index)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    }

    function zip() {
      var iterator = K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var collections = prependList(args.map($A), this);
      return this.map(function(value, index) {
        return iterator(collections.pluck(index));
      });
    }

    return {
      'all':        all,
      'any':        any,
      'collect':    collect,
      'detect':     detect,
      'each':       each,
      'eachSlice':  eachSlice,
      'entries':    collect,
      'every':      all,
      'filter':     findAll,
      'find':       detect,
      'findAll':    findAll,
      'grep':       grep,
      'include':    include,
      'inject':     inject,
      'inGroupsOf': inGroupsOf,
      'inspect':    inspect,
      'invoke':     invoke,
      'map':        collect,
      'max':        max,
      'member':     include,
      'min':        min,
      'partition':  partition,
      'pluck':      pluck,
      'reject':     reject,
      'select':     findAll,
      'size':       size,
      'some':       any,
      'sortBy':     sortBy,
      'toArray':    collect,
      'zip':        zip
    };
  })();
