  /*------------------------------- LANG: HASH -------------------------------*/

  $H = function(object) {
    return new Hash(object);
  };

  Hash = Class.create(Enumerable, (function() {
    function initialize(object) {
      this._object = Object.isHash(object) ?
        object.toObject() : Object.clone(object);
    }

    function _each(iterator) {
      var pair;
      Object._each(this._object, function(value, key) {
        pair = [key, value];
        pair.key = key;
        pair.value = pair[1];
        iterator(pair);
      });
    }

    function clone() {
      return new Hash(this);
    }

    function filter(iterator, context) {
      var result = new Hash();
      Object._each(this._object, function(value, key) {
        if (iterator.call(context, value, key))
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

    function grep(pattern, iterator, context) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) this.clone();
      iterator = iterator || Fuse.K;
      var result = new Hash();
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      Object._each(this._object, function(value, key) {
        if (pattern.match(value))
          result.set(key, iterator.call(context, value, key));
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

    function partition(iterator, context) {
      iterator = iterator || Fuse.K;
      var trues = new Hash(), falses = new Hash();
      Object._each(this._object, function(value, key) {
        (iterator.call(context, value, key) ?
          trues : falses).set(key, value);
      });
      return [trues, falses];
    }

    function update(object) {
      var self = this, object = new Hash(object)._object;
      Object._each(object, function(value, key) {
        self.set(key, value);
      });
      return self;
    }

    function reject(iterator, context) {
      var result = new Hash();
      Object._each(this._object, function(value, key) {
        if (!iterator.call(context, value, key))
          result.set(key, value]);
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
      var iterator = Fuse.K, args = slice.call(arguments, 0);
      if (typeof args.last() === 'function')
        iterator = args.pop();

      var hash, value, values, j, i = 0, 
       result = new Hash(), keys = this.keys(),
       hashes = prependList(args.map($H), this);

      while (key = keys[i++]) {
        j = 0; values = [];
        while (hash = hashes[j++])
          values.push(hash._object[key]);
        result.set(key, iterator(values));
      }
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
