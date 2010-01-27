  /*------------------------------ DOM: RAWLIST ------------------------------*/

  RawList =
  fuse.dom.RawList = fuse.Fusebox().Array;

  addArrayMethods(RawList);

  (function(plugin) {
    var SKIPPED_PROPERTIES = {
      'constructor': 1,
      'match':       1,
      'select':      1
    };

    // add Element methods
    eachKey(Element.plugin, function(value, key, object) {
      if (SKIPPED_PROPERTIES[key] || !hasKey(object, key)) return;

      plugin[key] = /^(?:(?:is|get|has)[A-Z]|ancestor|child|descendant|down|empty|first|identify|inspect|next|previous|read|scroll|sibling|visible)/.test(key) ?
        // getters return the value of the first element
        function() {
          var args = arguments, first = this[0];
          if (first) return args.length
            ? object[key].apply(first, args)
            : object[key].call(first);
        } :
        // setters are called for each element in the list
        function() {
          var node, args = arguments, i = 0;
          if (args.length)
            while (node = this[i++]) object[key].apply(node, args);
          else while (node = this[i++]) object[key].call(node);
          return this;
        };
    });
  })(RawList.plugin);
