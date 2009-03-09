  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function() {
    function escape(str) {
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }

    RegExp.escape = escape;
    RegExp.specialChar = { 's': '\\s' };

    // Versions of WebKit and IE have non-spec-conforming /\s/ 
    // so we emulate it (see: ECMA-262 15.10.2.12)
    // http://www.unicode.org/Public/UNIDATA/PropList.txt
    if (Bug('REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY')) {
      RegExp.specialChar.s = [];

      [ /* Whitespace */
        '\x09', '\x0B', '\x0C', '\x20', '\xA0',

        /* Line terminators */
        '\x0A', '\x0D', '\u2028', '\u2029',

        /* Unicode category "Zs" space separators */
        '\u1680', '\u180e', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004',
        '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a', '\u202f',
        '\u205f', '\u3000'
      ]._each(function(chr) {
        if (chr.replace(/\s/, '').length)
          RegExp.specialChar.s.push(chr);
      });

      RegExp.specialChar.s = '[\\s' + RegExp.specialChar.s.join('') + ']';
    }
  })();

  Object._extend(RegExp.prototype, (function() {
    function clone(options) {
       options = Object._extend({
         'global':     this.global,
         'ignoreCase': this.ignoreCase,
         'multiline':  this.multiline
       }, options);

       return new RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    }

    return {
      'clone': clone,
      'match': RegExp.prototype.test
    };
  })());
