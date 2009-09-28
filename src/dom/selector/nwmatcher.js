  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      function match(element, selector) {
        return nwMatch(element.raw || element, String(selector || ''));
      }

      nwMatch = NW.Dom.match;
      return (Selector.match = match)(element, selector);
    };

    Selector.select = function select(selector, context) {
      function select(selector, context) {
        return nwSelect(String(selector || ''), 
          context && context.raw || context || Fuse._doc, NodeList());
      }

      nwSelect = NW.Dom.select;
      return (Selector.select = select)(selector, context);
    };

    var nwMatch, nwSelect, match = nil, select = nil;
  })(Fuse.Dom.Selector, Fuse.Dom.NodeList);
