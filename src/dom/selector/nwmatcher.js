  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      function match(element, selector) {
        return NWMatcher.match(element, selector);
      }
      var NWMatcher = NW.Dom;
      return (this.match = match)(element, selector);
    };

    this.select = function select(selector, context) {
      function select(selector, context) {
        return $A(NWMatcher.select(selector, context), 0);
      }
      var NWMatcher = NW.Dom, $A = Fuse.Util.$A;
      return (this.select = select)(selector, context);
    };

    // prevent JScript bug with named function expressions
    var match = null, select = null;
  }).call(Fuse.Dom.Selector);
