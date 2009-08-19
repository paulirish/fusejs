  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  (function(Selector) {
    Fuse.Util.$$ = 
    Fuse.query = function query(selectors, context) {
      return Selector.select(selectors, $(context));
    };

    // prevent JScript bug with named function expressions
    var query = null;
  })(Fuse.Dom.Selector);