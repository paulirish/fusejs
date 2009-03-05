  /*------------------------------ LANG: STRING ------------------------------*/

  Object.extend(String, (function() {
    function interpret(value) {
      return value == null ? '' : String(value);
    }

    return {
      specialChar: {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '\\': '\\\\'
      },
      interpret: interpret
    };
  })());

  /*--------------------------------------------------------------------------*/

  (function() {
    var __replace = String.prototype.replace;

    function gsub(pattern, replacement) {
      if (!Object.isRegExp(pattern))
        pattern = new RegExp(RegExp.escape(String(pattern)), 'g');
      if (!pattern.global)
        pattern = pattern.clone({ 'global': true });
      return this.replace(pattern, prepareReplacement(replacement));
    }

    function interpolate(object, pattern) {
      return new Template(this, pattern).evaluate(object);
    }

    function prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)) };
      var template = new Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)) };
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
        return this.replace(pattern, prepareReplacement(replacement));
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

    Object.extend(String.prototype, {
      'gsub':        gsub,
      'interpolate': interpolate,
      'sub':         sub
    });
  })();

  /*--------------------------------------------------------------------------*/

  Object.extend(String.prototype, (function() {
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
        if (!(pair = pairs[i].split('='))[0]) continue
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

    /* JSON FUNCTIONS */

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

    /* STRING QUERY FUNCTIONS */

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

    /* FORMAT FUNCTIONS */

    function capitalize() {
      return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    }

    function dasherize() {
      return this.replace(/_/g,'-');
    }

    function underscore() {
      return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g,'_').toLowerCase();
    }

    function truncate(length, truncation) {
      length = length || 30;
      truncation = (typeof truncation === 'undefined') ? '...' : truncation;
      return this.length > length ? 
        this.slice(0, length - truncation.length) + truncation : String(this);
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
      'blank':         blank,
      'camelize':      camelize,
      'capitalize':    capitalize,
      'dasherize':     dasherize,
      'endsWith':      endsWith,
      'empty':         empty,
      'evalJSON':      evalJSON,
      'include':       include,
      'inspect':       inspect,
      'isJSON':        isJSON,
      'parseQuery':    toQueryParams,
      'scan':          scan,
      'startsWith':    startsWith,
      'succ':          succ,
      'times':         times, 
      'toArray':       toArray,
      'toJSON':        toJSON,
      'toQueryParams': toQueryParams,
      'truncate':      truncate,
      'underscore':    underscore,
      'unfilterJSON':  unfilterJSON
    };
  })());

  /*--------------------------------------------------------------------------*/
  
  Object.extend(String.prototype, (function() {
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

  Object.extend(String.prototype, (function() {
    var container = doc.createElement('pre'),
     textNode = container.appendChild(doc.createTextNode(''));

    // Safari 2.x has issues with escaping html inside a "pre"
    // element so we use the deprecated "xmp" element instead.
    if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
      container = doc.createElement('xmp');
      textNode = container.appendChild(doc.createTextNode(''));
    }

    var escapeHTML = function() {
      textNode.data = this;
      return container.innerHTML.replace(/"/g, '&quot;');
    },

    unescapeHTML = function() {
      dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
      return dummy.textContent;
    };

    // Safari 3.x has issues with escaping the ">" character
    if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
      escapeHTML = function() {
        textNode.data = this;
        return container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;');
      };
    }

    if (!Feature('ELEMENT_TEXT_CONTENT')) {
      dummy.innerHTML = '<pre>&lt;span&gt;test&lt;/span&gt;</pre>';
      if (Feature('ELEMENT_INNER_TEXT') && dummy.firstChild.innerText === '<span>test</span>') {
        unescapeHTML = function() {
          dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return dummy.firstChild.innerText.replace(/\r/g, '');
        };
      }
      else if (dummy.firstChild.innerHTML === '<span>test</span>') {
        unescapeHTML = function() {
          dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          return dummy.firstChild.innerHTML;
        };
      } else {
        unescapeHTML = function() {
          dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
          var node, i = 0, results = [];
          while (node = dummy.firstChild.childNodes[i++])
            results.push(node.nodeValue);
          return results.join('');
        };
      }
      // cleanup dummy
      dummy.innerHTML = '';
    }

    return {
      'escapeHTML':   escapeHTML,
      'unescapeHTML': unescapeHTML
    };
  })());
