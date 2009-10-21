  /*------------------------------- DOM: NODE --------------------------------*/

  Node =
  Fuse.Dom.Node = (function() {
    function Decorator() { }

    function Node(node) {
      // return if already decoratored or falsy
      if (!node || node.raw) return node;

      // pass to element decorator
      switch (node.nodeType) {
        case 1: return fromElement(node);
        case 9: return Document(node);
      }

      var decorated,
       id = Node.getFuseId(node),
       data = Data[id];

      // return cached if available
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;

      data.node =
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      return decorated;
    }

    var Node = Class({ 'constructor': Node });
    Decorator.prototype = Node.plugin;
    return Node;
  })();

  // constants
  Node.DOCUMENT_FRAGMENT_NODE =      DOCUMENT_FRAGMENT_NODE;
  Node.DOCUMENT_NODE =               DOCUMENT_NODE;
  Node.ELEMENT_NODE =                ELEMENT_NODE;
  Node.ATTRIBUTE_NODE =              2;
  Node.TEXT_NODE =                   3;
  Node.CDATA_SECTION_NODE =          4;
  Node.ENTITY_REFERENCE_NODE =       5;
  Node.ENTITY_NODE =                 6;
  Node.PROCESSING_INSTRUCTION_NODE = 7;
  Node.COMMENT_NODE =                8;
  Node.DOCUMENT_TYPE_NODE =          10;
  Node.NOTATION_NODE =               12;

  Node.updateGenerics = (function() {
    var SKIPPED_KEYS = { 'constructor': 1, 'getFuseId': 1 };

    function createGeneric(proto, methodName) {
      return new Function('proto, slice',
        'function ' + methodName + '(node) {' +
        'node = Fuse.get(node);' +
        'var args = arguments;' +
        'return args.length ? proto.' + methodName +
        '.apply(node, slice.call(args, 1)) : ' +
        'proto.' + methodName + '.call(node); }' +
        'return ' + methodName)(proto, slice);
    }

    function updateGenerics(deep) {
      var Klass = this;
      if (deep) Fuse.updateGenerics(Klass, deep);
      else Obj._each(Klass.prototype, function(value, key, proto) {
        if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
          Klass[key] = createGeneric(proto, key);
      });
    }

    return updateGenerics;
  })();

  Node.plugin.getFuseId = (function() {
    function createGetter() {
      function getFuseId() {
        // if cache doesn't match, request a new id
        var c = Data[id];
        if (c.node && c.node !== this)
          return (this.getFuseId = createGetter())();
        return id;
      }
      // private id variable
      var id = fuseId;
      Data[fuseId++] = { };
      return getFuseId;
    }

    function getFuseId() {
      // keep a loose match because frame object !== document.parentWindow
      var id, node = this.raw || this, win = getWindow(node);

      if (node == win) {
        if (node == global) return 1;
        id = getFuseId(win.frameElement) + '-1';
        Data[id] = Data[id] || { };
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        if (node === Fuse._doc) return 2;
        id = getFuseId(win.frameElement) + '-2';
        Data[id] = Data[id] || { };
        return id;
      }
      else if (node.getFuseId)
        return node.getFuseId();

      return (node.getFuseId = createGetter())();
    }

    var fuseId = 3;
    return getFuseId;
  })();

  Node.getFuseId = (function(__getFuseId) {
    function getFuseId(node) {
      return __getFuseId.call(node);
    }
    return getFuseId;
  })(Node.plugin.getFuseId);

  Node.updateGenerics();
