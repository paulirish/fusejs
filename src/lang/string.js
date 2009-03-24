  /*------------------------------ LANG: STRING ------------------------------*/

  Object._extend(String, (function() {
    function interpret(value) {
      return value == null ? '' : String(value);
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
      var result = __replace.call(this, pattern, replacement);
      if (Object.isRegExp(pattern)) pattern.lastIndex = 0;
      return result;
    }

    // For IE
    if (Bug('STRING_REPLACE_SETS_REGEXP_LAST_INDEX'))
      this.replace = replace;
  }).call(String.prototype);

  (function() {
    var __replace = this.replace;

    function replace(pattern, replacement) {
      if (typeof replacement !== 'function')
        return __replace.call(this, pattern, replacement);

      var isGlobal, match, source = this, result = '';
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)));

      pattern.lastIndex = 0;
      if (isGlobal = pattern.global)
        pattern = pattern.clone({ 'global': false });

      while (match = pattern.exec(source)) {
        result += source.slice(0, match.index) +
          replacement.apply(null, concatList(match, [match.index, source]));
        source = source.slice(match.index + match[0].length);

        if (isGlobal && !match[0]) {
          result += source.slice(0, 1);
          source  = source.slice(1);
          if (!source) {
            if (!match.index) result += replacement.apply(null, match);
            break;
          }
        }
        else if (!isGlobal) break;
      }
      pattern.lastIndex = 0;
      return result + source;
    }

    // For Safari 2, based on work by Dean Edwards
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (Bug('STRING_REPLACE_COHERSE_FUNCTION_TO_STRING'))
      this.replace = replace;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)) };
      var template = new Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)) };
    }

    this.gsub = function gsub(pattern, replacement) {
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)), 'g');
      if (!pattern.global)
        pattern = pattern.clone({ 'global': true });
      return this.replace(pattern, _prepareReplacement(replacement));
    };

    this.sub = function sub(pattern, replacement, count) {
      count = (typeof count === 'undefined') ? 1 : count;
      if (count === 1) {
        if (!Object.isRegExp(pattern))
          pattern = new RegExp(RegExp.escape(String(pattern)));
        if (pattern.global)
          pattern = pattern.clone({ 'global': false });
        return this.replace(pattern, _prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new Template(replacement);
        replacement = function(match) { return template.evaluate(match) };
      }
      return this.gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = null, sub = null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.interpolate = function interpolate(object, pattern) {
      return new Template(this, pattern).evaluate(object);
    };

    this.succ = function succ() {
      return this.slice(0, this.length - 1) +
        String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    };

    this.times = function times(count) {
      return count < 1 ? '' : new Array(count + 1).join(this);
    };

    this.toArray = function toArray() {
      return this.split('');
    };

    this.toQueryParams = function toQueryParams(separator) {
      var hash = { }, match = this.strip().match(/([^?#]*)(#.*)?$/);
      if (!match) return hash;

      var pair, key, value, i = 0,
       pairs = match[1].split(separator || '&'), length = pairs.length;

      for ( ; i < length; i++) {
        if (!(pair = pairs[i].split('='))[0]) continue;
        key = decodeURIComponent(pair.shift());
        value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != null) value = decodeURIComponent(value);

        if (Object.hasKey(hash, key)) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    };

    // alias
    this.parseQuery = this.toQueryParams;

    // prevent JScript bug with named function expressions
    var interpolate = null,
     succ =           null,
     times =          null, 
     toArray =        null,
     toQueryParams =  null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

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

    this.toJSON = function toJSON() {
      return this.inspect(true);
    };

    this.unfilterJSON = function unfilterJSON(filter) {
      return this.sub(filter || Fuse.JSONFilter, '#{1}');
    };

    // prevent JScript bug with named function expressions
    var evalJSON =  null,
     isJSON =       null,
     toJSON =       null,
     unfilterJSON = null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.blank = function blank() {
      return /^\s*$/.test(this);
    };

    this.empty = function empty() {
      return !this.length;
    };

    this.endsWith = function endsWith(pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    };

    this.include = function include(pattern) {
      return this.indexOf(pattern) > -1;
    };

    this.inspect = function inspect(useDoubleQuotes) {
      var escapedString = this.replace(/[\x00-\x1f\\]/g, function(match) {
        var character = String.specialChar[match];
        return character ? character : '\\u00' + match.charCodeAt().toPaddedString(2, 16);
      });
      if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
      return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    };

    this.scan = function scan(pattern, callback) {
      this.gsub(pattern, callback);
      return String(this);
    };

    this.startsWith = function startsWith(pattern) {
      return this.indexOf(pattern) === 0;
    };

    // prevent JScript bug with named function expressions
    var blank =    null,
      empty =      null,
      endsWith =   null,
      include =    null,
      inspect =    null,
      scan =       null,
      startsWith = null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.camelize = (function() {
      function _replacer(match, captured) {
        return captured.toUpperCase();
      }
      function camelize() {
        return this.replace(/\-(\w|$)/g, _replacer);
      }
      return camelize;
    })();

    this.capitalize = function capitalize() {
      return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    };

    this.dasherize = function dasherize() {
      return this.replace(/_/g,'-');
    };

    this.truncate = function truncate(length, truncation) {
      length = length || 30;
      truncation = (typeof truncation === 'undefined') ? '...' : truncation;
      return this.length > length ? 
        this.slice(0, length - truncation.length) + truncation : String(this);
    };

    this.underscore = function underscore() {
      return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g,'_').toLowerCase();
    };

    // prevent JScript bug with named function expressions
    var capitalize = null,
     dasherize =     null,
     truncate =      null,
     underscore =    null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    var s = RegExp.specialChar.s,
     matchTrimLeft     = new RegExp('^' + s + '+'),
     matchTrimRight    = new RegExp(s + '+$'),
     matchScripts      = new RegExp(Fuse.ScriptFragment, 'gi'),
     matchHTMLComments = new RegExp('<!--' + s + '*' + Fuse.ScriptFragment + s + '*-->', 'gi'),
     matchOpenTag      = /<script/i;

    this.extractScripts = function extractScripts() {
      if (!matchOpenTag.test(this)) return [];
      var match, results = [], scriptTags = this.replace(matchHTMLComments, '');
      while (match = matchScripts.exec(scriptTags))
        match[1] && results.push(match[1]);
      return results;
    };

    this.strip = (function() {
      function strip() {
        return this.replace(matchTrimLeft, '').replace(matchTrimRight, '');
      }
      return this.trim || strip;
    }).call(this);

    this.stripScripts = function stripScripts() {
      return this.replace(matchScripts, '');
    };

    // prevent JScript bug with named function expressions
    var extractScripts = null, stripScripts = null;
  }).call(String.prototype);

  (function() {
    this.evalScripts = function evalScripts() {
      return this.extractScripts().map(function(script) { return eval(script) });
    };

    this.stripTags = function stripTags() {
      return this.replace(/<("[^"]*"|'[^']*'|[^'">])+>/g, '');
    };

    // prevent JScript bug with named function expressions
    var evalScripts = null, stripTags = null;
  }).call(String.prototype);

  /*--------------------------------------------------------------------------*/

  (function() {
    var container = Fuse._doc.createElement('pre'),
     textNode = container.appendChild(Fuse._doc.createTextNode(''));

    // Safari 2.x has issues with escaping html inside a "pre"
    // element so we use the deprecated "xmp" element instead.
    if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
      container = Fuse._doc.createElement('xmp');
      textNode = container.appendChild(Fuse._doc.createTextNode(''));
    }

    var escapeHTML = (function() {
      function escapeHTML() {
        textNode.data = this;
        return container.innerHTML.replace(/"/g, '&quot;');
      }
      return escapeHTML;
    })();

    var unescapeHTML = (function() {
      function unescapeHTML() {
        Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
        return Fuse._div.textContent;
      };
      return unescapeHTML;
    })();

    // Safari 3.x has issues with escaping the ">" character
    if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
      escapeHTML = function escapeHTML() {
        textNode.data = this;
        return container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;');
      };
    }

    if (!Feature('ELEMENT_TEXT_CONTENT')) {
      Fuse._div.innerHTML = '<pre>&lt;span&gt;test&lt;/span&gt;</pre>';
      if (Feature('ELEMENT_INNER_TEXT') && Fuse._div.firstChild.innerText === '<span>test</span>') {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse._div.firstChild.innerText.replace(/\r/g, '');
        };
      }
      else if (Fuse._div.firstChild.innerHTML === '<span>test</span>') {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse._div.firstChild.innerHTML;
        };
      } else {
        unescapeHTML = function unescapeHTML() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          var node, i = 0, results = [];
          while (node = Fuse._div.firstChild.childNodes[i++])
            results.push(node.nodeValue);
          return results.join('');
        };
      }
      // cleanup Fuse._div
      Fuse._div.innerHTML = '';
    }

    this.escapeHTML = escapeHTML;
    this.unescapeHTML = unescapeHTML;
  }).call(String.prototype);
