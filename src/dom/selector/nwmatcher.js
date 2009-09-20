  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, NodeList) {
    Selector.match = function match(element, selector) {
      function match(element, selector) {
        return NWMatcher.match(element.raw || element, String(selector || ''));
      }

      NWMatcher = NW.Dom;
      return (Selector.match = match)(element, selector);
    };

    Selector.select = function select(selector, context) {
      function select(selector, context) {
        return NWMatcher.select(String(selector || ''), 
          context && context.raw || context || Fuse._doc, NodeList());
      }

      NWMatcher = NW.Dom;
      return (Selector.select = select)(selector, context);
    };

    var NWMatcher, match = null, select = null;
  })(Fuse.Dom.Selector, Fuse.Dom.NodeList);
