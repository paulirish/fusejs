  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  (function(Selector) {
    function query(selectors, context) {
      return Selector.select(selectors, Fuse.get(context));
    }

    function rawQuery(selectors, context) {
      return Selector.rawSelect(selectors, Fuse.get(context));
    }

    Fuse.Util.$$  = 
    Fuse.query    = query;
    Fuse.rawQuery = rawQuery;
  })(Fuse.Dom.Selector);
