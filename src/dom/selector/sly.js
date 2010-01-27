  /*----------------------------- SELECTOR: SLY ------------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      return Sly(String(selector || '')).match(element);
    };

    Selector.select = function select(selector, context) {
      return Sly(String(selector || ''),
        context && context.raw || context || fuse._doc, NodeList());
    };

    // prevent JScript bug with named function expressions
    var match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.NodeList);
