  /*----------------------------- SELECTOR: SLY ------------------------------*/

  (function() {
    this.match = function match(element, selector) {
      return Sly(String(selector || '')).match(element);
    };

    this.select = function select(selector, context) {
      return Sly(String(selector || ''), context || Fuse._doc, Fuse.List())
        .map(Element.extend);
    };

    if (Feature('ELEMENT_EXTENSIONS'))
      this.select = function select(selector, context) {
        return Sly(String(selector || ''), context || Fuse._doc, Fuse.List());
      };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
