  /*----------------------------- LANG: INSPECT ------------------------------*/

  inspect =
  Obj.inspect = function inspect(value) {
    if (value != null) {
      var object = Fuse.Object(value);
      if (typeof object.inspect === 'function')
        return object.inspect();

      // Attempt to avoid inspecting DOM nodes.
      // IE treats nodes like objects:
      // IE7 and below are missing the node's constructor property
      // IE8 node constructors are typeof "object"
      try {
        var string = toString.call(object), constructor = object.constructor;
        if (string === '[object Object]' && constructor && typeof constructor !== 'object') {
          var results = [];
          eachKey(object, function(value, key) {
            hasKey(object, key) &&
              results.push(Fuse.String(key).inspect() + ': ' + inspect(object[key]));
          });
          return Fuse.String('{' + results.join(', ') + '}');
        }
      } catch (e) { }
    }

    // try coercing to string
    try {
      return Fuse.String(value);
    } catch (e) {
      // probably caused by having the `toString` of an object call inspect()
      if (e.constructor === global.RangeError)
        return Fuse.String('...');
      throw e;
    }
  };

  /*--------------------------------------------------------------------------*/

  (function(__inspect) {

    Fuse.Array.plugin.inspect = function inspect() {
      if (this == null) throw new TypeError;
      var i = 0, results = result = [], object = Object(this),
       length = object.length >>> 0;

      while (length--) results[length] = __inspect(object[length]);
      return '[' + results.join(', ') + ']';
    };

    Fuse.String.plugin.inspect = (function() {
      var specialChar = {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\\': '\\\\',
        '"' : '\\"',
        "'" : "\\'"
      },

      // charCodes 0-31 and \ and '
      matchWithSingleQuotes = /[\x00-\x1f\\']/g,

      // charCodes 0-31 and \ and "
      matchWithDoubleQuotes = /[\x00-\x1f\\"]/g;

      function escapeSpecialChars(match) {
        var character = specialChar[match];
        if (!character) {
          character = match.charCodeAt(0).toString(16);
          character = '\\u00' + (character.length === 1 ? '0' : '') + character;
        }
        return character;
      }

      function inspect(useDoubleQuotes) {
        if (this == null) throw new TypeError;
        var string = Fuse.String(this);
        return Fuse.String(useDoubleQuotes
          ? '"' + string.replace(matchWithDoubleQuotes, escapeSpecialChars) + '"'
          : "'" + string.replace(matchWithSingleQuotes, escapeSpecialChars) + "'");
      }

      return inspect;
    })();

    if (Fuse.Enumerable)
      Fuse.Enumerable.plugin.inspect =
        function inspect() { return '#<Enumerable:' + this.toList().inspect() + '>' };

    if (Fuse.Hash)
      Fuse.Hash.plugin.inspect = function inspect() {
        var pair, i = 0, pairs = this._pairs, results = [];
        while (pair = pairs[i])
          results[i++] = pair[0].inspect() + ': ' + __inspect(pair[1]);
        return '#<Hash:{' + results.join(', ') + '}>';
      };

    if (global.Element && global.Element.Methods)
      Element.Methods.inspect = function inspect(element) {
        element = $(element);
        var attribute, property, value,
         result = '<' + element.nodeName.toLowerCase(),
         translation = { 'id': 'id', 'className': 'class' };

        for (property in translation) {
          attribute = translation[property];
          value = element[property] || '';
          if (value) result += ' ' + attribute + '=' + Fuse.String(value).inspect(true);
        }
        return Fuse.String(result + '>');
      };

    if (global.Event && global.Event.Methods)
      Event.Methods.inspect = function inspect() { return '[object Event]' };

    // prevent JScript bug with named function expressions
    var inspect = null;
  })(inspect);
