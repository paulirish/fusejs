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
    this.initialize = function initialize(object) {
      if (Object.isHash(object))
        this._object = Object.clone(object._object);
      else {
        var _object = this._object = { };
        Object._each(object, function(value, key) {
          if (Object.hasKey(object, key))
            _object[expando + key] = value;
        });
      }
    };

    this._each = function _each(callback) {
      var key, pair, value, i = 0;
      for (key in this._object) {
        value = this._object[key];
        key = key.slice(15);
        pair = [key, value];
        pair.key = key;
        pair.value = value;
        callback(pair, i++, this);
      }
    };

    this.clone = function clone() {
      return new Hash(this);
    };

    this.filter = function filter(callback, thisArg) {
      var key, value, result = new Hash();
      callback = callback || function(value) { return value != null };
      for (key in this._object) {
        value = this._object[key]; key = key.slice(15);
        if (callback.call(thisArg, value, key, this))
          result.set(key, value);
      }
      return result;
    };

    this.contains = function contains(value) {
      for (var key in this._object) {
        if (value == this._object[key])
          return true;
      }
      return false;
    };

    this.inspect = function inspect() {
      var key, value, results = [];
      for (key in this._object) {
        value = this._object[key]; key = key.slice(15);
        results.push(key.inspect() + ': ' + Object.inspect(value));
      }
      return '#<Hash:{' + results.join(', ') + '}>';
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || Fuse.K;
      var key, value, result = new Hash();
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      for (key in this._object) {
        value = this._object[key]; key = key.slice(15);
        if (pattern.match(value))
          result.set(key, callback.call(thisArg, value, key, this));
      }
      return result;
    };

    this.hasKey = function hasKey(key) {
      return (expando + key) in this._object;
    };

    this.keyOf = function keyOf(value) {
      for (var key in this._object) {
        if (value === this._object[key])
          return key.slice(15);
      }
      return -1;
    };

    this.merge = function merge(object) {
      return this.clone().update(object);
    };

    this.partition = function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var key, value, trues = new Hash(), falses = new Hash();
      for (key in this._object) {
        value = this._object[key]; key = key.slice(15);
        (callback.call(thisArg, value, key, this) ?
          trues : falses).set(key, value);
      }
      return [trues, falses];
    };

    this.update = function update(object) {
      var key, value, object = new Hash(object)._object;
      for (key in object) {
        value = object[key]; key = key.slice(15);
        this.set(key, value);
      }
      return this;
    };

    this.reject = function reject(callback, thisArg) {
      var key, value, result = new Hash();
      for (key in this._object) {
        value = this._object[key]; key = key.slice(15);
        if (!callback.call(thisArg, value, key, this))
          result.set(key, value);
      }
      return result;
    };

    this.toJSON = function toJSON() {
      return Object.toJSON(this.toObject());
    };

    this.toObject = function toObject() {
      var key, object = { };
      for (key in this._object)
        object[key.slice(15)] = this._object[key];
      return object;
    };

    this.toQueryString = function toQueryString() {
      return Object.toQueryString(this.toObject());
    };

    this.get = function get(key) {
      return this._object[expando + key];
    };

    this.set = function set(key, value) { 
      return this._object[expando + key] = value;
    };

    this.unset = function unset(key) {
      key = expando + key;
      var value = this._object[key];
      delete this._object[key];
      return value;
    };

    this.keys = function keys() {
      var key, results = [];
      for (key in this._object)
        results.push(key.slice(15));
      return results;
    };

    this.values = function values() {
      var key, results = [];
      for (key in this._object)
        results.push(this._object[key]);
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
     clone =         null,
     filter =        null,
     get =           null,
     grep =          null,
     hasKey =        null,
     keys =          null,
     keyOf =         null,
     contains =      null,
     inspect =       null,
     merge =         null,
     partition =     null,
     reject =        null,
     set =           null,
     toJSON =        null,
     toObject =      null,
     toQueryString = null,
     unset =         null,
     update =        null,
     values =        null,
     zip =           null;
  }).call(Hash.prototype);

  // aliases
  Object._extend(Hash.prototype, (function() {
    return {
      'findAll':                this.filter,
      'index':                  this.keyOf,
      'select':                 this.filter,
      'toTemplateReplacements': this.toObject
    };
  }).call(Hash.prototype));
