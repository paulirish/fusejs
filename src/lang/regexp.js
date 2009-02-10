  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function() {
    function escape(str) {
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }

    RegExp.escape = escape;
    RegExp.specialChar = { 's': '\\s' };
    RegExp.prototype.match = RegExp.prototype.test;

    // Safari 2 and IE have non-spec-conforming /\s/ 
    // so we emulate it (see: ECMA-262 15.10.2.12)
    // http://www.unicode.org/Public/UNIDATA/PropList.txt
    if (Bug('REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY')) {
      RegExp.specialChar.s = '[' + 
        /* Whitespace */
        '\x09\x0B\x0C\x20\xA0' +
        /* Line terminators */
        '\x0A\x0D\u2028\u2029' +
        /* Unicode category "Zs" space separators */
        '\u1680\u180e\u2000-\u200a\u202f\u205f\u3000' +
      ']';
    }
  })();
