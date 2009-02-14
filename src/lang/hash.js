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
      var key, pair;
      for (key in this._object) {
        pair = [key, this._object[key]];
        pair.key = key;
        pair.value = pair[1];
        iterator(pair);
      }
    }

    function clone() {
      return new Hash(this);
    }

    function filter(iterator, context) {
      var key, result = new Hash();
      for (key in this._object)
        if (iterator.call(context, this._object[key], key))
          result.set(key, this._object[key]);
      return result;
    }

    function include(value) {
      var key;
      for (key in this._object)
        if (this._object[key] == value)
          return true;
      return false;
    }

    function inspect() {
      var results = [];
      for (key in this._object)
        results.push(key.inspect() + ': ' + Object.inspect(this._object[key]));
      return '#<Hash:{' + results.join(', ') + '}>';
    }

    function grep(pattern, iterator, context) {
      if (!pattern || Object.isRegExp(pattern) &&
         !pattern.source) this.clone();
      iterator = iterator || Fuse.K;
      var key, value, result = new Hash();
      if (typeof pattern === 'string')
        pattern = new RegExp(RegExp.escape(pattern));

      for (key in this._object) {
        value = this._object[key];
        if (pattern.match(value))
          result.set(key, iterator.call(context, value,key));
      }
      return result;
    }

    function keyOf(value) {
      var key;
      for (key in this._object)
        if (this._object[key] === value)
          return key;
      return -1;
    }

    function merge(object) {
      return this.clone().update(object);
    }

    function partition(iterator, context) {
      iterator = iterator || Fuse.K;
      var key, trues = new Hash(), falses = new Hash();
      for (key in this._object)
        (iterator.call(context, this._object[key], key) ?
          trues : falses).set(key, this._object[key]);
      return [trues, falses];
    }

    function update(object) {
      var key, object = new Hash(object)._object;
      for (key in object)
        this.set(key, object[key]);
      return this;
    }

    function reject(iterator, context) {
      var result = new Hash();
      for (key in this._object)
        if (!iterator.call(context, this._object[key], key))
          result.set(key, this._object[key]);
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
      'update':                 update,
      'reject':                 reject,
      'select':                 filter,
      'set':                    set,
      'toJSON':                 toJSON,
      'toObject':               toObject,
      'toQueryString':          toQueryString,
      'toTemplateReplacements': toObject,
      'unset':                  unset,
      'values':                 values,
      'zip':                    zip
    };
  })());

  Hash.from = $H;
