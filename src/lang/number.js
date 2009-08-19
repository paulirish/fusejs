  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function(proto) {
    proto.abs = (function() {
      function abs() { return Fuse.Number(__abs(this)) }
      var __abs = Math.abs;
      return abs;
    })();

    proto.ceil = (function() {
      function ceil() { return Fuse.Number(__ceil(this)) }
      var __ceil = Math.ceil;
      return ceil;
    })();

    proto.floor = (function() {
      function floor() { return Fuse.Number(__floor(this)) }
      var __floor = Math.floor;
      return floor;
    })();

    proto.round = (function() {
      function round() { return Fuse.Number(__round(this)) }
      var __round = Math.round;
      return round;
    })();

    proto.times = function times(callback, thisArg) {
      var i = 0, length = toInteger(this);
      if (arguments.length === 1) {
        while (i < length) callback(i, i++);
      } else {
        while (i < length) callback.call(thisArg, i, i++);
      }
      return this;
    };

    proto.toColorPart = function toColorPart() {
      return proto.toPaddedString.call(this, 2, 16);
    };

    proto.toPaddedString = (function() {
      function toPaddedString(length, radix) {
        var string = toInteger(this).toString(radix || 10);
        if (length <= string.length) return Fuse.String(string);
        if (length > pad.length) pad = new Array(length + 1).join('0');
        return Fuse.String((pad + string).slice(-length));
      }

      var pad = '000000';
      return toPaddedString;
    })();

    // prevent JScript bug with named function expressions
    var times = null, toColorPart = null;
  })(Fuse.Number.Plugin);
