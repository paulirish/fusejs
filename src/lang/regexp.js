  /*------------------------------ LANG: REGEXP ------------------------------*/

  Fuse.RegExp.escape = (function() {
    function escape(string) {
      return Fuse.String(String(string).replace(matchSpecialChars, '\\$1'));
    }
    var matchSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return escape;
  })();

  (function(proto) {
    proto.clone = function clone(options) {
      options = _extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return Fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // alias
    proto.match = proto.test;

    // prevent JScript bug with named function expressions
    var clone = null;
  })(Fuse.RegExp.Plugin);
