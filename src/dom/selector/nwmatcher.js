  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, Node, NodeList, RawList) {
    Selector.match = function match(element, selector) {
      function match(element, selector) {
        return nwMatch(element.raw || element, String(selector || ''));
      }

      nwMatch = NW.Dom.match;
      return (Selector.match = match)(element, selector);
    };

    Selector.rawSelect = function rawSelect(selector, context, callback) {
      function rawSelect(selector, context, callback) {
        return nwSelect(String(selector || ''), context, RawList(), callback);
      }

      nwSelect = NW.Dom.select;
      return (Selector.rawSelect = rawSelect)(selector, context, callback);
    };

    Selector.select = function select(selector, context, callback) {
      function select(selector, context, callback) {
        var i = 0, results = NodeList();
        nwSelect(String(selector || ''), context, null, function(node) {
          node = results[i++] = Node(node);
          callback && callback(node);
        });
        return results;
      }

      nwSelect = NW.Dom.select;
      return (Selector.select = select)(selector, context, callback);
    };

    var nwMatch, nwSelect, match = nil, select = nil;
  })(Fuse.Dom.Selector, Fuse.Dom.Node, Fuse.Dom.NodeList, Fuse.Dom.RawList);
