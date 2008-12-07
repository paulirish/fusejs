  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  Template = Class.create((function() {
    function initialize(template, pattern) {
      this.template = template.toString();
      this.pattern = pattern || Template.Pattern;
    }

    function evaluate(object) {
      if (typeof object.toTemplateReplacements === 'function')
        object = object.toTemplateReplacements();

      return this.template.gsub(this.pattern, function(match) {
        var before = match[1] || '';
        if (before === '\\') return match[2];
        if (object == null) return before;

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

    return {
      'initialize': initialize,
      'evaluate':   evaluate
    };
  })());

  Template.Pattern = /(\\)?(#\{([^}]*)\})/;
