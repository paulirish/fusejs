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
      this._object = Object.isHash(object) ?
        object.toObject() : Object.clone(object);
    };

    this._each = function _each(callback) {
      var pair, hash = this, i = 0;
      Object._each(this._object, function(value, key) {
        pair = [key, value];
        pair.key = key;
        pair.value = pair[1];
        callback(pair, i++, hash);
      });
    };

    this.clone = function clone() {
      return new Hash(this);
    };

    this.filter = function filter(callback, thisArg) {
      var hash = this, result = new Hash();
      callback = callback || function(value) { return value != null };
      Object._each(this._object, function(value, key) {
        if (callback.call(thisArg, value, key, hash))
          result.set(key, value);
      });
      return result;
    };

    this.include = function include(value) {
      var result = false;
      Object.each(this._object, function(objValue) {
        if (value == objValue) {
          result = true;
          throw $break;
        }
      });
      return result;
    };

    this.inspect = function inspect() {
      var results = [];
      Object._each(this._object, function(value, key) {
        results.push(key.inspect() + ': ' + Object.inspect(value));
      });
      return '#<Hash:{' + results.join(', ') + '}>';
    };

    this.grep = function grep(pattern, callback, thisArg) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) return this.clone();

      callback = callback || Fuse.K;
      var hash = this, result = new Hash();
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      Object._each(this._object, function(value, key) {
        if (pattern.match(value))
          result.set(key, callback.call(thisArg, value, key, hash));
      });
      return result;
    };

    this.hasKey = function hasKey(key) {
      return Object.hasKey(this._object, key);
    };

    this.keyOf = function keyOf(value) {
      var result = -1;
      Object.each(this._object, function(objValue, key) {
        if (value === objValue) {
          result = key;
          throw $break;
        }
      });
      return result;
    };

    this.merge = function merge(object) {
      return this.clone().update(object);
    };

    this.partition = function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var hash = this, trues = new Hash(), falses = new Hash();
      Object._each(this._object, function(value, key) {
        (callback.call(thisArg, value, key, hash) ?
          trues : falses).set(key, value);
      });
      return [trues, falses];
    };

    this.update = function update(object) {
      var hash = this, object = new Hash(object)._object;
      Object._each(object, function(value, key) {
        hash.set(key, value);
      });
      return hash;
    };

    this.reject = function reject(callback, thisArg) {
      var hash = this, result = new Hash();
      Object._each(this._object, function(value, key) {
        if (!callback.call(thisArg, value, key, hash))
          result.set(key, value);
      });
      return result;
    };

    this.toJSON = function toJSON() {
      return Object.toJSON(this._object);
    };

    this.toObject = function toObject() {
      return Object.clone(this._object);
    };

    this.toQueryString = function toQueryString() {
      return Object.toQueryString(this._object);
    };

    this.get = function get(key) {
      if (Object.hasKey(this._object, key))
        return this._object[key];
    };

    this.set = function set(key, value) { 
      return this._object[key] = value;
    };

    this.unset = function unset(key) {
      var value = this._object[key];
      delete this._object[key];
      return value;
    };

    this.keys = function keys() {
      return Object.keys(this._object);
    };

    this.values = function values() {
      return Object.values(this._object);
    };

    this.zip = function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        callback = args.pop();

      var hash = this, result = new Hash(),
       hashes  = prependList(args.map($H), this),
       length  = hashes.length;

      Object._each(this._object, function(value, key, object) {
        if (!Object.hasKey(object, key)) return;
        var i = 0, values = [];
        while (i < length) values.push(hashes[i++]._object[key]);
        result.set(key, callback(values, key, hash));
      });
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
     include =       null,
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
