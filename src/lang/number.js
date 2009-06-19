  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function() {
    this.abs = function abs() {
      return Fuse.Number(Math.abs(this));
    };

    this.ceil = function ceil() {
      return Fuse.Number(Math.ceil(this));
    };

    this.floor = function floor() {
      return Fuse.Number(Math.floor(this));
    };

    this.round = function round() {
      return Fuse.Number(Math.round(this));
    };

    this.succ = function succ() {
      return Fuse.Number(this + 1);
    };

    this.times = function times(callback, thisArg) {
      var i = 0, length = this;
      if (arguments.length === 1) {
        while (i < length) callback(i, i++);
      } else {
        while (i < length) callback.call(thisArg, i, i++);
      }
      return this;
    };

    this.toColorPart = function toColorPart() {
      return this.toPaddedString(2, 16);
    };

    this.toPaddedString = (function() {
      function toPaddedString(length, radix) {
        var string = this.toString(radix || 10);
        if (length <= string.length) return Fuse.String(string);
        if (length > pad.length) pad = new Array(length + 1).join('0');
        return Fuse.String((pad + string).slice(-length));
      }

      var pad = '000000';
      return toPaddedString;
    })();

    // prevent JScript bug with named function expressions
    var abs =         null,
     ceil =           null,
     floor =          null,
     round =          null,
     succ =           null,
     times =          null,
     toColorPart =    null;
  }).call(Fuse.Number.Plugin);
