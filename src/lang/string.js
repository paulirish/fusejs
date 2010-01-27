  /*------------------------------ LANG: STRING ------------------------------*/

  fuse.scriptFragment = '<script[^>]*>([^\\x00]*?)<\/script>';

  fuse.addNS('util');

  fuse.util.$w = (function() {
    function $w(string) {
      if (!isString(string)) return fuse.Array();
      string = plugin.trim.call(string);
      return string != '' ? string.split(/\s+/) : fuse.Array();
    }
    var plugin = fuse.String.plugin;
    return $w;
  })();

  fuse.String.interpret = (function() {
    function interpret(value) { return fuse.String(value == null ? '' : value); }
    return interpret;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var sMap = fuse.RegExp.SPECIAL_CHARS.s;

    // ECMA-5 15.5.4.11
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SETS_REGEXP_LAST_INDEX'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          var __replacement, result;
          if (typeof replacement === 'function') {
            // ensure string `null` and `undefined` are returned
            __replacement = replacement;
            replacement = function() {
              var result = __replacement.apply(global, arguments);
              return result || String(result);
            };
          }
          result = __replace.call(this, pattern, replacement);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return replace;
      })(plugin.replace);

    // For Safari 2.0.2- and Chrome 1+
    // Based on work by Dean Edwards:
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ||
        envTest('STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          if (typeof replacement !== 'function')
            return __replace.call(this, pattern, replacement);

          if (this == null) throw new TypeError;
          if (!isRegExp(pattern))
            pattern = new RegExp(escapeRegExpChars(pattern));

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
          return fuse.String(result);
        }

        var exec = RegExp.prototype.exec;
        return replace;
      })(plugin.replace);


    // ECMA-5 15.5.4.8
    if (!plugin.lastIndexOf)
      plugin.lastIndexOf = function lastIndexOf(searchString, position) {
        if (this == null) throw new TypeError;
        searchString = String(searchString);
        position = +position;

        var string = String(this),
         len = string.length,
         searchLen = searchString.length;

        if (searchLen > len)
          return fuse.Number(-1);

        if (position < 0) position = 0;
        else if (isNaN(position) || position > len - searchLen)
          position = len - searchLen;

        if (!searchLen)
          return fuse.Number(position);

        position++;
        while (position--)
          if (string.slice(position, position + searchLen) === searchString)
            return fuse.Number(position);
        return fuse.Number(-1);
      };

    // For Chome 1+
    if (envTest('STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION'))
      plugin.lastIndexOf = (function(__lastIndexOf) {
        function lastIndexOf(searchString, position) {
          position = +position;
          return __lastIndexOf.call(this, searchString, position < 0 ? 0 : position);
        }

        return lastIndexOf;
      })(plugin.lastIndexOf);


    // ECMA-5 15.5.4.10
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SETS_REGEXP_LAST_INDEX'))
      plugin.match = (function(__match) {
        function match(pattern) {
          var result = __match.call(this, pattern);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return match;
      })(plugin.match);


    // ECMA-5 15.5.4.20
    if (!plugin.trim)
      plugin.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        if (start === end) return fuse.String('');

        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(start, end + 1));
      };

    // non-standard
    if (!plugin.trimLeft)
      plugin.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        return fuse.String(string.slice(start));
      };

    // non-standard
    if (!plugin.trimRight)
      plugin.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(0, end + 1));
      };

    // prevent JScript bug with named function expressions
    var lastIndexOf = nil, match = nil, trim = nil, trimLeft = nil, trimRight = nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var replace         = plugin.replace,
     matchBlank         = fuse.RegExp('^\\s*$'),
     matchCapped        = /([A-Z]+)([A-Z][a-z])/g,
     matchCamelCases    = /([a-z\d])([A-Z])/g,
     matchDoubleColons  = /::/g,
     matchHyphens       = /-/g,
     matchHyphenated    = /-+(.)?/g,
     matchOpenScriptTag = /<script/i,
     matchUnderscores   = /_/g,
     matchScripts       = new RegExp(fuse.scriptFragment, 'gi'),
     matchHTMLComments  = new RegExp('<!--[\\x20\\t\\n\\r]*' +
       fuse.scriptFragment + '[\\x20\\t\\n\\r]*-->', 'gi');

    plugin.blank = function blank() {
      if (this == null) throw new TypeError;
      return matchBlank.test(this);
    };

    plugin.camelize = (function() {
      function toUpperCase(match, character) {
        return character ? character.toUpperCase() : '';
      }

      function camelize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = replace.call(string, matchHyphenated, toUpperCase));
      }

      var cache = { };
      return camelize;
    })();

    // set private reference
    capitalize =
    plugin.capitalize = (function() {
      function capitalize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = fuse.String(string.charAt(0).toUpperCase() +
            string.slice(1).toLowerCase()));
      }

      var cache = { };
      return capitalize;
    })();

    plugin.contains = function contains(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isEmpty = function isEmpty() {
      if (this == null) throw new TypeError;
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      if (this == null) throw new TypeError;
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    };

    plugin.evalScripts = function evalScripts() {
      if (this == null) throw new TypeError;
      results = fuse.Array();
      fuse.String(this).extractScripts(function(script) {
        results.push(global.eval(String(script)));
      });

      return results;
    };

    plugin.extractScripts = function extractScripts(callback) {
      if (this == null) throw new TypeError;
      var match, script, striptTags,
       string = String(this), results = fuse.Array();

      if (!matchOpenScriptTag.test(string)) return results;

      matchHTMLComments.lastIndex =
      matchScripts.lastIndex      = 0;
      scriptTags = string.replace(matchHTMLComments, '');

      if (callback) {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) { callback(script); results.push(script); }
      } else {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) results.push(script);
      }
      return results;
    };

    plugin.hyphenate = function hyphenate() {
      if (this == null) throw new TypeError;
      matchUnderscores.lastIndex = 0;
      return fuse.String(String(this).replace(matchUnderscores, '-'));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      if (this == null) throw new TypeError;
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.stripScripts = function stripScripts() {
      if (this == null) throw new TypeError;
      matchScripts.lastIndex = 0;
      return fuse.String(String(this).replace(matchScripts, ''));
    };

    plugin.times = (function() {
      function __times(string, count) {
        // Based on work by Yaffle and Dr. J.R.Stockton.
        // Uses the `Exponentiation by squaring` algorithm. 
        // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
        if (count < 1) return '';
        if (count % 2) return __times(string, count - 1) + string;
        var half = __times(string, count / 2);
        return half + half;
      }

      function times(count) {
        if (this == null) throw new TypeError;
        return fuse.String(__times(String(this), toInteger(count)));
      }

      return times;
    })();

    plugin.toArray = function toArray() {
      if (this == null) throw new TypeError;
      return fuse.String(this).split('');
    };

    plugin.toQueryParams = function toQueryParams(separator) {
      if (this == null) throw new TypeError;
      var match = String(this).split('?'), object = fuse.Object();

      // if ? (question mark) is present and there is no query after it
      if (match.length > 1 && !match[1]) return object;

      // grab the query before the # (hash) and\or spaces
      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);

      // bail if empty string
      if (!match) return object;

      var pair, key, value, index, i = 0,
       pairs = match.split(separator || '&'), length = pairs.length;

      // iterate over key-value pairs
      for ( ; i < length; i++) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (!pair || index == 0) continue;

        if (index != -1) {
          key = decodeURIComponent(pair.slice(0, index));
          value = pair.slice(index + 1);
          if (value) value = decodeURIComponent(value);
        } else key = pair;

        if (hasKey(object, key)) {
          if (!isArray(object[key])) object[key] = [object[key]];
          object[key].push(value);
        }
        else object[key] = value;
      }
      return object;
    };

    plugin.truncate = function truncate(length, truncation) {
      if (this == null) throw new TypeError;
      var endIndex, string = String(this);

      length = +length;
      if (isNaN(length)) length = 30;

      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      if (this == null) throw new TypeError;
      matchDoubleColons.lastIndex =
      matchCapped.lastIndex       =
      matchCamelCases.lastIndex   =
      matchHyphens.lastIndex      = 0;

      return fuse.String(String(this)
        .replace(matchDoubleColons, '/')
        .replace(matchCapped,       '$1_$2')
        .replace(matchCamelCases,   '$1_$2')
        .replace(matchHyphens,      '_').toLowerCase());
    };

    // aliases
    plugin.parseQuery = plugin.toQueryParams;

    // prevent JScript bug with named function expressions
    var blank =        nil,
      contains =       nil,
      endsWith =       nil,
      evalScripts =    nil,
      extractScripts = nil,
      hyphenate =      nil,
      isEmpty =        nil,
      startsWith =     nil,
      stripScripts =   nil,
      toArray =        nil,
      toQueryParams =  nil,
      truncate =       nil,
      underscore =     nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    // Tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    var matchTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })();

    function define() {
      var tags      = [],
       count        = 0,
       div          = fuse._div,
       container    = fuse._doc.createElement('pre'),
       textNode     = container.appendChild(fuse._doc.createTextNode('')),
       replace      = plugin.replace,
       matchTagEnds = />/g,
       matchTokens  = /@fusetoken/g;

       escapeHTML = function escapeHTML() {
         if (this == null) throw new TypeError;
         textNode.data = String(this);
         return fuse.String(container.innerHTML);
       },

       getText = function() {
         return div.textContent;
       };

      function swapTagsToTokens(tag) {
        tags.push(tag);
        return '@fusetoken';
      }

      function swapTokensToTags() {
        return tags[count++];
      }

      function unescapeHTML() {
        if (this == null) throw new TypeError;
        var result, tokenized, string = String(this);

        // tokenize tags before setting innerHTML then swap them after
        if (tokenized = string.indexOf('<') > -1) {
          tags.length = count = 0;
          string = replace.call(string, matchTags, swapTagsToTokens);
        }

        div.innerHTML = '<pre>' + string + '<\/pre>';
        result = getText();

        return fuse.String(tokenized
          ? replace.call(result, matchTokens, swapTokensToTags)
          : result);
      }


      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML !== '&amp;')
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));

      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML !== '&gt;')
        escapeHTML = function escapeHTML() {
          if (this == null) throw new TypeError;
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(matchTagEnds, '&gt;'));
        };

      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };

        else if (div.firstChild.innerHTML === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerHTML; };

        else getText = function() {
          var node, nodes = div.firstChild.childNodes, parts = [], i = 0;
          while (node = nodes[i++]) parts.push(node.nodeValue);
          return parts.join('');
        };
      }

      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    }

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(matchTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = nil, stripTags = nil, unescapeHTML = nil;
  })(fuse.String.plugin);
