  /*------------------------------- LANG: JSON -------------------------------*/

  (function() {
    Fuse.Hash.Plugin.toJSON = function toJSON() {
      return Fuse.Object.toJSON(this.toObject());
    };

    Fuse.List.Plugin.toJSON = function toJSON() {
      for (var value, i = 0, results = Fuse.List(), length = this.length; i < length; i++) {
        value = Fuse.Object.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    Fuse.Object.toJSON = function toJSON(object) {
      switch (typeof object) {
        case 'undefined':
        case 'function' :
        case 'unknown'  : return;
        case 'boolean'  : return Fuse.String(object);
      }

      if (Fuse.Object.isElement(object)) return;
      if (object === null) return Fuse.String(null);
      if (typeof object.toJSON === 'function') return object.toJSON();

      var results = [];
      Fuse.Object._each(object, function(value, key) {
        value = Fuse.Object.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(key.toJSON() + ': ' + value);
      });
      return Fuse.String('{' + results.join(', ') + '}');
    };

    // ECMA-5 15.9.5.44
    Fuse.Date.Plugin.toJSON = Fuse.Date.Plugin.toJSON ||
      function toJSON() {
        return Fuse.String('"' + this.getUTCFullYear() + '-' +
          Fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z"');
      };

    // ECMA-5 15.7.4.8
    Fuse.Number.Plugin.toJSON = Fuse.Number.Plugin.toJSON ||
      function toJSON() {
        return Fuse.String(isFinite(this) ? this : 'null');
      };

    // ECMA-5 15.5.4.21
    Fuse.String.Plugin.toJSON = Fuse.String.Plugin.toJSON ||
      function toJSON() {
        return this.inspect(true);
      };

    // prevent JScript bug with named function expressions
    var toJSON = null;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.Plugin
  (function() {
    this.evalJSON = function evalJSON(sanitize) {
      var json = this.unfilterJSON();
      try {
        if (!sanitize || json.isJSON()) return eval('(' + json + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    };

    this.isJSON = function isJSON() {
      var str = this;
      if (str.blank()) return false;
      str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
    };

    this.unfilterJSON = function unfilterJSON(filter) {
      return this.sub(filter || Fuse.JSONFilter, '#{1}');
    };

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  }).call(Fuse.String.Plugin);
