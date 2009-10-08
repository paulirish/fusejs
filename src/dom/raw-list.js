  /*------------------------------ DOM: RAWLIST ------------------------------*/

  RawList =
  Fuse.Dom.RawList = Fuse.Fusebox().Array;

  addListMethods(RawList);

  (function(plugin) {
    var SKIPPED_PROPERTIES = {
      'constructor': 1,
      'match':       1,
      'select':      1
    };

    // add Element methods
    eachKey(Element.plugin, function(value, key, object) {
      if (SKIPPED_PROPERTIES[key] || !hasKey(object, key)) return;

      plugin[key] = /^(?:(?:is|get|has)[A-Z]|ancestor|child|descendant|down|empty|first|identify|next|previous|read|scroll|sibling|visible)/.test(key) ?
        // getters return the value of the first element
        function() {
          var args = arguments, first = this[0];
          if (first) return args.length
            ? first[key].apply(first, args)
            : first[key]();
        } :
        // setters are called for each element in the list
        function() {
          var node, args = arguments, i = 0;
          if (args.length)
            while (node = this[i++]) node[key].apply(node, args);
          else while (node = this[i++]) node[key]();
          return this;
        };
    });
  })(RawList.plugin);
