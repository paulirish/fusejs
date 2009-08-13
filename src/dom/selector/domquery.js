  /*--------------------------- SELECTOR: DOMQUERY ---------------------------*/

  (function(Selector) {
    var extSelect;

    Selector.match = function match(element, selector) {
      function match(element, selector) {
        var item, i = 0,
         results = extSelect(String(selector || ''), getDocument(element));
        while (item = results[i++])
          if (item === element) return true;
        return false;
      }

      extSelect = Ext.DomQuery.select;
      return (Selector.match = match)(element, selector);
    };

    Selector.select = function select(selector, context) {
      var select = function select(selector, context) {
        return toList(extSelect(String(selector || ''), context || Fuse._doc))
          .map(Element.extend);
      };

      if (Feature('ELEMENT_EXTENSIONS'))
        select = function select(selector, context) {
          return toList(extSelect(String(selector || ''), context || Fuse._doc));
        };

      extSelect = Ext.DomQuery.select;
      toList = Fuse.List.fromNodeList;
      return (Selector.select = select)(selector, context);
    };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  })(Fuse.Dom.Selector);

