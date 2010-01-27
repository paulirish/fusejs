  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function(plugin) {
    fuse.RegExp.escape = function escape(string) {
      return fuse.String(escapeRegExpChars(string));
    };

    plugin.clone = function clone(options) {
      options = _extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // alias
    plugin.match = plugin.test;

    // prevent JScript bug with named function expressions
    var clone = nil, escape = nil;
  })(fuse.RegExp.plugin);
