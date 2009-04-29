  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      return Slick.match(element, selector);
    };

    this.select = (function() {
      var select, toList = Fuse.List.fromNodeList;
      return select = Feature('ELEMENT_EXTENSIONS')
        ? function select(selector, context) {
            return toList(Slick(context, selector));
          }
        : function select(selector, context) {
            return toList(Slick(context, selector)).map(Element.extend);
          };
    })();

    // prevent JScript bug with named function expressions
    var match = null;
  }).call(Fuse.Dom.Selector);
