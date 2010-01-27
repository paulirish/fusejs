  /*--------------------------- SELECTOR: DOMQUERY ---------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      function match(element, selector) {
        var item, i = 0,
         results = extSelect(String(selector || ''), fuse.getDocument(element));
        while (item = results[i++])
          if (item === element) return true;
        return false;
      }

      extSelect = Ext.DomQuery.select;
      return (Selector.match = match)(element, selector);
    };

    Selector.select = function select(selector, context) {
      return toList(extSelect(String(selector || ''),
        context && context.raw || context || fuse._doc));
    };

    var extSelect, toList = NodeList.fromNodeList, match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.NodeList);

