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

    // Fuse.Object.inspect
    Obj.inspect = function inspect(value) {
      if (value != null) {
        var object = Fuse.Object(value);
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


    /*------------------------------------------------------------------------*/


    // Fuse.Array#inspect
    (function(plugin) {
      function inspect() {
        if (this == null) throw new TypeError;

        // called Obj.inspect(Fuse.Array.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally Fuse.Array(...).inspect()
        var i = 0, results = result = [], object = Object(this),
         length = object.length >>> 0;

        while (length--) results[length] = inspectObject(object[length]);
        return Fuse.String('[' + results.join(', ') + ']');
      }

      plugin.inspect = inspect;
    })(Fuse.Array.plugin);


    // Fuse.String#inspect
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

        // called Obj.inspect(Fuse.String.plugin)
        if (this === plugin) return inspectPlugin(plugin);

        // called normally Fuse.String(...).inspect()
        var string = Fuse.String(this);
        return Fuse.String(useDoubleQuotes
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

      // set Fuse.String.plugin.inspect and return a reference
      return (plugin.inspect = inspect);
    })(Fuse.String.plugin);


    // Fuse.Enumerable#inspect
    if (Fuse.Enumerable)
    (function(plugin) {
      function inspect() {
        // called normally or called Obj.inspect(Fuse.Enumerable.plugin)
        return isFunction(this._each)
          ? Fuse.String('#<Enumerable:' + this.toList().inspect() + '>')
          : inspectPlugin(plugin);
      }

      plugin.inspect = inspect;
    })(Fuse.Enumerable.plugin);


    // Fuse.Hash#inspect
    if (Fuse.Hash)
    (function(plugin) {
      function inspect() {
        // called Obj.inspect(Fuse.Hash.plugin)
        if (this === plugin)
          return inspectPlugin(plugin);

        // called normally Fuse.Hash(...).inspect()
        var pair, i = 0, pairs = this._pairs, result = [];
        while (pair = pairs[i])
          result[i++] = pair[0].inspect() + ': ' + inspectObject(pair[1]);
        return '#<Hash:{' + result.join(', ') + '}>';
      }

      plugin.inspect = inspect;
    })(Fuse.Hash.plugin);


    // Element#inspect
    if (global.Element && global.Element.Methods)
    (function(proto, methods) {
      function inspect(element) {
        // called methodized Obj.inspect(Element.prototype || HTMLElement.prototype)
        if (element === proto)
          return inspectPlugin(proto);

        // called normally Element.inspect(element)
        if (element = $(element)) {
          var attribute, property, value,
           result = '<' + element.nodeName.toLowerCase(),
           translation = { 'id': 'id', 'className': 'class' };

          for (property in translation) {
            attribute = translation[property];
            value = element[property] || '';
            if (value) result += ' ' + attribute + '=' + Fuse.String(value).inspect(true);
          }
          return Fuse.String(result + '>');
        }

        // called Obj.inspect(Element) or Obj.inspect(Element.Methods);
        if (this === methods || this === Element)
          return inspectPlugin(this);
      }

      methods.inspect = inspect;
    })(Feature('HTML_ELEMENT_CLASS') && global.HTMLElement.prototype ||
       Feature('ELEMENT_CLASS') && global.Element.prototype,
       Element.Methods);


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
