  /*------------------------------- LANG: HASH -------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$H = (function() {
    function $H(object) {
      return new Fuse.Hash(object);
    }
    return $H;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Hash', Fuse.Enumerable, (function() {
    function _set(hash, key, value) {
      var keys = hash._keys, o = hash._object;
      // avoid a method call to Hash#hasKey
      if ((expando + key) in o)
        _unsetByIndex(hash, keys.indexOf(key));

      keys.push(key);
      hash._pairs.push([key, value]);
      hash._values.push(value);
      o[expando + key] = value;
      return hash;
    }

    function _setWithObject(hash, object) {
      if (Fuse.Object.isHash(object)) {
        var pair, i = 0, pairs = object._pairs;
        while (pair = pairs[i++]) _set(hash, pair[0], pair[1]);
      }
      else {
        Fuse.Object._each(object, function(value, key) {
          if (Fuse.Object.hasKey(object, key)) _set(hash, key, value);
        });
      }
      return hash;
    }

    function _unsetByIndex(hash, index) {
      var keys = hash._keys;
      delete hash._object[keys[index]];
      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    }

    return {
      'constructor': (function() {
        function Hash(object) {
          return _setWithObject(this.clear(), object);
        }
        return Hash;
      })(),

      'merge': (function() {
        function merge(object) {
          return _setWithObject(this.clone(), object);
        }
        return merge;
      })(),

      'set': (function() {
        function set(key, value) {
          return Fuse.Object.isString(key)
            ? _set(this, key, value)
            : _setWithObject(this, key);
        }
        return set;
      })(),

      'unset': (function() {
        function unset(key) {
          var key, i = 0, keys = this._keys, o = this._object,
           args = Fuse.Object.isArray(key) ? key : arguments;
          while (key = args[i++])  {
             // avoid a method call to Hash#hasKey
            if ((expando + key) in o)
              _unsetByIndex(this, keys.indexOf(key));
          }
          return this;
        }
        return unset;
      })()
    };
  })());

  Fuse.Hash.from = Fuse.Util.$H;

  /*--------------------------------------------------------------------------*/

  (function() {
    function _returnPair(pair) {
      var key, value;
      pair = Fuse.List(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    }

    this._each = function _each(callback) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i]) callback(_returnPair(pair), i++, this);
      return this;
    };

    this.first = function first(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs;
      if (callback == null) {
        if (pairs.length) return _returnPair(pairs[0]);
      }
      else if (typeof callback === 'function') {
        while (pair = pairs[i++]) {
          if (callback.call(thisArg, pair[1], pair[0], this))
            return _returnPair(pair);
        }
      }
      else {
        var pair, count = +callback, i = 0, results = Fuse.List();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count;
        while (i < count && (pair = pairs[i])) results[i++] = _returnPair(pair);
        return results;
      }
    };

    this.last = function last(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs, length = pairs.length;
      if (callback == null) {
        if (length) return _returnPair(this._pairs.last());
      }
      else if (typeof callback === 'function') {
        while (length--) {
          pair = pairs[length];
          if (callback.call(thisArg, pair[1], pair[2], this))
            return _returnPair(pair);
        }
      }
      else {
        var count = +callback, results = Fuse.List();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count > length ? length : count;
        var  i = 0, pad = length - count;
        while (i < count)
          results[i] = _returnPair(pairs[pad + i++]);
        return results;
      }
    };

    this.toArray = function toArray() {
      var pair, i = 0, pairs = this._pairs, results = Fuse.List();
      while (pair = pairs[i]) results[i++] = _returnPair(pair);
      return results;
    };

    // prevent JScript bug with named function expressions
    var _each = null, first = null, last = null, toArray = null;
  }).call(Fuse.Hash.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.clear = function clear() {
      this._object = { };
      this._keys   = [];
      this._pairs  = [];
      this._values = [];
      return this;
    };

    this.clone = function clone() {
      return new Fuse.Hash(this);
    };

    this.contains = function contains(value, strict) {
      var pair, i = 0, pairs = this._pairs;
      if (strict) {
        while (pair = pairs[i++]) if (value === pair[1]) return true;
      } else {
        while (pair = pairs[i++]) if (value == pair[1]) return true;
      }
      return false;
    };

    this.filter = function filter(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs, result = new Fuse.Hash();
      callback = callback || function(value) { return value != null };

      while (pair = pairs[i++]) {
        if (callback.call(thisArg, pair[1], pair[0], this))
          result.set(pair[0], pair[1]);
      }
      return result;
    };

    this.get = function get(key) {
      return this._object[expando + key];
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || Fuse.Object.isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || Fuse.K;
      var key, pair, value, i = 0, pairs = this._pairs, result = new Fuse.Hash();
      if (Fuse.Object.isString(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      while (pair = pairs[i++]) {
        if (pattern.match(value = pair[1]))
          result.set(key = pair[0], callback.call(thisArg, value, key, this));
      }
      return result;
    };

    this.hasKey = function hasKey(key) {
      return (expando + key) in this._object;
    };

    this.inspect = function inspect() {
      var pair, i = 0, pairs = this._pairs, results = [];
      while (pair = pairs[i])
        results[i++] = pair[0].inspect() + ': ' + Fuse.Object.inspect(pair[1]);
      return '#<Hash:{' + results.join(', ') + '}>';
    };

    this.keyOf = function keyOf(value) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        if (value === pair[1])
          return pair[0];
      }
      return -1;
    };

    this.keys = function keys() {
      return this._keys.clone();
    };

    this.map = function map(callback, thisArg) {
      if (!callback) return this;
      var key, pair, i = 0, pairs = this._pairs, result = new Fuse.Hash();

      if (thisArg) {
        while (pair = pairs[i++])
          result.set(key = pair[0], callback.call(thisArg, pair[1], key, this));
      } else {
        while (pair = pairs[i++])
          result.set(key = pair[0], callback(pair[1], key, this));
      }
      return result;
    };

    this.partition = function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var key, value, pair, i = 0, pairs = this._pairs,
       trues = new Fuse.Hash(), falses = new Fuse.Hash();

      while (pair = pairs[i++])
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      return [trues, falses];
    };

    this.size = function size() {
      return this._keys.length;
    };

    this.toJSON = function toJSON() {
      return Fuse.Object.toJSON(this.toObject());
    };

    this.toObject = function toObject() {
      var pair, i = 0, pairs = this._pairs, object = { };
      while (pair = pairs[i++]) object[pair[0]] = pair[1];
      return object;
    };

    this.toQueryString = function toQueryString() {
      return Fuse.Object.toQueryString(this.toObject());
    };

    this.values = function values() {
      return this._values.clone();
    };

    this.zip = function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function') callback = args.pop();

      var result = new Fuse.Hash(),
       hashes = prependList(args.map($H), this),
       length = hashes.length;

      var j, key, pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        j = 0; values = []; key = pair[0];
        while (j < length) values[j] = hashes[j++]._object[expando + key];
        result.set(key, callback(values, key, this));
      }
      return result;
    };

    // prevent JScript bug with named function expressions
    var clear =      null,
     clone =         null,
     contains =      null,
     filter =        null,
     get =           null,
     grep =          null,
     hasKey =        null,
     keys =          null,
     keyOf =         null,
     inspect =       null,
     map =           null,
     partition =     null,
     size =          null,
     toJSON =        null,
     toObject =      null,
     toQueryString = null,
     values =        null,
     zip =           null;
  }).call(Fuse.Hash.Plugin);
