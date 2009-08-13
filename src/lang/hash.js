  /*------------------------------- LANG: HASH -------------------------------*/

  Fuse.addNS('Hash', Fuse.Enumerable, (function() {
    function indexOfKey(hash, key) {
      key = String(key);
      var index = 0, keys = hash._keys, length = keys.length;
      for ( ; index < length; index++)
        if (keys[index] == key) return index;
    }

    function setValue(hash, key, value) {
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
    }

    function setWithObject(hash, object) {
      if (object instanceof Fuse.Hash) {
        var pair, i = 0, pairs = object._pairs;
        while (pair = pairs[i++]) setValue(hash, pair[0], pair[1]);
      }
      else {
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) setValue(hash, key, value);
        });
      }
      return hash;
    }

    function unsetByIndex(hash, index) {
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
          return setWithObject(this.clear(), object);
        }
        return Hash;
      })(),

      'merge': (function() {
        function merge(object) {
          return setWithObject(this.clone(), object);
        }
        return merge;
      })(),

      'set': (function() {
        function set(key, value) {
          return isString(key)
            ? setValue(this, key, value)
            : setWithObject(this, key);
        }
        return set;
      })(),

      'unset': (function() {
        function unset(key) {
          var data = this._data, i = 0,
           keys = isArray(key) ? key : arguments;

          while (key = keys[i++])  {
            if ((expando + key) in data)
              unsetByIndex(this, indexOfKey(this, key));
          }
          return this;
        }
        return unset;
      })()
    };
  })());

  /*--------------------------------------------------------------------------*/

  (function(proto) {
    function _returnPair(pair) {
      var key, value;
      pair = Fuse.List(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    }

    proto._each = function _each(callback) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i]) callback(_returnPair(pair), i++, this);
      return this;
    };

    proto.first = function first(callback, thisArg) {
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
        var count = 1 * callback, results = Fuse.List();
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count;
        while (i < count && (pair = pairs[i])) results[i++] = _returnPair(pair);
        return results;
      }
    };

    proto.last = function last(callback, thisArg) {
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
        var  pad = length - count;
        while (i < count)
          results[i] = _returnPair(pairs[pad + i++]);
        return results;
      }
    };

    // prevent JScript bug with named function expressions
    var _each = null, first = null, last = null;
  })(Fuse.Hash.Plugin);

  /*--------------------------------------------------------------------------*/

  (function(proto, $H) {
    proto.clear = function clear() {
      this._data   = { };
      this._object = { };
      this._keys   = Fuse.List();
      this._pairs  = Fuse.List();
      this._values = Fuse.List();
      return this;
    };

    proto.clone = (function() {
      function clone() { return $H(this) };
      return clone;
    })();

    proto.contains = function contains(value, strict) {
      var pair, i = 0, pairs = this._pairs;
      if (strict) {
        while (pair = pairs[i++]) if (value === pair[1]) return true;
      } else {
        while (pair = pairs[i++]) if (value == pair[1]) return true;
      }
      return false;
    };

    proto.filter = function filter(callback, thisArg) {
      var pair, i = 0, pairs = this._pairs, result = new $H();
      callback = callback || function(value) { return value != null };

      while (pair = pairs[i++]) {
        if (callback.call(thisArg, pair[1], pair[0], this))
          result.set(pair[0], pair[1]);
      }
      return result;
    };

    proto.get = function get(key) {
      return this._data[expando + key];
    };

    proto.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || pattern == '' || isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || K;
      var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
      if (isString(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      while (pair = pairs[i++]) {
        if (pattern.test(value = pair[1]))
          result.set(key = pair[0], callback.call(thisArg, value, key, this));
      }
      return result;
    };

    proto.hasKey = (function() {
      function hasKey(key) { return (expando + key) in this._data }
      return hasKey;
    })();

    proto.inspect = (function(__inspect) {
      function inspect() {
        var pair, i = 0, pairs = this._pairs, results = [];
        while (pair = pairs[i])
          results[i++] = pair[0].inspect() + ': ' + __inspect(pair[1]);
        return '#<Hash:{' + results.join(', ') + '}>';
      }
      return inspect;
    })(inspect);

    proto.keyOf = function keyOf(value) {
      var pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        if (value === pair[1])
          return pair[0];
      }
      return Fuse.Number(-1);
    };

    proto.keys = function keys() {
      return Fuse.List.fromArray(this._keys);
    };

    proto.map = function map(callback, thisArg) {
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

    proto.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var key, value, pair, i = 0, pairs = this._pairs,
       trues = new $H(), falses = new $H();

      while (pair = pairs[i++])
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      return Fuse.List(trues, falses);
    };

    proto.size = function size() {
      return Fuse.Number(this._keys.length);
    };

    proto.toArray = function toArray() {
      return Fuse.List.fromArray(this._pairs);
    };

    proto.toObject = function toObject() {
      var pair, i = 0, pairs = this._pairs, result = Fuse.Object();
      while (pair = pairs[i++]) result[pair[0]] = pair[1];
      return result;
    };

    proto.toQueryString = function toQueryString() {
      return Obj.toQueryString(this._object);
    };

    proto.values = function values() {
      return Fuse.List.fromArray(this._values);
    };

    proto.zip = function zip() {
      var callback = K, args = slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();

      var result = new $H(),
       hashes = prependList(Fuse.List.prototype.map.call(args, $H), this),
       length = hashes.length;

      var j, key, pair, i = 0, pairs = this._pairs;
      while (pair = pairs[i++]) {
        j = 0; values = Fuse.List(); key = pair[0];
        while (j < length) values[j] = hashes[j++]._data[expando + key];
        result.set(key, callback(values, key, this));
      }
      return result;
    };

    // alias
    proto.toList = proto.toArray;

    // prevent JScript bug with named function expressions
    var clear =      null,
     contains =      null,
     filter =        null,
     get =           null,
     grep =          null,
     keys =          null,
     keyOf =         null,
     map =           null,
     partition =     null,
     size =          null,
     toArray =       null,
     toObject =      null,
     toQueryString = null,
     values =        null,
     zip =           null;
  })(Fuse.Hash.Plugin, Fuse.Hash);

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$H = Fuse.Hash.from = Fuse.Hash;
