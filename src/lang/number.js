  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function() {
    this.abs = (function() {
      function abs() { return Fuse.Number(_abs(this)) }
      var _abs = Math.abs;
      return abs;
    })();

    this.ceil = (function() {
      function ceil() { return Fuse.Number(_ceil(this)) }
      var _ceil = Math.ceil;
      return ceil;
    })();

    this.floor = (function() {
      function floor() { return Fuse.Number(_floor(this)) }
      var _floor = Math.floor;
      return floor;
    })();

    this.round = (function() {
      function round() { return Fuse.Number(_round(this)) }
      var _round = Math.round;
      return round;
    })();

  }).call(Fuse.Number.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    var proto = this;

    var _toInteger = (function() {
      var _abs = Math.abs, _floor = Math.floor;
      return function(object) {
        var number = 1 * object; // fast coerce to number
        if (number == 0 || !isFinite(number)) return number || 0;

        // avoid issues with large numbers against bitwise operators
        return number < 2147483648
          ? number | 0
          : (number < 0 ? -1 : 1) * _floor(_abs(number));
      };
    })();

    this.succ = function succ() {
      return Fuse.Number(_toInteger(this) + 1);
    };

    this.times = function times(callback, thisArg) {
      var i = 0, length = _toInteger(this);
      if (arguments.length === 1) {
        while (i < length) callback(i, i++);
      } else {
        while (i < length) callback.call(thisArg, i, i++);
      }
      return this;
    };

    this.toColorPart = function toColorPart() {
      return proto.toPaddedString.call(_toInteger(this), 2, 16);
    };

    this.toPaddedString = (function() {
      function toPaddedString(length, radix) {
        var string = _toInteger(this).toString(radix || 10);
        if (length <= string.length) return Fuse.String(string);
        if (length > pad.length) pad = new Array(length + 1).join('0');
        return Fuse.String((pad + string).slice(-length));
      }

      var pad = '000000';
      return toPaddedString;
    })();

    // prevent JScript bug with named function expressions
    var succ = null, times = null, toColorPart = null;
  }).call(Fuse.Number.Plugin);
