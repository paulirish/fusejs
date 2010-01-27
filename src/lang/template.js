  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  fuse.Template = (function() {
    function Klass() { }

    function Template(template, pattern) {
      pattern = pattern || fuse.Template.Pattern;
      if (!isRegExp(pattern))
        pattern = fuse.RegExp(escapeRegExpChars(pattern));
      if (!pattern.global)
        pattern = fuse.RegExp.clone(pattern, { 'global': true });

      var instance = __instance || new Klass;
      __instance = null;

      instance.template = fuse.String(template);
      instance.pattern  = pattern;
      return instance;
    }

    var __instance, __apply = Template.apply, __call = Template.call,
     Template = Class({ 'constructor': Template });

    Template.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Template.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Klass.prototype = Template.plugin;
    return Template;
  })();

  fuse.Template.Pattern = /(\\)?(#\{([^}]*)\})/;

  fuse.Template.plugin.evaluate = (function() {
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
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function prepareReplacement(replacement) {
      if (typeof replacement === 'function')
        return function() { return replacement(slice.call(arguments, 0, -2)); };
      var template = new fuse.Template(replacement);
      return function() { return template.evaluate(slice.call(arguments, 0, -2)); };
    }

    var replace = plugin.replace;

    plugin.gsub = function gsub(pattern, replacement) {
      if (this == null) throw new TypeError;

      if (!isRegExp(pattern))
        pattern = fuse.RegExp(escapeRegExpChars(pattern), 'g');
      if (!pattern.global)
        pattern = fuse.RegExp.clone(pattern, { 'global': true });
      return replace.call(this, pattern, prepareReplacement(replacement));
    };

    plugin.interpolate = function interpolate(object, pattern) {
      if (this == null) throw new TypeError;
      return new fuse.Template(this, pattern).evaluate(object);
    };

    plugin.scan = function scan(pattern, callback) {
      if (this == null) throw new TypeError;
      var result = fuse.String(this);
      result.gsub(pattern, callback);
      return result;
    };

    plugin.sub = function sub(pattern, replacement, count) {
      if (this == null) throw new TypeError;
      count = typeof count === 'undefined' ? 1 : count;

      if (count === 1) {
        if (!isRegExp(pattern))
          pattern = fuse.RegExp(escapeRegExpChars(pattern));
        if (pattern.global)
          pattern = fuse.RegExp.clone(pattern, { 'global': false });
        return replace.call(this, pattern, prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = new fuse.Template(replacement);
        replacement = function(match) { return template.evaluate(match); };
      }

      return fuse.String(this).gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = nil, interpolate = nil, scan = nil, sub = nil;
  })(fuse.String.plugin);
