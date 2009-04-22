  /*----------------------------- SELECTOR: SLY ------------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      return Sly(selector).match(element);
    };

    this.select = function select(selector, context) {
      return Sly(selector, context, Fuse.List());
    };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
