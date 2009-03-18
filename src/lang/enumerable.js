  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  $break = { };

  (function() {
    Enumerable = {
      'detect': function detect(callback, thisArg) {
        var result;
        this.each(function(value, index, iterable) {
          if (callback.call(thisArg, value, index, iterable)) {
            result = value;
            throw $break;
          }
        });
        return result;
      },

      'each': function(callback, thisArg) {
        try {
          this._each(function(value, index, iterable) {
            callback.call(thisArg, value, index, iterable);
          });
        } catch (e) {
          if (e !== $break) throw e;
        }
        return this;
      },

      'eachSlice': function eachSlice(size, callback, thisArg) {
        var index = -size, slices = [], array = this.toArray();
        if (size < 1) return array;
        while ((index += size) < array.length)
          slices[slices.length] = array.slice(index, index + size);
        return slices.map(callback, thisArg);
      },

      'every': function every(callback, thisArg) {
        callback = callback || Fuse.K;
        var result = true;
        this.each(function(value, index, iterable) {
          if (!callback.call(thisArg, value, index, iterable)) {
            result = false; throw $break;
          }
        });
        return result;
      },

      'filter': function filter(callback, thisArg) {
        var results = [];
        callback = callback || function(value) { return value != null };
        this._each(function(value, index, iterable) {
          if (callback.call(thisArg, value, index, iterable))
            results.push(value);
        });
        return results;
      },

      'grep': function grep(pattern, callback, thisArg) {
        if (!pattern || Object.isRegExp(pattern) &&
           !pattern.source) return this.toArray();
        callback = callback || Fuse.K;
        var results = [];
        if (typeof pattern === 'string')
          pattern = new RegExp(RegExp.escape(pattern));

        this._each(function(value, index, iterable) {
          if (pattern.match(value))
            results.push(callback.call(thisArg, value, index, iterable));
        });
        return results;
      },

      'include': function include(object) {
        var found = false;
        this.each(function(value) {
          if (value == object) {
            found = true;
            throw $break;
          }
        });
        return found;
      },

      'inGroupsOf': function inGroupsOf(size, filler) {
        filler = (typeof filler === 'undefined') ? null : filler;
        return this.eachSlice(size, function(slice) {
          while (slice.length < size) slice.push(filler);
          return slice;
        });
      },

      'inject': function inject(accumulator, callback, thisArg) {
        this._each(function(value, index, iterable) {
          accumulator = callback.call(thisArg, accumulator, value, index, iterable);
        });
        return accumulator;
      },

      'inspect': function inspect() {
        return '#<Enumerable:' + this.toArray().inspect() + '>';
      },

      'invoke': function invoke(method) {
        var args = slice.call(arguments, 1);
        return this.map(function(value) {
          return Function.prototype.apply.call(value[method], value, args);
        });
      },

      'map': function map(callback, thisArg) {
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
      },

      'max': function max(callback, thisArg) {
        callback = callback || Fuse.K;
        var result;
        this._each(function(value, index, iterable) {
          value = callback.call(thisArg, value, index, iterable);
          if (result == null || value >= result)
            result = value;
        });
        return result;
      },

      'min': function min(callback, thisArg) {
        callback = callback || Fuse.K;
        var result;
        this._each(function(value, index, iterable) {
          value = callback.call(thisArg, value, index, iterable);
          if (result == null || value < result)
            result = value;
        });
        return result;
      },

      'partition': function partition(callback, thisArg) {
        callback = callback || Fuse.K;
        var trues = [], falses = [];
        this._each(function(value, index, iterable) {
          (callback.call(thisArg, value, index, iterable) ?
            trues : falses).push(value);
        });
        return [trues, falses];
      },

      'pluck': function pluck(property) {
        return this.map(function(value) {
          return value[property];
        });
      },

      'reject': function reject(callback, thisArg) {
        var results = [];
        this._each(function(value, index, iterable) {
          if (!callback.call(thisArg, value, index, iterable))
            results.push(value);
        });
        return results;
      },

      'size': function size() {
        return this.toArray().length;
      },

      'some': function some(callback, thisArg) {
        callback = callback || Fuse.K;
        var result = false;
        this.each(function(value, index, iterable) {
          if (callback.call(thisArg, value, index, iterable)) {
            result = true; throw $break;
          }
        });
        return result;
      },

      'sortBy': function sortBy(callback, thisArg) {
        return this.map(function(value, index, iterable) {
          return {
            'value': value,
            'criteria': callback.call(thisArg, value, index, iterable)
          };
        }).sort(function(left, right) {
          var a = left.criteria, b = right.criteria;
          return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
      },

      'toArray': function toArray() {
        var results = [];
        this._each(function(value) { results.push(value) });
        return results;
      },

      'zip': function zip() {
        var callback = Fuse.K, args = slice.call(arguments, 0);
        if (typeof args.last() === 'function')
          callback = args.pop();

        var sequences = prependList(args.map($A), this);
        return this.map(function(value, index, iterable) {
          return callback(sequences.pluck(index), index, iterable);
        });
      }
    };

    // prevent JScript bug with named function expressions
    var detect =  null,
     each =       null,
     eachSlice =  null,
     every =      null,
     filter =     null,
     grep =       null,
     include =    null,
     inject =     null,
     inGroupsOf = null,
     inspect =    null,
     invoke =     null,
     map =        null,
     max =        null,
     min =        null,
     partition =  null,
     pluck =      null,
     reject =     null,
     size =       null,
     some =       null,
     sortBy =     null,
     toArray =    null;
  })();

  // aliases
  Object._extend(Enumerable, (function() {
    return {
      'all':     this.every,
      'any':     this.some,
      'collect': this.map,
      'entries': this.toArray,
      'find':    this.detect,
      'findAll': this.filter,
      'member':  this.include,
      'select':  this.filter,
      'zip':     this.zip
    };
  }).call(Enumerable));
