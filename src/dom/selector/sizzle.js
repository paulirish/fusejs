  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      return Sizzle(String(selector || ''), null, null, [element]).length === 1;
    };

    this.select = function select(selector, context) {
      return Sizzle(String(selector || ''), context || Fuse._doc, Fuse.List())
        .map(Element.extend);
    };

    if (Feature('ELEMENT_EXTENSIONS'))
      this.select = function select(selector, context) {
        return Sizzle(String(selector || ''), context || Fuse._doc, Fuse.List());
      };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
