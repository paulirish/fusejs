  /*------------------------------ LANG: STRING ------------------------------*/

  Fuse.Object._extend(Fuse.String, (function() {
    function interpret(value) {
      return Fuse.String(value == null ? '' : value);
    }

    return {
      'specialChar': {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\\': '\\\\'
      },
      'interpret': interpret
    };
  })());

  /*--------------------------------------------------------------------------*/

  (function() {
    var __replace = this.replace;

    function replace(pattern, replacement) {
      if (typeof replacement === 'function') {
        var _replacement = replacement;
        replacement = function() {
          // ensure `null` and `undefined` are returned
          var result = _replacement.apply(global, arguments);
          return result || Fuse.String(result);
        };
      }
      var result = __replace.call(this, pattern, replacement);
      if (Fuse.Object.isRegExp(pattern)) pattern.lastIndex = 0;
      return result;
    }

    // For IE
    if (Bug('STRING_REPLACE_SETS_REGEXP_LAST_INDEX'))
      this.replace = replace;
  }).call(Fuse.String.Plugin);

  // ECMA-5 15.5.4.11
  (function() {
    var __replace = this.replace,
     exec = RegExp.prototype.exec;

    function replace(pattern, replacement) {
      if (typeof replacement !== 'function')
        return __replace.call(this, pattern, replacement);

      if (this == null) throw new TypeError;

      if (!Fuse.Object.isRegExp(pattern))
        pattern = new RegExp(Fuse.RegExp.escape(pattern));

      // set pattern.lastIndex to 0 before we perform string operations
      var match, index = 0, nonGlobal = !pattern.global,
       lastIndex = pattern.lastIndex = 0,
       result = '', source = String(this),
       srcLength = source.length;

      while (match = exec.call(pattern, source)) {
        index = match.index;
        result += source.slice(lastIndex, index);

        // set lastIndex before replacement call to avoid potential
        // pattern.lastIndex tampering
        lastIndex = pattern.lastIndex;
        result += replacement.apply(global, concatList(match, [index, source]));

        if (nonGlobal) {
          pattern.lastIndex = lastIndex = index + match[0].length;
          break;
        }
        // handle empty pattern matches like /()/g
        if (lastIndex === index) {
          if (lastIndex === srcLength) break;
          result += source.charAt(lastIndex++);
        }
        pattern.lastIndex = lastIndex;
      }

      // append the remaining source to the result
      if (lastIndex < srcLength)
        result += source.slice(lastIndex, srcLength);

      return Fuse.String(result);
    }

    // primarily for Safari 2.0.2 and lower, based on work by Dean Edwards
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (Bug('STRING_REPLACE_COHERSE_FUNCTION_TO_STRING'))
      this.replace = replace;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)) };
      var template = new Fuse.Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)) };
    }

    this.gsub = function gsub(pattern, replacement) {
      if (this == null) throw new TypeError;

      if (!Fuse.Object.isRegExp(pattern))
        pattern = Fuse.RegExp(Fuse.RegExp.escape(pattern), 'g');
      if (!pattern.global)
        pattern = Fuse.RegExp.clone(pattern, { 'global': true });
      return this.replace(pattern, _prepareReplacement(replacement));
    };

    this.sub = function sub(pattern, replacement, count) {
      if (this == null) throw new TypeError;

      count = (typeof count === 'undefined') ? 1 : count;
      if (count === 1) {
        if (!Fuse.Object.isRegExp(pattern))
          pattern = Fuse.RegExp(Fuse.RegExp.escape(pattern));
        if (pattern.global)
          pattern = Fuse.RegExp.clone(pattern, { 'global': false });
        return this.replace(pattern, _prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new Fuse.Template(replacement);
        replacement = function(match) { return template.evaluate(match) };
      }
      return this.gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = null, sub = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.interpolate = function interpolate(object, pattern) {
      if (this == null) throw new TypeError;
      return new Fuse.Template(this, pattern).evaluate(object);
    };

    this.succ = function succ() {
      if (this == null) throw new TypeError;
      return Fuse.String(this.slice(0, this.length - 1) +
        String.fromCharCode(this.charCodeAt(this.length - 1) + 1));
    };

    this.times = function times(count) {
      if (this == null) throw new TypeError;
      return Fuse.String(count < 1 ? '' : new Array(count + 1).join(this));
    };

    this.toArray = function toArray() {
      if (this == null) throw new TypeError;
      return Fuse.String(this).split('');
    };

    this.toQueryParams = function toQueryParams(separator) {
      if (this == null) throw new TypeError;
      var match = String(this).split('?'), object = Fuse.Object();
      if (match.length > 1 && !match[1]) return object;

      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);
      if (!match) return object;

      var pair, key, value, undef, index, i = 0,
       pairs = match.split(separator || '&'), length = pairs.length;

      for ( ; i < length; i++) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (!pair || index == 0) continue;

        if (index != -1) {
          key = decodeURIComponent(pair.slice(0, index));
          value = pair.slice(index + 1);
          if (value) value = decodeURIComponent(value);
        } else key = pair;

        if (Fuse.Object.hasKey(object, key)) {
          if (!Fuse.List.isArray(object[key])) object[key] = [object[key]];
          object[key].push(value);
        }
        else object[key] = value;
      }
      return object;
    };

    // aliases
    this.toList = this.toArray;
    this.parseQuery = this.toQueryParams;

    // prevent JScript bug with named function expressions
    var interpolate = null,
     succ =           null,
     times =          null,
     toArray =        null,
     toQueryParams =  null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.blank = function blank() {
      if (this == null) throw new TypeError;
      return /^\s*$/.test(this);
    };

    this.contains = function contains(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) > -1;
    };

    this.empty = function empty() {
      if (this == null) throw new TypeError;
      return !String(this).length;
    };

    this.endsWith = function endsWith(pattern) {
      if (this == null) throw new TypeError;
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.lastIndexOf(pattern) == d;
    };

    this.inspect = function inspect(useDoubleQuotes) {
      if (this == null) throw new TypeError;

      var escapedString = Fuse.String(this).replace(/[\x00-\x1f\\]/g, function(match) {
        var character = Fuse.String.specialChar[match];
        return character ?
          character :
          '\\u00' + Fuse.Number(match.charCodeAt(0)).toPaddedString(2, 16);
      });
      return Fuse.String(useDoubleQuotes
        ? '"' + escapedString.replace(/"/g, '\\"')  + '"'
        : "'" + escapedString.replace(/'/g, '\\\'') + "'");
    };

    // ECMA-5 15.5.4.8
    // TODO: try to optimize
    if (!this.lastIndexOf)
      this.lastIndexOf = function lastIndexOf(searchString) {
        if (this == null) throw new TypeError;
        searchString = String(searchString);

        var string = String(this),
         pos = 1 * arguments[1], // fast coerce to number
         len = string.length,
         searchLen = searchString.length;

        if (searchLen > len) return Fuse.Number(-1);
        if (isNaN(pos)) pos = Infinity;
        if (pos < 0)    pos = 0;
        if (pos > len)  pos = len;
        if (pos > len - searchLen) pos = len - searchLen;

        pos++;
        while (pos--)
          if (string.slice(pos, pos + searchLen) === searchString)
            return Fuse.Number(pos);
        return Fuse.Number(-1);
      };

    this.scan = function scan(pattern, callback) {
      if (this == null) throw new TypeError;
      Fuse.String(this).gsub(pattern, callback); // gsub for backcompat
      return Fuse.String(this);
    };

    this.startsWith = function startsWith(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) == 0;
    };

    // prevent JScript bug with named function expressions
    var blank =     null,
      contains =    null,
      empty =       null,
      endsWith =    null,
      inspect =     null,
      lastIndexOf = null,
      scan =        null,
      startsWith =  null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.camelize = (function() {
      function _replacer(match, captured) {
        return captured.toUpperCase();
      }

      function camelize() {
        if (this == null) throw new TypeError;
        return Fuse.String(this).replace(/\-(\w|$)/g, _replacer);
      }
      return camelize;
    })();

    this.capitalize = function capitalize() {
      if (this == null) throw new TypeError;
      var string = String(this);
      return Fuse.String(string.charAt(0).toUpperCase() + string.slice(1).toLowerCase());
    };

    this.hyphenate = function hyphenate() {
      if (this == null) throw new TypeError;
      return Fuse.String(String(this).replace(/_/g,'-'));
    };

    this.truncate = function truncate(length, truncation) {
      if (this == null) throw new TypeError;
      var string = String(this);

      length = length || 30;
      truncation = (typeof truncation === 'undefined') ? '...' : truncation;
      return Fuse.String(string.length > length
        ? string.slice(0, length - truncation.length) + truncation
        : string);
    };

    this.underscore = function underscore() {
      if (this == null) throw new TypeError;
      return Fuse.String(String(this).replace(/::/g, '/')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .replace(/-/g,'_').toLowerCase());
    };

    // prevent JScript bug with named function expressions
    var capitalize = null,
     hyphenate =     null,
     truncate =      null,
     underscore =    null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    var matchScripts   = RegExp(Fuse.ScriptFragment, 'gi'),
     matchHTMLComments = Fuse.RegExp('<!--\\s*' + Fuse.ScriptFragment + '\\s*-->', 'gi'),
     matchOpenTag      = /<script/i;

    this.evalScripts = function evalScripts() {
      if (this == null) throw new TypeError;
      return Fuse.String(this).extractScripts().map(function(script) {
        return global.eval(String(script));
      });
    };

    this.extractScripts = function extractScripts() {
      if (this == null) throw new TypeError;
      var string = Fuse.String(this), results = Fuse.List();

      if (!matchOpenTag.test(string)) return results;
      var match, scriptTags = string.replace(matchHTMLComments, '');
      while (match = matchScripts.exec(scriptTags))
        match[1] && results.push(match[1]);
      return results;
    };

    this.stripScripts = function stripScripts() {
      if (this == null) throw new TypeError;
      return Fuse.String(this).replace(matchScripts, '');
    };

    // prevent JScript bug with named function expressions
    var evalScripts = null, extractScripts = null, stripScripts = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    var sMap = Fuse.RegExp.specialCharMap.s;

    // ECMA-5 15.5.4.20
    if (!this.trim)
      this.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return Fuse.String(string);
        while (sMap[string.charAt(++start)]);
        if (start === end) return Fuse.String('');

        while (sMap[string.charAt(--end)]);
        return Fuse.String(string.slice(start, end + 1));
      };

    // non-standard
    if (!this.trimLeft)
      this.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return Fuse.String(string);
        while (sMap[string.charAt(++start)]);
        return Fuse.String(string.slice(start));
      };

    if (!this.trimRight)
      this.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return Fuse.String(string);
        while (sMap[string.charAt(--end)]);
        return Fuse.String(string.slice(0, end + 1));
      };

    // prevent JScript bug with named function expressions
    var trim = null, trimLeft = null, trimRight = null;
  }).call(Fuse.String.Plugin);

  /*--------------------------------------------------------------------------*/

  // Information on parsing tags can be found at
  // http://www.w3.org/TR/REC-xml-names/#ns-using
  Fuse.String.Plugin.stripTags = (function() {
    var matchTags = (function() {
      var name   = '\\w+',
       space     = '[\\x20\\x09\\x0D\\x0A]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })();

    function stripTags() {
      if (this == null) throw new TypeError;
      return Fuse.String(String(this).replace(matchTags, ''));
    }
    return stripTags;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    var escapeHTML = function escapeHTML() {
      if (this == null) throw new TypeError;
      textNode.data = String(this);
      return Fuse.String(container.innerHTML.replace(/"/g, '&quot;'));
    };

    var unescapeHTML = function unescapeHTML() {
      if (this == null) throw new TypeError;
      Fuse._div.innerHTML = '<pre>' + proto.stripTags.call(this) + '</pre>';
      return Fuse.String(Fuse._div.textContent);
    };

    var proto  = Fuse.String.prototype,
     container = Fuse._doc.createElement('pre'),
     textNode  = container.appendChild(Fuse._doc.createTextNode(''));

    // Safari 2.x has issues with escaping html inside a "pre"
    // element so we use the deprecated "xmp" element instead.
    if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
      container = Fuse._doc.createElement('xmp');
      textNode = container.appendChild(Fuse._doc.createTextNode(''));
    }

    // Safari 3.x has issues with escaping the ">" character
    if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
      escapeHTML = function escapeHTML() {
        if (this == null) throw new TypeError;
        textNode.data = String(this);
        return Fuse.String(container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;'));
      };
    }

    if (!Feature('ELEMENT_TEXT_CONTENT')) {
      Fuse._div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;</pre>';
      if (Feature('ELEMENT_INNER_TEXT') && Fuse._div.firstChild.innerText === '<p>x</p>') {
        unescapeHTML = function unescapeHTML() {
          if (this == null) throw new TypeError;
          Fuse._div.innerHTML = '<pre>' + proto.stripTags.call(this) + '</pre>';
          return Fuse.String(Fuse._div.firstChild.innerText.replace(/\r/g, ''));
        };
      }
      else if (Fuse._div.firstChild.innerHTML === '<p>x</p>') {
        unescapeHTML = function unescapeHTML() {
          if (this == null) throw new TypeError;
          Fuse._div.innerHTML = '<pre>' + proto.stripTags.call(this) + '</pre>';
          return Fuse.String(Fuse._div.firstChild.innerHTML);
        };
      } else {
        unescapeHTML = function unescapeHTML() {
          if (this == null) throw new TypeError;
          Fuse._div.innerHTML = '<pre>' + proto.stripTags.call(this) + '</pre>';
          var node, i = 0, results = [];
          while (node = Fuse._div.firstChild.childNodes[i++])
            results.push(node.nodeValue);
          return Fuse.String(results.join(''));
        };
      }
      // cleanup Fuse._div
      Fuse._div.innerHTML = '';
    }

    this.escapeHTML = escapeHTML;
    this.unescapeHTML = unescapeHTML;
  }).call(Fuse.String.Plugin);
