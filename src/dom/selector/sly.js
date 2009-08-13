  /*----------------------------- SELECTOR: SLY ------------------------------*/

  (function(Selector) {
    Selector.match = function match(element, selector) {
      return Sly(String(selector || '')).match(element);
    };

    Selector.select = function select(selector, context) {
      return Sly(String(selector || ''), context || Fuse._doc, Fuse.List())
        .map(Element.extend);
    };

    if (Feature('ELEMENT_EXTENSIONS'))
      Selector.select = function select(selector, context) {
        return Sly(String(selector || ''), context || Fuse._doc, Fuse.List());
      };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  })(Fuse.Dom.Selector);
