  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function() {
    function escape(str) {
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }

    RegExp.escape = escape;
    RegExp.prototype.match = RegExp.prototype.test;
  })();
