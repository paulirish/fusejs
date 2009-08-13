  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  (function(Selector) {
    Selector.match = function match(element, selector) {
      return Sizzle(String(selector || ''), null, null, [element]).length === 1;
    };

    Selector.select = function select(selector, context) {
      return Sizzle(String(selector || ''), context || Fuse._doc, Fuse.List())
        .map(Element.extend);
    };

    if (Feature('ELEMENT_EXTENSIONS'))
      Selector.select = function select(selector, context) {
        return Sizzle(String(selector || ''), context || Fuse._doc, Fuse.List());
      };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  })(Fuse.Dom.Selector);
