  /*------------------------------- LANG: JSON -------------------------------*/

  (function() {
    Fuse.Hash.Plugin.toJSON = function toJSON() {
      return Obj.toJSON(this._object);
    };

    Fuse.List.Plugin.toJSON = function toJSON() {
      for (var value, i = 0, results = Fuse.List(), length = this.length; i < length; i++) {
        value = Obj.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    Obj.toJSON = function toJSON(value) {
      switch (typeof value) {
        case 'undefined':
        case 'function' :
        case 'unknown'  : return;
        case 'boolean'  : return Fuse.String(value);
      }

      if (value === null) return Fuse.String(null);
      var object = Fuse.Object(value);
      if (typeof object.toJSON === 'function') return object.toJSON();
      if (isElement(value)) return;

      var results = [];
      eachKey(object, function(value, key) {
        value = Obj.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(Fuse.String(key).toJSON() + ': ' + value);
      });
      return Fuse.String('{' + results.join(', ') + '}');
    };

    // ECMA-5 15.9.5.44
    if (!Fuse.Date.Plugin.toJSON)
      Fuse.Date.Plugin.toJSON = function toJSON() {
        return Fuse.String('"' + this.getUTCFullYear() + '-' +
          Fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z"');
      };

    // ECMA-5 15.7.4.8
    if (!Fuse.Number.Plugin.toJSON)
      Fuse.Number.Plugin.toJSON = function toJSON() {
        return Fuse.String(isFinite(this) ? this : 'null');
      };

    // ECMA-5 15.5.4.21
    if (!Fuse.String.Plugin.toJSON)
      Fuse.String.Plugin.toJSON = function toJSON() {
        return Fuse.String(this).inspect(true);
      };

    // prevent JScript bug with named function expressions
    var toJSON = null;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.Plugin
  (function(proto) {
    proto.evalJSON = function evalJSON(sanitize) {
      if (this == null) throw new TypeError;
      var string = Fuse.String(this), json = string.unfilterJSON();

      try {
        if (!sanitize || json.isJSON())
          return global.eval('(' + String(json) + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + string.inspect());
    };

    proto.isJSON = function isJSON() {
      if (this == null) throw new TypeError;
      var string = String(this);
      if (/^\s*$/.test(string)) return false;

      string = string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string);
    };

    proto.unfilterJSON = function unfilterJSON(filter) {
      if (this == null) throw new TypeError;
      return Fuse.String(String(this).replace(filter || Fuse.JSONFilter, '$1'));
    };

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  })(Fuse.String.Plugin);
