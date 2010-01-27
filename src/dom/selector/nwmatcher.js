  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(Selector, Node, NodeList, RawList) {
    Selector.match = function match(element, selector, context) {
      function match(element, selector, context) {
        return __match(element.raw || element, String(selector || ''), context);
      }

      __match = NW.Dom.match;
      return (Selector.match = match)(element, selector, context);
    };

    Selector.rawSelect = function rawSelect(selector, context, callback) {
      function rawSelect(selector, context, callback) {
        var i = -1, results = RawList();
        __select(String(selector || ''), context, function(node) {
          results[++i] = node;
          callback && callback(node);
        });
        return results;
      }

      __select = NW.Dom.select;
      return (Selector.rawSelect = rawSelect)(selector, context, callback);
    };

    Selector.select = function select(selector, context, callback) {
      function select(selector, context, callback) {
        var i = -1, results = NodeList();
        __select(String(selector || ''), context, function(node) {
          node = results[++i] = Node(node);
          callback && callback(node);
        });
        return results;
      }

      __select = NW.Dom.select;
      return (Selector.select = select)(selector, context, callback);
    };

    var __match, __select, match = nil, select = nil;
  })(fuse.dom.Selector, fuse.dom.Node, fuse.dom.NodeList, fuse.dom.RawList);
