  /*------------------------------- LANG: HASH -------------------------------*/

  Fuse.addNS('Hash', Fuse.Enumerable, (function() {
    function _indexOfKey(hash, key) {
      key = String(key);
      var index = 0, keys = hash._keys, length = keys.length;
      for ( ; index < length; index++)
        if (keys[index] == key) return index;
    }

    function _set(hash, key, value) {
      if (!key.length) return hash;
      var data = hash._data, expandoKey = expando + key, keys = hash._keys;

      // avoid a method call to Hash#hasKey
      if (expandoKey in data)
        _unsetByIndex(hash, _indexOfKey(hash, key));

      keys.push(key = Fuse.String(key));

      hash._pairs.push(Fuse.List(key, value));
      hash._values.push(value);

      hash._data[expandoKey] =
      hash._object[key] = value;
      return hash;
    }

    function _setWithObject(hash, object) {
      if (object instanceof Fuse.Hash) {
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
      delete hash._data[expando + keys[index]];
      delete hash._object[keys[index]];

      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    }

    return {
      'constructor': (function() {
        function Hash(object) {
          if (!(this instanceof Hash))
            return new Hash(object);
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
          var data = this._data, i = 0,
           keys = Fuse.List.isArray(key) ? key : arguments;

          while (key = keys[i++])  {
            if ((expando + key) in data)
              _unsetByIndex(this, _indexOfKey(this, key));
          }
          return this;
        }
        return unset;
      })()
    };
  })());

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
        var pair, count = 1 * callback, i = 0, results = Fuse.List();
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
        var count = 1 * callback, results = Fuse.List();
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

    // alias
    this.toList = this.toArray;

    // prevent JScript bug with named function expressions
    var _each = null, first = null, last = null, toArray = null;
  }).call(Fuse.Hash.Plugin);

  /*--------------------------------------------------------------------------*/

  (function($H) {
    this.clear = function clear() {
      this._data     = { };
      this._object   = { };
      this._keys     = Fuse.List();
      this._pairs    = Fuse.List();
      this._values   = Fuse.List();
      return this;
    };

    this.clone = function clone() {
      return $H(this);
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
      var pair, i = 0, pairs = this._pairs, result = new $H();
      callback = callback || function(value) { return value != null };

      while (pair = pairs[i++]) {
        if (callback.call(thisArg, pair[1], pair[0], this))
          result.set(pair[0], pair[1]);
      }
      return result;
    };

    this.get = function get(key) {
      return this._data[expando + key];
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || pattern == '' || Fuse.Object.isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || Fuse.K;
      var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
      if (Fuse.Object.isString(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      while (pair = pairs[i++]) {
        if (pattern.test(value = pair[1]))
          result.set(key = pair[0], callback.call(thisArg, value, key, this));
      }
      return result;
    };

    this.hasKey = function hasKey(key) {
      return (expando + key) in this._data;
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
      return Fuse.Number(-1);
    };

    this.keys = function keys() {
      return Fuse.List.fromArray(this._keys);
    };

    this.map = function map(callback, thisArg) {
      if (!callback) return this;
      var key, pair, i = 0, pairs = this._pairs, result = new $H();

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
       trues = new $H(), falses = new $H();

      while (pair = pairs[i++])
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      return Fuse.List(trues, falses);
    };

    this.size = function size() {
      return Fuse.Number(this._keys.length);
    };

    this.toArray = function toArray() {
      return Fuse.List.fromArray(this._pairs);
    };

    this.toObject = function toObject() {
      var pair, i = 0, pairs = this._pairs, result = Fuse.Object();
      while (pair = pairs[i++]) result[pair[0]] = pair[1];
      return result;
    };

    this.toQueryString = function toQueryString() {
      return Fuse.Object.toQueryString(this._object);
    };

    this.values = function values() {
      return Fuse.List.fromArray(this._values);
    };

    this.zip = function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof Fuse.List.Plugin.last.call(args) === 'function')
        callback = args.pop();

      var result = new $H(),
       hashes = prependList(Fuse.List.Plugin.map.call(args, $H), this),
       length = hashes.length;

      var j, key, pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        j = 0; values = Fuse.List(); key = pair[0];
        while (j < length) values[j] = hashes[j++]._data[expando + key];
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
     toArray =       null,
     toObject =      null,
     toQueryString = null,
     values =        null,
     zip =           null;
  }).call(Fuse.Hash.Plugin, Fuse.Hash);

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$H = Fuse.Hash.from = Fuse.Hash;
