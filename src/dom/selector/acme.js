  /*----------------------------- SELECTOR: ACME -----------------------------*/

  (function(Selector) {
    Selector.match = function match(element, selector) {
      var item, i = 0,
       results = acme.query(String(selector || ''), getDocument(element));
      while (item = results[i++])
        if (item === element) return true;
      return false;
    };

    Selector.select = function select(selector, context) {
      return toList(acme.query(String(selector || ''), context || Fuse._doc));
    };

    var getDocument = getDocument,
     toList =         Fuse.Lust.fromNodeList,
     match =          null,
     select =         null;

  })(Fuse.Dom.Selector);
