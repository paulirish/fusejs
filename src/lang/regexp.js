  /*------------------------------ LANG: REGEXP ------------------------------*/

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

      return Fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // alias
    this.match = this.test;

    // prevent JScript bug with named function expressions
    var clone = null;
  }).call(Fuse.RegExp.Plugin);
