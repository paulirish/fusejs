  /*------------------------------- LANG: RANGE ------------------------------*/

  Fuse.addNS('Range', Fuse.Enumerable, {
    'constructor': (function() {
      function Range(start, end, exclusive) {
        if (!(this instanceof Range))
          return new Range(start, end, exclusive);

        this.start = start;
        this.end = end;
        this.exclusive = exclusive;
      }
      return Range;
    })(),

    '_each': (function() {
      function _each(callback) {
        var value = this.start.valueOf(), i = 0, c = this.cache;
        if (!c || this.start != c.start || this.end != c.end) {
          c = this.cache = Fuse.List();
          c.start = value;
          c.end = this.end.valueOf();
          c.exclusive = this.exclusive;

          while (_inRange(this, value)) {
            callback(value, i++, this);
            c.push(value);
            value = Fuse[typeof value === 'number' ? 'Number' :
              'String'](value).succ().valueOf();
          }
        }
        else {
          if (this.exclusive !== c.exclusive) {
            c.exclusive = this.exclusive;
            if (c.exclusive) c.pop();
            else {
              value = c.last();
              c.push(Fuse[typeof value === 'number' ? 'Number' :
                'String'](value).succ().valueOf());
            }
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

      return _each;
    })()
  });

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$R = Fuse.Range;
