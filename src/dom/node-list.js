  /*------------------------------- NODE LIST --------------------------------*/

  Fuse.addNS('Dom');

  NodeList =
  Fuse.Dom.NodeList = (new Fuse.Fusebox()).Array;

  (function(plugin) {
    plugin.push = function push() {
      var args = arguments, length = args.length, 
       pad = this.length, newLength = pad + length;
      while (length--) this[pad + length] = new Node(args[length]);
      return newLength;
    };

    // add Fuse.Array.plugin methods
    eachKey(Fuse.Array.plugin, function(value, key, object) {
      if (hasKey(object, key) && !isFunction(plugin[key]))
        plugin[key] = value;
    });

    plugin.constructor = NodeList;

    // prevent JScript bug with named function expressions
    var push = null;
  })(NodeList.plugin);
