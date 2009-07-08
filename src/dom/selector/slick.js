  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function() {
    this.match = function match(element, selector) {
      var item, i = 0,
       results = slick(getDocument(element), String(selector || ''));
      while (item = results[i++])
        if (item === element) return true;
      return false;
    };

    this.select = (function() {
      var select = function select(selector, context) {
        return slick(context || Fuse._doc, String(selector || ''), Fuse.List())
          .map(Element.extend);
      };

      if (Feature('ELEMENT_EXTENSIONS'))
        select = function select(selector, context) {
          return slick(context || Fuse._doc, String(selector || ''), Fuse.List());
        };

      return select;
    })();

    // prevent JScript bug with named function expressions
    var match = null;
  }).call(Fuse.Dom.Selector);
