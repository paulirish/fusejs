  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      function match(element, selector) {
        return NWMatcher.match(element, String(selector || ''));
      }
      var NWMatcher = NW.Dom;
      return (this.match = match)(element, selector);
    };

    this.select = function select(selector, context) {
      var select = function select(selector, context) {
        return NWMatcher.select(String(selector || ''), context || Fuse._doc, Fuse.List())
          .map(Element.extend);
      };

      if (Feature('ELEMENT_EXTENSIONS'))
        select = function select(selector, context) {
          return NWMatcher.select(String(selector || ''), context || Fuse._doc, Fuse.List());
        };

      var NWMatcher = NW.Dom;
      return (this.select = select)(selector, context);
    };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
