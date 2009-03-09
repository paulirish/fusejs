  /*------------------------------- LANG: RANGE ------------------------------*/

  $R = function(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
  };

  ObjectRange = Class.create(Enumerable, (function() {
    function _each(callback) {
      var i = 0, c = this.cache, value = this.start;
      if (!c || this.start !== c.start || this.end !== c.end) {
        c = this.cache = [];
        c.start = this.start;
        c.end = this.end;
        c.exclusive = this.exclusive;

        while (_inRange(this, value)) {
          callback(value, i++, this);
          c.push(value);
          value = value.succ();
        }
      }
      else {
        if (this.exclusive !== c.exclusive) {
          c.exclusive = this.exclusive;
          if (this.exclusive)
            c.pop();
          else c.push(c.last().succ());
        }
        var length = c.length;
        while (i < length)
          callback(c[i], i++ , this);
      }
    }

    function _inRange(thisArg, value) {
      if (value < thisArg.start)
        return false;
      if (thisArg.exclusive)
        return value < thisArg.end;
      return value <= thisArg.end;
    }

    function initialize(start, end, exclusive) {
      this.start = start;
      this.end = end;
      this.exclusive = exclusive;
    }

    return {
      '_each':      _each,
      'initialize': initialize
    };
  })());
