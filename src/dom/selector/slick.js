  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  Fuse.addNS('Dom.Selector');

  (function() {
    this.match = function match(element, selector) {
      return Slick.match(element, selector);
    };

    this.select = (function() {
      function select(selector, context) {
        return toList(Slick(context, selector));
      }
      var toList = Fuse.List.fromNodeList;
      return select;
    })();

    // prevent JScript bug with named function expressions
    var match = null
  }).call(Fuse.Dom.Selector);
