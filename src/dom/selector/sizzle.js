  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      return Sizzle(String(selector || ''), null, null, [element]).length === 1;
    };

    Selector.select = function select(selector, context) {
      return Sizzle(String(selector || ''), 
        context && context.raw || context || fuse._doc, NodeList());
    };

    // prevent JScript bug with named function expressions
    var match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.NodeList);
