  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  Fuse.Util.$$ = 
  Fuse.query   = (function(Selector) {
    function query(selectors, context) {
      return Selector.select(selectors, Fuse.get(context));
    }
    return query;
  })(Fuse.Dom.Selector);
