  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  (function(Selector) {
    function query(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return Selector.select(selectors,
        context && Fuse.get(context).raw || Fuse._doc, callback);
    }

    function rawQuery(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return Selector.rawSelect(selectors,
        context && Fuse.get(context).raw || Fuse._doc, callback);
    }

    Fuse.Util.$$  = 
    Fuse.query    = query;
    Fuse.rawQuery = rawQuery;
  })(Fuse.Dom.Selector);
