  /*------------------------------ LANG: NUMBER ------------------------------*/

  Object._extend(Number.prototype, (function() {
    function abs() {
      return Math.abs(this);
    }

    function ceil() {
      return Math.ceil(this);
    }

    function floor() {
      return Math.floor(this);
    }

    function round() {
      return Math.round(this);
    }

    function succ() {
      return this + 1;
    }

    function times(callback, thisArg) {
      for (var i = 0, l = this; i < l; i++)
        callback.call(thisArg, i, i);
      return this;
    }

    function toColorPart() {
      return this.toPaddedString(2, 16);
    }

    function toJSON() {
      return isFinite(this) ? this.toString() : 'null';
    }

    function toPaddedString(length, radix) {
      var string = this.toString(radix || 10);
      return '0'.times(length - string.length) + string;
    }

    return {
      'abs':            abs,
      'ceil':           ceil,
      'floor':          floor,
      'round':          round,
      'succ':           succ,
      'times':          times,
      'toColorPart':    toColorPart,
      'toJSON':         toJSON,
      'toPaddedString': toPaddedString
    };
  })());
