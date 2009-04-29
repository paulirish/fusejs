  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      return Sizzle(selector, null, null, [element]).length === 1;
    };

    this.select = Feature('ELEMENT_EXTENSIONS')
      ? function select(selector, context) {
          return Sizzle(selector, context, Fuse.List());
        }
      : function select(selector, context) {
          return Sizzle(selector, context, Fuse.List()).map(Element.extend);
        };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
