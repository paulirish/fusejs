  /*------------------------------- LANG: JSON -------------------------------*/

  fuse.jsonFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/;

  (function() {
    Obj.toJSON = function toJSON(value) {
      switch (typeof value) {
        case 'undefined':
        case 'function' :
        case 'unknown'  : return;
        case 'boolean'  : return fuse.String(value);
      }

      if (value === null) return fuse.String(null);
      var object = fuse.Object(value);
      if (typeof object.toJSON === 'function') return object.toJSON();
      if (isElement(value)) return;

      var results = [];
      eachKey(object, function(value, key) {
        value = Obj.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(fuse.String(key).toJSON() + ': ' + value);
      });
      return fuse.String('{' + results.join(', ') + '}');
    };

    fuse.Array.plugin.toJSON = function toJSON() {
      for (var value, i = 0, results = fuse.Array(), length = this.length; i < length; i++) {
        value = Obj.toJSON(this[i]);
        if (typeof value !== 'undefined') results.push(value);
      }
      return '[' + results.join(', ') + ']';
    };

    if (fuse.Hash)
      fuse.Hash.plugin.toJSON = function toJSON() {
        return Obj.toJSON(this._object);
      };

    // ECMA-5 15.9.5.44
    if (!fuse.Date.plugin.toJSON)
      fuse.Date.plugin.toJSON = function toJSON() {
        return fuse.String('"' + this.getUTCFullYear() + '-' +
          fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z"');
      };

    // ECMA-5 15.7.4.8
    if (!fuse.Number.plugin.toJSON)
      fuse.Number.plugin.toJSON = function toJSON() {
        return fuse.String(isFinite(this) ? this : 'null');
      };

    // ECMA-5 15.5.4.21
    if (!fuse.String.plugin.toJSON)
      fuse.String.plugin.toJSON = function toJSON() {
        return fuse.String(this).inspect(true);
      };

    // prevent JScript bug with named function expressions
    var toJSON = nil;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.plugin

  (function(plugin) {
    plugin.evalJSON = function evalJSON(sanitize) {
      if (this == null) throw new TypeError;
      var string = fuse.String(this), json = string.unfilterJSON();

      try {
        if (!sanitize || json.isJSON())
          return global.eval('(' + String(json) + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + string.inspect());
    };

    plugin.isJSON = function isJSON() {
      if (this == null) throw new TypeError;
      var string = String(this);
      if (/^\s*$/.test(string)) return false;

      string = string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string);
    };

    plugin.unfilterJSON = function unfilterJSON(filter) {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(filter || fuse.jsonFilter, '$1'));
    };

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  })(fuse.String.plugin);
