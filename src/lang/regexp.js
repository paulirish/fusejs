  /*------------------------------ LANG: REGEXP ------------------------------*/

  // versions of WebKit and IE have non-spec-conforming /\s/ 
  // so we emulate it (see: ECMA-5 15.10.2.12)
  // http://www.unicode.org/Public/UNIDATA/PropList.txt
  Fuse.RegExp.specialChar = { 
    's': (function() {
      var chars = [
        /* whitespace */
        '\\x09', '\\x0B', '\\x0C', '\\x20', '\\xA0',
        /* line terminators */
        '\\x0A', '\\x0D', '\\u2028', '\\u2029',
        /* unicode category "Zs" space separators */
        '\\u1680', '\\u180e', '\\u2000', '\\u2001', '\\u2002', '\\u2003', '\\u2004',
        '\\u2005', '\\u2006', '\\u2007', '\\u2008', '\\u2009', '\\u200a', '\\u202f',
        '\\u205f', '\\u3000'
      ];

      var results = ['\\s'], length = chars.length;
      if (Bug('REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY')) {
        while (length--) {
          if (chars[length].replace(/\s/, '').length)
            results.push(chars[length]);
        }
        return '(' + results.join('|') + ')';
      }
      return results[0];
    })()
  };

  Fuse.RegExp.escape = (function() {
    function escape(string) {
      return Fuse.String(string).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }
    return escape;
  })();

  (function() {
    this.clone = function clone(options) {
      options = Fuse.Object._extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return new Fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // alias
    this.match = this.test;

    // prevent JScript bug with named function expressions
    var clone = null;
  }).call(Fuse.RegExp.Plugin);
