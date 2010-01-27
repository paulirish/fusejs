  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      var item, i = 0,
       results = Slick(fuse.getDocument(element), String(selector || ''));
      while (item = results[i++])
        if (item === element) return true;
      return false;
    };

    Selector.select = function select(selector, context) {
      return Slick(context && context.raw || context || fuse._doc,
        String(selector || ''), NodeList());
    };

    // prevent JScript bug with named function expressions
    var match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.NodeList);
