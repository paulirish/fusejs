  /*------------------------------- LANG: RANGE ------------------------------*/

  Fuse.addNS('Range', Fuse.Enumerable, {
    'constructor': (function() {
      function Range(start, end, exclusive) {
        if (!(this instanceof Range))
          return new Range(start, end, exclusive);

        this.start = Fuse.Object(start);
        this.end = Fuse.Object(end);
        this.exclusive = exclusive;
      }
      return Range;
    })()
  });

  /*--------------------------------------------------------------------------*/

  (function(proto) {
    function buildCache(thisArg, callback) {
      var c = thisArg._cache = Fuse.List(), i = 0,
       value = c.start = thisArg.start = Fuse.Object(thisArg.start);

      c.end = thisArg.end = Fuse.Object(thisArg.end);
      c.exclusive = thisArg.exclusive;

      while (isInRange(thisArg, value)) {
        c.push(value);
        callback && callback(value, i++, thisArg);
        value = value.succ();
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

    proto._each = function _each(callback) {
      if (isExpired(this)) buildCache(this, callback);
      else {
        var c = this._cache, i = 0, length = c.length;
        while (i < length) callback(c[i], i++ , this);
      }
    };

    proto.max = (function(__max) {
      function max(callback, thisArg) {
        var result;
        if (!callback && !isExpired(this))
          result = this._cache[this._cache.length - 1];
        else result = __max.call(this, callback, thisArg);
        return result;
      }
      return max;
    })(proto.max);

    proto.min = (function(__min) {
      function min(callback, thisArg) {
        return !callback
          ? this.start
          : __min.call(this, callback, thisArg);
      }
      return min;
    })(proto.min);

    proto.size = function size() {
      var c = this._cache;
      if (isExpired(this)) {
        if (isNumber(this.start) && isNumber(this.end))
          return Fuse.Number(this.end - this.start + (this.exclusive ? 0 : 1));
        buildCache(this);
      }
      return Fuse.Number(this._cache.length);
    };

    proto.toArray = function toArray() {
      isExpired(this) && buildCache(this);
      return Fuse.List.fromArray(this._cache);
    };

    // prevent JScript bug with named function expressions
    var _each = null, size = null, toArray = null;
  })(Fuse.Range.Plugin);

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$R = Fuse.Range;
