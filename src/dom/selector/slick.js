  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function() {
    this.match = function match(element, selector) {
      return slick.match(element, String(selector || ''));
    };

    this.select = (function() {
      var select = function select(selector, context) {
        return toList(slick(context || Fuse._doc, String(selector || '')))
          .map(Element.extend);
      };

      if (Feature('ELEMENT_EXTENSIONS'))
        select = function select(selector, context) {
          return toList(slick(context || Fuse._doc, String(selector || '')));
        };

      var toList = Fuse.List.fromNodeList;
      return select;
    })();

    // prevent JScript bug with named function expressions
    var match = null;
  }).call(Fuse.Dom.Selector);
