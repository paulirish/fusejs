Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, {
  gsub: function(pattern, replacement) {
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);
    if (typeof pattern === 'string') pattern = RegExp.escape(pattern);
    
    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },
  
  sub: function(pattern, replacement, count) {
    replacement = this.gsub.prepareReplacement(replacement);
    count = (typeof count === 'undefined') ? 1 : count;
    
    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  },
  
  scan: function(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  },
  
  truncate: function(length, truncation) {
    length = length || 30;
    truncation = (typeof truncation === 'undefined') ? '...' : truncation;
    return this.length > length ? 
      this.slice(0, length - truncation.length) + truncation : String(this);
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },
  
  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(P.ScriptFragment, 'gi'), '');
  },
  
  extractScripts: (function() {
    var matchOpenTag = /<script/i,
     matchAll = new RegExp(P.ScriptFragment, 'gi'),
     matchOne = new RegExp(P.ScriptFragment, 'i'),
     matchComments = new RegExp('<!--\\s*' + P.ScriptFragment + '\\s*-->', 'gi');

    return function() {
      if (!matchOpenTag.test(this)) return [];
      var results = [], scriptTags = (this.replace(matchComments, '').match(matchAll) || []);
      for(var i = 0, code, scriptTag; scriptTag = scriptTags[i]; i++) {
        if (code = (scriptTag.match(matchOne) || ['', ''])[1])
          results.push(code);
      }
      return results;
    };
  })(),
  
  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script) });
  },
  
  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };
    
    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);
        
        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },
  
  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },
  
  times: function(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  },
  
  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];
    
    var camelized = this.charAt(0) == '-' 
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];
    
    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
   
    return camelized;
  },
  
  capitalize: function() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },
  
  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.gsub(/[\x00-\x1f\\]/, function(match) {
      var character = String.specialChar[match[0]];
      return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  },
  
  toJSON: function() {
    return this.inspect(true);
  },

  unfilterJSON: function(filter) {
    return this.sub(filter || P.JSONFilter, '#{1}');
  },

  isJSON: function() {
    var str = this;
    if (str.blank()) return false;
    str = this.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
    return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);
  },
  
  evalJSON: function(sanitize) {
    var json = this.unfilterJSON();
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  },
  
  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },
  
  empty: function() {
    return this == '';
  },
  
  blank: function() {
    return /^\s*$/.test(this);
  },

  interpolate: function(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }
});

(function(SP) {
  var container = doc.createElement('pre'),
   textNode = container.appendChild(doc.createTextNode(''));

  // Safari 2.x has issues with escaping html inside a "pre"
  // element so we use the deprecated "xmp" element instead.
  if ((textNode.data = '&') && container.innerHTML !== '&amp;') {
    container = doc.createElement('xmp');
    textNode = container.appendChild(doc.createTextNode(''));
  }

  SP.escapeHTML = function() {
    textNode.data = this;
    return container.innerHTML.replace(/"/g, '&quot;');
  };

  SP.unescapeHTML = function() {
    dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
    return dummy.textContent;
  };

  // Safari 3.x has issues with escaping the ">" character
  if ((textNode.data = '>') && container.innerHTML !== '&gt;') {
    SP.escapeHTML = function() {
      textNode.data = this;
      return container.innerHTML.replace(/"/g, '&quot;').replace(/>/g, '&gt;');
    };
  }

  if (!('textContent' in dummy)) {
    dummy.innerHTML = '<pre>&lt;span&gt;test&lt;/span&gt;</pre>';
    if ('innerText' in dummy && dummy.firstChild.innerText === '<span>test</span>') {
      SP.unescapeHTML = function() {
        dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
        return dummy.firstChild.innerText.replace(/\r/g, '');
      };
    }
	else if (dummy.firstChild.innerHTML === '<span>test</span>') {
	  SP.unescapeHTML = function() {
        dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
        return dummy.firstChild.innerHTML;
      };
	} else {
	  SP.unescapeHTML = function() {
        dummy.innerHTML = '<pre>' + this.stripTags() + '</pre>';
        return dummy.firstChild.childNodes[0] ? (dummy.firstChild.childNodes.length > 1 ?
          $A(dummy.firstChild.childNodes).inject('', function(memo, node) { return memo + node.nodeValue }) :
          dummy.firstChild.childNodes[0].nodeValue) : '';
      };
    }
  }
})(String.prototype);

String.prototype.gsub.prepareReplacement = function(replacement) {
  if (typeof replacement === 'function') return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
};

String.prototype.parseQuery = String.prototype.toQueryParams;

Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },
  
  evaluate: function(object) {
    if (typeof object.toTemplateReplacements === 'function')
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return '';
      
      var before = match[1] || '';
      if (before == '\\') return match[2];
      
      var ctx = object, expr = match[3];
      var pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }
      
      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
