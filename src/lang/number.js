  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function(plugin) {
    plugin.abs = (function() {
      function abs() { return fuse.Number(__abs(this)); }
      var __abs = Math.abs;
      return abs;
    })();

    plugin.ceil = (function() {
      function ceil() { return fuse.Number(__ceil(this)); }
      var __ceil = Math.ceil;
      return ceil;
    })();

    plugin.floor = (function() {
      function floor() { return fuse.Number(__floor(this)); }
      var __floor = Math.floor;
      return floor;
    })();

    plugin.round = (function() {
      function round() { return fuse.Number(__round(this)); }
      var __round = Math.round;
      return round;
    })();

    plugin.times = function times(callback, thisArg) {
      var i = 0, length = toInteger(this);
      if (arguments.length === 1) {
        while (i < length) callback(i, i++);
      } else {
        while (i < length) callback.call(thisArg, i, i++);
      }
      return this;
    };

    plugin.toColorPart = function toColorPart() {
      return plugin.toPaddedString.call(this, 2, 16);
    };

    plugin.toPaddedString = (function() {
      function toPaddedString(length, radix) {
        var string = toInteger(this).toString(radix || 10);
        if (length <= string.length) return fuse.String(string);
        if (length > pad.length) pad = new Array(length + 1).join('0');
        return fuse.String((pad + string).slice(-length));
      }

      var pad = '000000';
      return toPaddedString;
    })();

    // prevent JScript bug with named function expressions
    var times = nil, toColorPart = nil;
  })(fuse.Number.plugin);
