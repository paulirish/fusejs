  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, Node, NodeList, RawList) {
    Selector.match = function match(element, selector) {
      function match(element, selector) {
        return nwMatch(element.raw || element, String(selector || ''));
      }

      nwMatch = NW.Dom.match;
      return (Selector.match = match)(element, selector);
    };

    Selector.rawSelect = function rawSelect(selector, context) {
      function rawSelect(selector, context) {
        context = context || Fuse._doc;
        return nwSelect(String(selector || ''), context.raw || context, RawList());
      }

      nwSelect = NW.Dom.select;
      return (Selector.rawSelect = rawSelect)(selector, context);
    };

    Selector.select = function select(selector, context) {
      function select(selector, context) {
        context = context || Fuse._doc;
        var i = 0, results = NodeList();
        nwSelect(String(selector || ''), context.raw || context, null,
          function(element) { results[i++] = Node(element); });
        return results;
      }

      nwSelect = NW.Dom.select;
      return (Selector.select = select)(selector, context);
    };

    var nwMatch, nwSelect, match = nil, select = nil;
  })(Fuse.Dom.Selector, Fuse.Dom.Node, Fuse.Dom.NodeList, Fuse.Dom.RawList);
