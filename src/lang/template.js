  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  Fuse.addNS('Template', {
    'constructor': (function() {
      function Template(template, pattern) {
        if (!(this instanceof Template))
          return new Template(template, pattern);

        this.template = Fuse.String(template);

        pattern = pattern || Fuse.Template.Pattern;
        if (!isRegExp(pattern))
          pattern = Fuse.RegExp(escapeRegExpChars(pattern));
        if (!pattern.global)
          pattern = Fuse.RegExp.clone(pattern, { 'global': true });
        this.pattern = pattern;
      }
      return Template;
    })(),

    'evaluate': (function() {
      function evaluate(object) {
        if (object) {
          if (isHash(object))
            object = object._object;
          else if (typeof object.toTemplateReplacements === 'function')
            object = object.toTemplateReplacements();
          else if (typeof object.toObject === 'function')
            object = object.toObject();
        }

        return this.template.replace(this.pattern, function(match, before, escaped, expr) {
          before = before || '';
          if (before === '\\') return escaped;
          if (object == null) return before;

          // adds support for dot and bracket notation
          var comp,
           ctx     = object,
           value   = ctx,
           pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

          match = pattern.exec(expr);
          if (match == null) return before;

          while (match != null) {
            comp  = !match[1].lastIndexOf('[', 0) ? match[2].replace(/\\]/g, ']') : match[1];
            value = ctx[comp];
            if (!hasKey(ctx, comp) || value == null) {
              value = ''; break;
            }
            if ('' == match[3]) break;
            ctx   = value;
            expr  = expr.substring('[' == match[3] ? match[1].length : match[0].length);
            match = pattern.exec(expr);
          }
          return before + (value == null ? '' : value);
        });
      }
      return evaluate;
    })()
  });

  Fuse.Template.Pattern = /(\\)?(#\{([^}]*)\})/;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)); };
      var template = new Fuse.Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)); };
    }

    plugin.gsub = function gsub(pattern, replacement) {
      if (this == null) throw new TypeError;

      if (!isRegExp(pattern))
        pattern = Fuse.RegExp(escapeRegExpChars(pattern), 'g');
      if (!pattern.global)
        pattern = Fuse.RegExp.clone(pattern, { 'global': true });
      return this.replace(pattern, prepareReplacement(replacement));
    };

    plugin.interpolate = function interpolate(object, pattern) {
      if (this == null) throw new TypeError;
      return new Fuse.Template(this, pattern).evaluate(object);
    };

    plugin.sub = function sub(pattern, replacement, count) {
      if (this == null) throw new TypeError;

      count = (typeof count === 'undefined') ? 1 : count;
      if (count === 1) {
        if (!isRegExp(pattern))
          pattern = Fuse.RegExp(escapeRegExpChars(pattern));
        if (pattern.global)
          pattern = Fuse.RegExp.clone(pattern, { 'global': false });
        return this.replace(pattern, prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new Fuse.Template(replacement);
        replacement = function(match) { return template.evaluate(match); };
      }
      return this.gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = null, interpolate = null, sub = null;
  })(Fuse.String.plugin);
