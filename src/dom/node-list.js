  /*----------------------------- DOM: NODELIST ------------------------------*/

  Fuse.addNS('Dom');

  NodeList =
  Fuse.Dom.NodeList = (new Fuse.Fusebox()).Array;

  NodeList.plugin.push = (function() {
    function push() {
      var args = arguments, length = args.length, 
       pad = this.length, newLength = pad + length;
      while (length--) this[pad + length] = new Node(args[length]);
      return newLength;
    }
    return push;
  })();

  addListMethods(NodeList);
