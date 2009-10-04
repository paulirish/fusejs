  /*------------------------------- LANG: HASH -------------------------------*/

  Fuse.Hash = (function() {
    var Klass = function () { },

    Hash = function Hash(object) {
      return setWithObject((new Klass).clear(), object);
    },

    merge = function merge(object) {
      return setWithObject(this.clone(), object);
    },

    set = function set(key, value) {
      return isString(key)
        ? setValue(this, key, value)
        : setWithObject(this, key);
    },

    unset = function unset(key) {
      var data = this._data, i = 0,
       keys = isArray(key) ? key : arguments;

      while (key = keys[i++])  {
        if ((expando + key) in data)
          unsetByIndex(this, indexOfKey(this, key));
      }
      return this;
    },

    indexOfKey = function(hash, key) {
      key = String(key);
      var index = 0, keys = hash._keys, length = keys.length;
      for ( ; index < length; index++)
        if (keys[index] == key) return index;
    },

    setValue = function(hash, key, value) {
      if (!key.length) return hash;
      var data = hash._data, expandoKey = expando + key, keys = hash._keys;

      // avoid a method call to Hash#hasKey
      if (expandoKey in data)
        unsetByIndex(hash, indexOfKey(hash, key));

      keys.push(key = Fuse.String(key));

      hash._pairs.push(Fuse.List(key, value));
      hash._values.push(value);

      hash._data[expandoKey] =
      hash._object[key] = value;
      return hash;
    },

    setWithObject = function(hash, object) {
      if (isHash(object)) {
        var pair, i = 0, pairs = object._pairs;
        while (pair = pairs[i++]) setValue(hash, pair[0], pair[1]);
      }
      else {
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) setValue(hash, key, value);
        });
      }
      return hash;
    },

    unsetByIndex = function(hash, index) {
      var keys = hash._keys;
      delete hash._data[expando + keys[index]];
      delete hash._object[keys[index]];

      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    };

    Hash = Class({ 'constructor': Hash, 'merge': merge, 'set': set, 'unset': unset });
    Klass.prototype = Hash.plugin;
    return Hash;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function _returnPair(pair) {
      var key, value;
      pair = Fuse.List(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    }

    plugin._each = function _each(callback) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i]) callback(_returnPair(pair), i++, this);
      return this;
    };

    plugin.first = function first(callback, thisArg) {
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
        var count = +callback, results = Fuse.List();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count;
        while (i < count && (pair = pairs[i])) results[i++] = _returnPair(pair);
        return results;
      }
    };

    plugin.last = function last(callback, thisArg) {
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
        var  pad = length - count;
        while (i < count)
          results[i] = _returnPair(pairs[pad + i++]);
        return results;
      }
    };

    // prevent JScript bug with named function expressions
    var _each = nil, first = nil, last = nil;
  })(Fuse.Hash.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin, $H) {
    plugin.clear = function clear() {
      this._data   = { };
      this._object = { };
      this._keys   = Fuse.List();
      this._pairs  = Fuse.List();
      this._values = Fuse.List();
      return this;
    };

    plugin.clone = (function() {
      function clone() { return new $H(this); };
      return clone;
    })();

    plugin.contains = function contains(value) {
      var item, pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        // basic strict match
        if ((item = pair[1]) === value) return true;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
      }
      return false;
    };

    plugin.filter = function filter(callback, thisArg) {
      var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
      callback = callback || function(value) { return value != null; };

      while (pair = pairs[i++]) {
        if (callback.call(thisArg, value = pair[1], key = pair[0], this))
          result.set(key, value);
      }
      return result;
    };

    plugin.get = function get(key) {
      return this._data[expando + key];
    };

    plugin.hasKey = (function() {
      function hasKey(key) { return (expando + key) in this._data; }
      return hasKey;
    })();

    plugin.keyOf = function keyOf(value) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        if (value === pair[1])
          return pair[0];
      }
      return Fuse.Number(-1);
    };

    plugin.keys = function keys() {
      return Fuse.List.fromArray(this._keys);
    };

    plugin.map = function map(callback, thisArg) {
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

    plugin.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var key, value, pair, i = 0, pairs = this._pairs,
       trues = new $H(), falses = new $H();

      while (pair = pairs[i++])
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      return Fuse.List(trues, falses);
    };

    plugin.size = function size() {
      return Fuse.Number(this._keys.length);
    };

    plugin.toArray = function toArray() {
      return Fuse.List.fromArray(this._pairs);
    };

    plugin.toObject = function toObject() {
      var pair, i = 0, pairs = this._pairs, result = Fuse.Object();
      while (pair = pairs[i++]) result[pair[0]] = pair[1];
      return result;
    };

    plugin.toQueryString = function toQueryString() {
      return Obj.toQueryString(this._object);
    };

    plugin.values = function values() {
      return Fuse.List.fromArray(this._values);
    };

    plugin.zip = (function() {
      function mapToHash(array) {
        var results = [], length = array.length;
        while (length--) results[length] = new $H(array[length]);
        return results;
      }

      function zip() {
        var callback = K, args = slice.call(arguments, 0);

        // if last argument is a function it is the callback
        if (typeof args[args.length - 1] === 'function')
          callback = args.pop();

        var result = new $H(),
         hashes = prependList(mapToHash(args), this),
         length = hashes.length;

        var j, key, pair, i = 0, pairs = this._pairs;
        while (pair = pairs[i++]) {
          j = 0; values = Fuse.List(); key = pair[0];
          while (j < length) values[j] = hashes[j++]._data[expando + key];
          result.set(key, callback(values, key, this));
        }
        return result;
      }

      return zip;
    })();

    // alias
    plugin.toList = plugin.toArray;

    // assign any missing Enumerable methods
    if (Enumerable) {
      eachKey(Enumerable, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function')
          plugin[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var clear =      nil,
     contains =      nil,
     filter =        nil,
     get =           nil,
     keys =          nil,
     keyOf =         nil,
     map =           nil,
     partition =     nil,
     size =          nil,
     toArray =       nil,
     toObject =      nil,
     toQueryString = nil,
     values =        nil;
  })(Fuse.Hash.plugin, Fuse.Hash);

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$H = Fuse.Hash.from = Fuse.Hash;
