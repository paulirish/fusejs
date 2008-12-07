  /*------------------------------- LANG: HASH -------------------------------*/

  $H = function(object) {
    return new Hash(object);
  };

  Hash = Class.create(Enumerable, (function() {
    function initialize(object) {
        this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    }

    function _each(iterator) {
      for (var key in this._object) {
        var value = this._object[key], pair = [key, value];
        pair.key = key;
        pair.value = value;
        iterator(pair);
      }
    }

    function clone() {
      return new Hash(this);
    }

    function index(value) {
      var match = this.detect(function(pair) { 
        return pair.value === value; 
      });
      return match && match.key;
    }

    function inspect() {
      return '#<Hash:{' + this.map(function(pair) {
        return pair.map(Object.inspect).join(': ');
      }).join(', ') + '}>';
    }

    function merge(object) {
      return this.clone().update(object);
    }

    function update(object) {
      return new Hash(object).inject(this, function(result, pair) {
        result.set(pair.key, pair.value);
        return result;
      });
    }

    function toJSON() {
      return Object.toJSON(this.toObject());
    }

    function toObject() {
      return Object.clone(this._object);
    }

    function toQueryPair(key, value) {
      if (typeof value === 'undefined') return key;
      return key + '=' + encodeURIComponent(String.interpret(value));
    }

    function toQueryString() {
      return this.inject([], function(results, pair) {
        var key = encodeURIComponent(pair.key), values = pair.value;

        if (values && typeof values == 'object') {
          if (Object.isArray(values))
            return mergeList(results, values.map(toQueryPair.curry(key)));
        } else results.push(toQueryPair(key, values));
        return results;
      }).join('&');
    }

    function get(key) {
      // simulating poorly supported hasOwnProperty
      if (this._object[key] !== Object.prototype[key])
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
      return this.pluck('key');
    }

    function values() {
      return this.pluck('value');
    }

    return {
      'initialize':             initialize,
      '_each':                  _each,
      'clone':                  clone,
      'get':                    get,
      'keys':                   keys,
      'index':                  index,
      'inspect':                inspect,
      'merge':                  merge,
      'update':                 update,
      'set':                    set,
      'toJSON':                 toJSON,
      'toObject':               toObject,
      'toQueryString':          toQueryString,
      'toTemplateReplacements': toObject,
      'unset':                  unset,
      'values':                 values
    };
  })());

  Hash.from = $H;
