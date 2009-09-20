  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      var item, i = 0,
       results = slick(getDocument(element), String(selector || ''));
      while (item = results[i++])
        if (item === element) return true;
      return false;
    };

    Selector.select = function select(selector, context) {
      return slick(context || Fuse._doc, String(selector || ''), NodeList());
    };

    var getDocument = getDocument, match = null, select = null;
  })(Fuse.Dom.Selector, Fuse.Dom.NodeList);
