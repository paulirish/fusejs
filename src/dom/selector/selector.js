  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  (function(Selector) {
    function $$(selectors) {
      var callback, context, args = slice.call(arguments, 0);
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();
      if (!isString(args[args.length - 1]))
        context = args.pop();

      return query(args.length
        ? slice.call(args).join(',')
        : selectors, context, callback);
    }

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

    Fuse.Util.$$  = $$;
    Fuse.query    = query;
    Fuse.rawQuery = rawQuery;
  })(Fuse.Dom.Selector);
