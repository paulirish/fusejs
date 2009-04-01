  /*------------------------------- LANG: HASH -------------------------------*/

  global.$H = (function() {
    function $H(object) {
      return new Hash(object);
    }
    return $H;
  })();

  global.Hash = Class.create(Enumerable);

  Hash.from = $H;

  (function() {
    function _returnPair(key, value) {
      var pair = [key, value];
      pair.key = key;
      pair.value = value;
      return pair;
    }

    this.initialize = function initialize(object) {
      var o = this._object = this._object || { };
      if (Object.isHash(object))
        for (key in object._object)o[key] = object._object[key];
      else {
        Object._each(object, function(value, key) {
          if (Object.hasKey(object, key))
            o[expando + key] = value;
        });
      }
      return this;
    };

    this._each = function _each(callback) {
      var key, i = 0, o = this._object;
      for (key in o) 
        callback(_returnPair(key.slice(15), o[key]), i++, this);
      return this;
    };

    this.clear = function clear() {
      this._object = {};
      return this;
    };    

    this.clone = function clone() {
      return new Hash(this);
    };

    this.contains = function contains(value, strict) {
      var key, o = this._object;
      if (strict) {
        for (key in o) if (value === o[key]) return true;
      } else {
        for (key in o) if (value == o[key]) return true;
      }
      return false;
    };

    this.filter = function filter(callback, thisArg) {
      var key, value, o = this._object, result = new Hash();
      callback = callback || function(value) { return value != null };
      for (key in o) {
        value = o[key]; key = key.slice(15);
        if (callback.call(thisArg, value, key, this))
          result.set(key, value);
      }
      return result;
    };

    this.first = function first(callback, thisArg) {
      var key, value, index = 0, o = this._object;
      if (callback == null) {
        for (key in o)
          return _returnPair(key.slice(15), o[key]);
      }
      else if (typeof callback === 'function') {
        for (key in o) {
          value = o[key], key = key.slice(15);
          if (callback.call(thisArg, value, key, index++, this))
            return _returnPair(key, value);
        }
      }
      else {
        var count = +callback, i = 1, results = [];
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count;
        for (key in o)
          if (i++ <= count)
            results.push(_returnPair(key.slice(15), o[key]));
        return results;
      }
    };

    this.get = function get(key) {
      return this._object[expando + key];
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || Fuse.K;
      var key, value, o = this._object, result = new Hash();
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      for (key in o) {
        value = o[key]; key = key.slice(15);
        if (pattern.match(value))
          result.set(key, callback.call(thisArg, value, key, this));
      }
      return result;
    };

    this.hasKey = function hasKey(key) {
      return (expando + key) in this._object;
    };

    this.inspect = function inspect() {
      var key, o = this._object, results = [];
      for (key in o) 
        results.push(key.slice(15).inspect() + ': ' + Object.inspect(o[key]));
      return '#<Hash:{' + results.join(', ') + '}>';
    };

    this.keyOf = function keyOf(value) {
      var key, o = this._object;
      for (key in o) {
        if (value === o[key])
          return key.slice(15);
      }
      return -1;
    };

    this.keys = function keys() {
      var key, results = [];
      for (key in this._object)
        results.push(key.slice(15));
      return results;
    };

    this.last = (function() {
      function _separate(hash) {
        var key, o = hash._object, results = [[], []];
        for (key in o) {
          results[0].push(key.slice(15));
          results[1].push(o[key]);
        }
        return results;
      };

      function last(callback, thisArg) {
        var list = _separate(this), keys = list[0], values = list[1], length = keys.length;
        if (callback == null) {
          if (length) return _returnPair(keys[length - 1], values[length - 1]);
        }
        else if (typeof callback === 'function') {
          while (length--)
            if (callback.call(thisArg, values[length], keys[length], length, this))
              return _returnPair(keys[length], values[length]);
        }
        else {
          var index, pad, count = +callback, i = 0, results = [];
          if (isNaN(count)) return results;
          count = count < 1 ? 1 : count > length ? length : count;
          pad = length - count;
          while (i < count) {
            index = pad + i++;
            results.push(_returnPair(keys[index], values[index]));
          }
          return results;
        }
      };
      return last;
    })();

    this.map = function map(callback, thisArg) {
      if (!callback) return this;
      var key, value, o = this._object, result = new Hash();
      for (key in o) {
        value = o[key]; key = key.slice(15);
        result.set(key, callback.call(thisArg, value, key, this));
      }
      return result;
    };

    this.merge = function merge(object) {
      return this.clone().initialize(object);
    };

    this.partition = function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var key, value, o = this._object, trues = new Hash(), falses = new Hash();
      for (key in o) {
        value = o[key]; key = key.slice(15);
        (callback.call(thisArg, value, key, this) ?
          trues : falses).set(key, value);
      }
      return [trues, falses];
    };

    this.set = function set(key, value) {
      if (typeof key === 'string')
        this._object[expando + key] = value;        
      else
        this.initialize(key);
      return this;
    };

    this.toJSON = function toJSON() {
      return Object.toJSON(this.toObject());
    };

    this.toObject = function toObject() {
      var key, o = this._object, object = { };
      for (key in o) object[key.slice(15)] = o[key];
      return object;
    };

    this.toQueryString = function toQueryString() {
      return Object.toQueryString(this.toObject());
    };

    this.unset = function unset(key) {
      var keys, i = 0, o = this._object;
      if (arguments.length > 1)
        key = slice.call(arguments, 0);

      if (Object.isArray(keys = key))
        while (key = keys[i++]) delete o[expando + key];
      else delete o[expando + key];
      return this;
    };

    this.values = function values() {
      var key, o = this._object, results = [];
      for (key in o) results.push(o[key]);
      return results;
    };

    this.zip = function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        callback = args.pop();

      var result = new Hash(),
       hashes = prependList(args.map($H), this),
       length = hashes.length;

      var i, key, realKey, values;
      for (realKey in this._object) {
        i = 0; values = []; key = realKey.slice(15);
        while (i < length) values.push(hashes[i++]._object[realKey]);
        result.set(key, callback(values, key, this));
      }
      return result;
    };

    // prevent JScript bug with named function expressions
    var initialize = null,
     _each =         null,
     clear =         null,
     clone =         null,
     contains =      null,
     filter =        null,
     first =         null,
     get =           null,
     grep =          null,
     hasKey =        null,
     keys =          null,
     keyOf =         null,
     inspect =       null,
     map =           null,
     merge =         null,
     partition =     null,
     set =           null,
     toJSON =        null,
     toObject =      null,
     toQueryString = null,
     unset =         null,
     values =        null,
     zip =           null;
  }).call(Hash.prototype);
