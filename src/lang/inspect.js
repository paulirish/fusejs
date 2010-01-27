  /*----------------------------- LANG: INSPECT ------------------------------*/

  (function() {
    var inspectObject, inspectString;

    function inspectPlugin(plugin) {
      var backup, result;
      backup = plugin.inspect;
      plugin.inspect = expando;

      result = inspectObject(plugin).replace(expando, String(backup));
      plugin.inspect = backup;
      return result;
    }


    // used by the framework closure
    inspect =

    // used by this closure only
    inspectObject =

    // fuse.Object.inspect
    Obj.inspect = function inspect(value) {
      if (value != null) {
        var object = fuse.Object(value);
        if (isFunction(object.inspect))
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
                results.push(inspectString.call(key) + ': ' + inspect(object[key]));
            });
            return fuse.String('{' + results.join(', ') + '}');
          }
        } catch (e) { }
      }

      // try coercing to string
      try {
        return fuse.String(value);
      } catch (e) {
        // probably caused by having the `toString` of an object call inspect()
        if (e.constructor === global.RangeError)
          return fuse.String('...');
        throw e;
      }
    };


    /*------------------------------------------------------------------------*/


    // fuse.Array#inspect
    (function(plugin) {
      function inspect() {
        if (this == null) throw new TypeError;

        // called Obj.inspect(fuse.Array.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally fuse.Array(...).inspect()
        var i = 0, results = result = [], object = Object(this),
         length = object.length >>> 0;

        while (length--) results[length] = inspectObject(object[length]);
        return fuse.String('[' + results.join(', ') + ']');
      }

      plugin.inspect = inspect;
    })(fuse.Array.plugin);


    // fuse.String#inspect
    inspectString = (function(plugin) {
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

        // called Obj.inspect(fuse.String.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally fuse.String(...).inspect()
        var string = fuse.String(this);
        return fuse.String(useDoubleQuotes
          ? '"' + string.replace(matchWithDoubleQuotes, escapeSpecialChars) + '"'
          : "'" + string.replace(matchWithSingleQuotes, escapeSpecialChars) + "'");
      }

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

      // set fuse.String.plugin.inspect and return a reference
      return (plugin.inspect = inspect);
    })(fuse.String.plugin);


    // fuse.Enumerable#inspect
    if (Enumerable)
    (function() {
      function inspect() {
        // called normally or called Obj.inspect(fuse.Enumerable)
        return isFunction(this._each)
          ? fuse.String('#<Enumerable:' + this.toArray().inspect() + '>')
          : inspectPlugin(fuse.Enumerable);
      }

      Enumerable.inspect = inspect;
    })();


    // fuse.Hash#inspect
    if (fuse.Hash)
    (function(plugin) {
      function inspect() {
        // called Obj.inspect(fuse.Hash.plugin)
        if (this === plugin)
          return inspectPlugin(plugin);

        // called normally fuse.Hash(...).inspect()
        var pair, i = 0, pairs = this._pairs, result = [];
        while (pair = pairs[i])
          result[i++] = pair[0].inspect() + ': ' + inspectObject(pair[1]);
        return '#<Hash:{' + result.join(', ') + '}>';
      }

      plugin.inspect = inspect;
    })(fuse.Hash.plugin);


    // Element#inspect
    if (Element)
    (function(plugin) {
      function inspect() {
        // called Obj.inspect(Element.plugin) or Obj.inspect(Element)
        if (this === plugin || this === Element)
          return inspectPlugin(this);

        // called normally Element.inspect(element)
        var attribute, property, value,
         element     = this.raw || this,
         result      = '<' + element.nodeName.toLowerCase(),
         translation = { 'id': 'id', 'className': 'class' };

        for (property in translation) {
          attribute = translation[property];
          value = element[property] || '';
          if (value) result += ' ' + attribute + '=' + fuse.String(value).inspect(true);
        }
        return fuse.String(result + '>');
      }

      plugin.inspect = inspect;
    })(Element.plugin);


    // Event#inspect
    if (global.Event && global.Event.Methods)
    (function(proto, methods) {
      function inspect(event) {
        // called methodized Obj.inspect(Event.prototype) or
        // called normally Event.inspect(event)
        if (event) return event === proto
          ? inspectPlugin(proto)
          : '[object Event]';

        // called Obj.inspect(Element.Methods)
        if (this === methods)
          return inspectPlugin(methods);
      }

      methods.inspect = inspect;
    })(Event.prototype, Event.Methods);

  })();
