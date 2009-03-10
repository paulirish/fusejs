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
    var __replace = String.prototype.replace;

    function _prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)) };
      var template = new Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)) };
    }

    function gsub(pattern, replacement) {
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)), 'g');
      if (!pattern.global)
        pattern = pattern.clone({ 'global': true });
      return this.replace(pattern, _prepareReplacement(replacement));
    }

    function interpolate(object, pattern) {
      return new Template(this, pattern).evaluate(object);
    }

    // based on work by Dean Edwards
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    function replace(pattern, replacement) {
      if (typeof replacement !== 'function')
        return __replace.call(this, pattern, replacement);

      var match, global, source = this, result = '';
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)));
      if (global = pattern.global)
        pattern = pattern.clone({ 'global': false });

      while (match = pattern.exec(source)) {
        result += source.slice(0, match.index) +
          replacement.apply(null, concatList(match, [match.index, source]));
        source = source.slice(match.index + match[0].length);

        if (global && !match[0]) {
          result += source.slice(0, 1);
          source  = source.slice(1);
          if (!source) {
            if (!match.index) result +=
              replacement.apply(null, concatList(match, [match.index, source]));
            break;
          }
        }
        else if (!global) break;
      }
      return result + source;
    }

    function sub(pattern, replacement, count) {
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
    }
    
    if (Bug('STRING_REPLACE_COHERSE_FUNCTION_TO_STRING'))
      String.prototype.replace = replace;

    Object._extend(String.prototype, {
      'gsub':        gsub,
      'interpolate': interpolate,
      'sub':         sub
    });
  })();

  /*--------------------------------------------------------------------------*/

  Object._extend(String.prototype, (function() {
    function succ() {
      return this.slice(0, this.length - 1) +
        String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    }

    function times(count) {
      return count < 1 ? '' : new Array(count + 1).join(this);
    }

    function toArray() {
      return this.split('');
    }

    function toQueryParams(separator) {
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
    }

    return {
      'parseQuery':    toQueryParams,
      'succ':          succ,
      'times':         times, 
      'toArray':       toArray,
      'toQueryParams': toQueryParams
    };
  })());

  /*--------------------------------------------------------------------------*/
    
  Object._extend(String.prototype, (function() {
    function evalJSON(sanitize) {
      var json = this.unfilterJSON();
      try {
        if (!sanitize || json.isJSON()) return eval('(' + json + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    }

    function isJSON() {
      var str = this;
      if (str.blank()) return false;
      str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
    }

    function toJSON() {
      return this.inspect(true);
    }

    function unfilterJSON(filter) {
      return this.sub(filter || Fuse.JSONFilter, '#{1}');
    }

    return {
      'evalJSON':     evalJSON,
      'isJSON':       isJSON,
      'toJSON':       toJSON,
      'unfilterJSON': unfilterJSON
    };
  })());

  /*--------------------------------------------------------------------------*/

  Object._extend(String.prototype, (function() {
    function blank() {
      return /^\s*$/.test(this);
    }

    function empty() {
      return !this.length;
    }

    function endsWith(pattern) {
      var d = this.length - pattern.length;
      return d >= 0 && this.lastIndexOf(pattern) === d;
    }

    function include(pattern) {
      return this.indexOf(pattern) > -1;
    }

    function inspect(useDoubleQuotes) {
      var escapedString = this.replace(/[\x00-\x1f\\]/g, function(match) {
        var character = String.specialChar[match];
        return character ? character : '\\u00' + match.charCodeAt().toPaddedString(2, 16);
      });
      if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
      return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    }

    function scan(pattern, callback) {
      this.gsub(pattern, callback);
      return String(this);
    }

    function startsWith(pattern) {
      return this.indexOf(pattern) === 0;
    }

    return {
      'blank':      blank,
      'empty':      empty,
      'endsWith':   endsWith,
      'include':    include,
      'inspect':    inspect,
      'scan':       scan,
      'startsWith': startsWith
    };
  })());

  /*--------------------------------------------------------------------------*/

  Object._extend(String.prototype, (function() {
    function capitalize() {
      return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    }

    function dasherize() {
      return this.replace(/_/g,'-');
    }

    function truncate(length, truncation) {
      length = length || 30;
      truncation = (typeof truncation === 'undefined') ? '...' : truncation;
      return this.length > length ? 
        this.slice(0, length - truncation.length) + truncation : String(this);
    }

    function underscore() {
      return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g,'_').toLowerCase();
    }

    var camelize= (function() {
      function replacer(match, captured) {
        return captured.toUpperCase();
      }
      function camelize() {
        return this.replace(/\-(\w|$)/g, replacer);
      }
      return camelize;
    })();

    return {
      'camelize':    camelize,
      'capitalize':  capitalize,
      'dasherize':   dasherize,
      'truncate':    truncate,
      'underscore':  underscore
    };
  })());

  /*--------------------------------------------------------------------------*/

  Object._extend(String.prototype, (function() {
    var s = RegExp.specialChar.s,
     matchTrimLeft     = new RegExp('^' + s + '+'),
     matchTrimRight    = new RegExp(s + '+$'),
     matchScripts      = new RegExp(Fuse.ScriptFragment, 'gi'),
     matchHTMLComments = new RegExp('<!--' + s + '*' + Fuse.ScriptFragment + s + '*-->', 'gi'),
     matchOpenTag      = /<script/i;

    function evalScripts() {
      return this.extractScripts().map(function(script) { return eval(script) });
    }

    function extractScripts() {
      if (!matchOpenTag.test(this)) return [];
      var match, results = [], scriptTags = this.replace(matchHTMLComments, '');
      while (match = matchScripts.exec(scriptTags))
        match[1] && results.push(match[1]);
      return results;
    }

    function strip() {
      return this.replace(matchTrimLeft, '').replace(matchTrimRight, '');
    }

    function stripScripts() {
      return this.replace(matchScripts, '');
    }

    function stripTags() {
      return this.replace(/<("[^"]*"|'[^']*'|[^'">])+>/g, '');
    }

    return {
      'evalScripts':    evalScripts,
      'extractScripts': extractScripts,
      'strip':          String.prototype.trim || strip,
      'stripScripts':   stripScripts,
      'stripTags':      stripTags
    };
  })());

  /*--------------------------------------------------------------------------*/

  Object._extend(String.prototype, (function() {
    var container = Fuse._doc.createElement('pre'),
     textNode = container.appendChild(Fuse._doc.createTextNode(''));

    // Safari 2.x has issues with escaping html inside a "pre"
    // element so we use the deprecated "xmp" element instead.
    if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
      container = Fuse._doc.createElement('xmp');
      textNode = container.appendChild(Fuse._doc.createTextNode(''));
    }

    var escapeHTML = function() {
      textNode.data = this;
      return container.innerHTML.replace(/"/g, '&quot;');
    },

    unescapeHTML = function() {
      Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
      return Fuse._div.textContent;
    };

    // Safari 3.x has issues with escaping the ">" character
    if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
      escapeHTML = function() {
        textNode.data = this;
        return container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;');
      };
    }

    if (!Feature('ELEMENT_TEXT_CONTENT')) {
      Fuse._div.innerHTML = '<pre>&lt;span&gt;test&lt;/span&gt;</pre>';
      if (Feature('ELEMENT_INNER_TEXT') && Fuse._div.firstChild.innerText === '<span>test</span>') {
        unescapeHTML = function() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse._div.firstChild.innerText.replace(/\r/g, '');
        };
      }
      else if (Fuse._div.firstChild.innerHTML === '<span>test</span>') {
        unescapeHTML = function() {
          Fuse._div.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return Fuse._div.firstChild.innerHTML;
        };
      } else {
        unescapeHTML = function() {
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

    return {
      'escapeHTML':   escapeHTML,
      'unescapeHTML': unescapeHTML
    };
  })());
