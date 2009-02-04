  /*------------------------------- LANG: RANGE ------------------------------*/

  $R = function(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
  };

  ObjectRange = Class.create(Enumerable, (function() {
    function initialize(start, end, exclusive) {
      this.start = start;
      this.end = end;
      this.exclusive = exclusive;
    }

    function _each(iterator) {
      var i = 0, c = this.cache, value = this.start;
      if (!c || this.start !== c.start || this.end !== c.end) {
        c = this.cache = [];
        c.start = this.start;
        c.end = this.end;
        c.exclusive = this.exclusive;

        while (include(this, value)) {
          iterator(value);
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
        while (value = c[i++])
          iterator(value);
      }
    }

    function include(context, value) {
      if (value < context.start)
        return false;
      if (context.exclusive)
        return value < context.end;
      return value <= context.end;
    }

    return {
      'initialize': initialize,
      '_each':      _each
    };
  })());
