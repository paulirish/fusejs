  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function() {
    this.abs = function abs() {
      return Math.abs(this);
    };

    this.ceil = function ceil() {
      return Math.ceil(this);
    };

    this.floor = function floor() {
      return Math.floor(this);
    };

    this.round = function round() {
      return Math.round(this);
    };

    this.succ = function succ() {
      return this + 1;
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

    this.toJSON = function toJSON() {
      return isFinite(this) ? this.toString() : 'null';
    };

    this.toPaddedString = function toPaddedString(length, radix) {
      var string = this.toString(radix || 10);
      return '0'.times(length - string.length) + string;
    };

    // prevent JScript bug with named function expressions
    var abs =         null,
     ceil =           null,
     floor =          null,
     round =          null,
     succ =           null,
     times =          null,
     toColorPart =    null,
     toJSON =         null,
     toPaddedString = null;
  }).call(Number.prototype);
