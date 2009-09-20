  /*----------------------------- SELECTOR: SLY ------------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      return Sly(String(selector || '')).match(element);
    };

    Selector.select = function select(selector, context) {
      return Sly(String(selector || ''), context || Fuse._doc, NodeList());
    };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  })(Fuse.Dom.Selector, Fuse.Dom.NodeList);
