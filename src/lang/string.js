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

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    }

    /* FORMAT FUNCTIONS */

    function camelize() {
      var parts = this.split('-'), len = parts.length;
      if (len == 1) return parts[0];

      var camelized = this.charAt(0) == '-' 
        ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
        : parts[0];

      for (var i = 1; i < len; i++)
        camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

      return camelized;
    }

    function capitalize() {
      return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
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
      return this.sub(filter || P.JSONFilter, '#{1}');
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
      var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
        var character = String.specialChar[match[0]];
        return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
      });
      if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
      return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    }

    function scan(pattern, iterator) {
      this.gsub(pattern, iterator);
      return String(this);
    }

    function startsWith(pattern) {
      return this.indexOf(pattern) === 0;
    }

    /* TEXT SUBSTITUTION FUNCTIONS */

    function gsub(pattern, replacement) {
      var match, result = '', source = this,
       isRegExp = Object.isRegExp(pattern);
      replacement = prepareReplacement(replacement);

      // see EMCA-262 15.5.4.11
      if (!isRegExp)
        pattern = RegExp.escape(String(pattern));
      if (pattern === '' || isRegExp && !pattern.source) {
        replacement = replacement(['']);
        return replacement + source.split('').join(replacement) + replacement;
      }

      while (source.length > 0) {
        if (match = source.match(pattern)) {
          result += source.slice(0, match.index);
          result += String.interpret(replacement(match));
          source  = source.slice(match.index + match[0].length);
        } else {
          result += source; break;
        }
      }
      return result;
    }

    function interpolate(object, pattern) {
      return new Template(this, pattern).evaluate(object);
    }

    function prepareReplacement(replacement) {
      if (typeof replacement === 'function') return replacement;
      var template = new Template(replacement);
      return function(match) { return template.evaluate(match) };
    }

    function sub(pattern, replacement, count) {
      replacement = prepareReplacement(replacement);
      count = (typeof count === 'undefined') ? 1 : count;

      return this.gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    }

    /*--------------------------------------------------------------------------*/

    return {
      'blank':         blank,
      'camelize':      camelize,
      'capitalize':    capitalize,
      'dasherize':     dasherize,
      'endsWith':      endsWith,
      'empty':         empty,
      'evalJSON':      evalJSON,
      'gsub':          gsub,
      'include':       include,
      'inspect':       inspect,
      'interpolate':   interpolate,
      'isJSON':        isJSON,
      'parseQuery':    toQueryParams,
      'scan':          scan,
      'startsWith':    startsWith,
      'sub':           sub,
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

  Object.extend(String.prototype, (function() {
    var s = RegExp.specialChar.s,
     matchTrimLeft     = new RegExp('^' + s + '+'),
     matchTrimRight    = new RegExp(s + '+$'),
     matchScripts      = new RegExp(P.ScriptFragment, 'gi'),
     matchHTMLComments = new RegExp('<!--' + s + '*' + P.ScriptFragment + s + '*-->', 'gi'),
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
