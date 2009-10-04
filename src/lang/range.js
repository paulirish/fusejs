  /*------------------------------- LANG: RANGE ------------------------------*/

  Fuse.Range = (function() {
    var Klass = function() { },

    Range = function Range(start, end, exclusive) {
      var instance       = new Klass;
      instance.start     = Obj(start);
      instance.end       = Obj(end);
      instance.exclusive = exclusive;
      return instance;
    };

    Range = Class({ 'constructor': Range });
    Klass.prototype = Range.plugin;
    return Range;
  })();

  Fuse.addNS('Util');

  Fuse.Util.$R = Fuse.Range;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function buildCache(thisArg, callback) {
      var c = thisArg._cache = Fuse.List(), i = 0,
       value = c.start = thisArg.start = Fuse.Object(thisArg.start);

      c.end = thisArg.end = Fuse.Object(thisArg.end);
      c.exclusive = thisArg.exclusive;

      if (callback) {
        while (isInRange(thisArg, value)) {
          c.push(value);
          callback(value, i++, thisArg);
          value = value.succ();
        }
      } else {
        while (isInRange(thisArg, value))
          c.push(value) && (value = value.succ());
      }
    }

    function isExpired(thisArg) {
      var c = thisArg._cache, result = false;
      if (!c || thisArg.start != c.start || thisArg.end != c.end)
        result = true;
      else if (thisArg.exclusive !== c.exclusive) {
        c.exclusive = thisArg.exclusive;
        if (c.exclusive) c.pop();
        else {
          var last = c[c.length - 1];
          c.push(last.succ());
        }
      }
      return result;
    }

    function isInRange(thisArg, value) {
      if (value < thisArg.start)
        return false;
      if (thisArg.exclusive)
        return value < thisArg.end;
      return value <= thisArg.end;
    }

    plugin._each = function _each(callback) {
      if (isExpired(this)) buildCache(this, callback);
      else {
        var c = this._cache, i = 0, length = c.length;
        while (i < length) callback(c[i], i++ , this);
      }
    };

    plugin.max = (function(__max) {
      function max(callback, thisArg) {
        var result;
        if (!callback) {
          if (isExpired(this)) buildCache(this, callback);
          result = this._cache[this._cache.length - 1];
        }
        else result = __max.call(this, callback, thisArg);
        return result;
      }
      return max;
    })(Enumerable && Enumerable.max);

    plugin.min = (function(__min) {
      function min(callback, thisArg) {
        return !callback
          ? this.start
          : __min.call(this, callback, thisArg);
      }
      return min;
    })(Enumerable && Enumerable.min);

    plugin.size = function size() {
      var c = this._cache;
      if (isExpired(this)) {
        if (isNumber(this.start) && isNumber(this.end))
          return Fuse.Number(this.end - this.start + (this.exclusive ? 0 : 1));
        buildCache(this);
      }
      return Fuse.Number(this._cache.length);
    };

    plugin.toArray = function toArray() {
      isExpired(this) && buildCache(this);
      return Fuse.List.fromArray(this._cache);
    };

    // assign any missing Enumerable methods
    if (Enumerable) {
      eachKey(Enumerable, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function')
          plugin[key] = value;
      });
    }

    // prevent JScript bug with named function expressions
    var _each = nil, size = nil, toArray = nil;
  })(Fuse.Range.plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    Fuse.Number.plugin.succ = function succ() {
      return Fuse.Number(toInteger(this) + 1);
    };

    Fuse.String.plugin.succ = function succ() {
      if (this == null) throw new TypeError;
      var index = this.length -1;
      return Fuse.String(this.slice(0, index) +
        String.fromCharCode(this.charCodeAt(index) + 1));
    };

    // prevent JScript bug with named function expressions
    var succ = nil;
  })();
