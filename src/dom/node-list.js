  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  Fuse.Dom.NodeList = Fuse.Fusebox().Array;

  addListMethods(NodeList);

  (function(plugin) {
    var SKIPPED_PROPERTIES = {
      'constructor': 1,
      'match':       1,
      'select':      1
    };

    NodeList.from = function from(iterable) {
      if (!iterable || iterable == '') return NodeList();
      var object = Fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return NodeList.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = NodeList(length);
      while (length--) if (length in object) results[length] = Node(iterable[length]);
      return results;
    };

    NodeList.fromArray = function fromArray(array) {
      var results = new NodeList, length = array.length >>> 0;
      while (length--) results[length] = Node(array[length]);
      return results;
    };

    NodeList.fromNodeList = function fromNodeList(nodeList) {
      var i = 0, results = NodeList();
      while (results[i] = Node(nodeList[i++])) { }
      return results.length-- && results;
    };

    // ECMA 15.4.4.7
    plugin.push = function push() {
      if (this == null) throw new TypeError;
      var args = arguments, length = args.length, object = Object(this),
       pad = object.length >>> 0, newLength = pad + length;

      while (length--) this[pad + length] = new Node(args[length]);
      return newLength;
    };

    // ECMA-5 15.4.4.4
    plugin.concat = function concat() {
      if (this == null) throw new TypeError;
      var i = 0, args = arguments, length = args.length, object = Object(this),
       results = isArray(object) ? NodeList.fromArray(object) : NodeList(Node(object));

      for ( ; i < length; i++) {
        if (isArray(args[i])) {
          for (var j = 0, sub = args[i], subLen = sub.length; j < subLen; j++)
            results.push(Node(sub[j]));
        } else results.push(Node(args[i]));
      }
      return results;
    };

    // ECMA-5 15.4.4.13	
    plugin.unshift = (function(__unshift) {
      function unshift(item) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 1
          ? __unshift.apply(this, NodeList.fromArray(args))
          : __unshift.call(this, Node(item));
      }
      return unshift;
    })(plugin.unshift);

    // ECMA-5 15.4.4.12
    plugin.splice = (function(__splice) {
      function splice(start, deleteCount) {
        if (this == null) throw new TypeError;
        var args = arguments;
        return args.length > 2
          ? __splice.apply(this, concatList([start, deleteCount], NodeList.fromArray(slice.call(args, 2))))
          : __splice.apply(this, start, deleteCount);
      }
      return splice;
    })(plugin.splice);

    // make NodeList use Fuse.Array#map so values aren't passed through Fuse.Dom.Node
    plugin.map = Fuse.Array.plugin.map;

    // add Element methods
    eachKey(Element.plugin, function(value, key, object) {
      if (SKIPPED_PROPERTIES[key] || !hasKey(object, key)) return;

      plugin[key] = /^(?:(?:is|get|has)[A-Z]|ancestor|child|descendant|down|empty|first|identify|inspect|next|previous|read|scroll|sibling|visible)/.test(key) ?
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

    // prevent JScript bug with named function expressions
    var concat = nil, from = nil, fromArray = nil, fromNodeList = nil, push = nil;
  })(NodeList.plugin);
