  /*------------------------------- LANG: HASH -------------------------------*/

  $H = function(object) {
    return new Hash(object);
  };

  Hash = Class.create(Enumerable, (function() {
    function initialize(object) {
      this._object = Object.isHash(object) ?
        object.toObject() : Object.clone(object);
    }

    function _each(callback) {
      var pair, hash = this, i = 0;
      Object._each(this._object, function(value, key) {
        pair = [key, value];
        pair.key = key;
        pair.value = pair[1];
        callback(pair, i++, hash);
      });
    }

    function clone() {
      return new Hash(this);
    }

    function filter(callback, thisArg) {
      var hash = this, result = new Hash();
      callback = callback || function(value) { return value != null };
      Object._each(this._object, function(value, key) {
        if (callback.call(thisArg, value, key, hash))
          result.set(key, value);
      });
      return result;
    }

    function include(value) {
      var result = false;
      Object.each(this._object, function(objValue) {
        if (value == objValue) {
          result = true;
          throw $break;
        }
      });
      return result;
    }

    function inspect() {
      var results = [];
      Object._each(this._object, function(value, key) {
        results.push(key.inspect() + ': ' + Object.inspect(value));
      });
      return '#<Hash:{' + results.join(', ') + '}>';
    }

    function grep(pattern, callback, thisArg) {
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
    }

    function keyOf(value) {
      var result = -1;
      Object.each(this._object, function(objValue, key) {
        if (value === objValue) {
          result = key;
          throw $break;
        }
      });
      return result;
    }

    function merge(object) {
      return this.clone().update(object);
    }

    function partition(callback, thisArg) {
      callback = callback || Fuse.K;
      var hash = this, trues = new Hash(), falses = new Hash();
      Object._each(this._object, function(value, key) {
        (callback.call(thisArg, value, key, hash) ?
          trues : falses).set(key, value);
      });
      return [trues, falses];
    }

    function update(object) {
      var hash = this, object = new Hash(object)._object;
      Object._each(object, function(value, key) {
        hash.set(key, value);
      });
      return hash;
    }

    function reject(callback, thisArg) {
      var hash = this, result = new Hash();
      Object._each(this._object, function(value, key) {
        if (!callback.call(thisArg, value, key, hash))
          result.set(key, value);
      });
      return result;
    }

    function toJSON() {
      return Object.toJSON(this._object);
    }

    function toObject() {
      return Object.clone(this._object);
    }

    function toQueryString() {
      return Object.toQueryString(this._object);
    }

    function get(key) {
      if (Object.isOwnProperty(this._object, key))
        return this._object[key];
    }

    function set(key, value) { 
      return this._object[key] = value;
    }

    function unset(key) {
      var value = this._object[key];
      delete this._object[key];
      return value;
    }

    function keys() {
      return Object.keys(this._object);
    }

    function values() {
      return Object.values(this._object);
    }

    function zip() {
      var callback = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        callback = args.pop();

      var hash = this, result = new Hash(),
       hashes  = prependList(args.map($H), this),
       length  = hashes.length;

      Object._each(this._object, function(value, key, object) {
        if (!Object.isOwnProperty(object, key)) return;
        var i = 0, values = [];
        while (i < length) values.push(hashes[i++]._object[key]);
        result.set(key, callback(values, key, hash));
      });
      return result;
    }

    return {
      'initialize':             initialize,
      '_each':                  _each,
      'clone':                  clone,
      'findAll':                filter,
      'filter':                 filter,
      'get':                    get,
      'grep':                   grep,
      'keys':                   keys,
      'keyOf':                  keyOf,
      'include':                include,
      'index':                  keyOf,
      'inspect':                inspect,
      'merge':                  merge,
      'partition':              partition,
      'reject':                 reject,
      'select':                 filter,
      'set':                    set,
      'toJSON':                 toJSON,
      'toObject':               toObject,
      'toQueryString':          toQueryString,
      'toTemplateReplacements': toObject,
      'unset':                  unset,
      'update':                 update,
      'values':                 values,
      'zip':                    zip
    };
  })());

  Hash.from = $H;
