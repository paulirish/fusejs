  /*------------------------------ LANG: NUMBER ------------------------------*/

  (function() {
    Object._extend(Number.prototype, {
      'abs': function abs() {
        return Math.abs(this);
      },
  
      'ceil': function ceil() {
        return Math.ceil(this);
      },
  
      'floor': function floor() {
        return Math.floor(this);
      },
  
      'round': function round() {
        return Math.round(this);
      },
  
      'succ': function succ() {
        return this + 1;
      },
  
      'times': function times(callback, thisArg) {
        for (var i = 0, l = this; i < l; i++)
          callback.call(thisArg, i, i);
        return this;
      },
  
      'toColorPart': function toColorPart() {
        return this.toPaddedString(2, 16);
      },
  
      'toJSON': function toJSON() {
        return isFinite(this) ? this.toString() : 'null';
      },
  
      'toPaddedString': function toPaddedString(length, radix) {
        var string = this.toString(radix || 10);
        return '0'.times(length - string.length) + string;
      }
    });

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
  })();
