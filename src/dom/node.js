  /*------------------------------- DOM: NODE --------------------------------*/

  Node =
  fuse.dom.Node = (function() {
    function Decorator() { }

    function Node(node) {
      // return if falsy or already decoratored
      if (!node || node.raw) return node;

      var data, decorated, id, ownerDoc;
      if (node.nodeType !== TEXT_NODE) {

        // switch flag to bail early for window objects
        retWindowId = false;
        id = getFuseId.call(node);
        retWindowId = true;

        // return if window
        if (!id) return node;

        // return cached if available
        if ((data = Data[id]).decorator) return data.decorator;

        // pass to element decorator
        switch (node.nodeType) {
          case ELEMENT_NODE:  return fromElement(node);
          case DOCUMENT_NODE: return Document(node);
        }
      }

      decorated = new Decorator;
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      if (data) {
        data.node = node;
        data.decorator = decorated;
      }

      return decorated;
    }

    function createIdGetter() {
      function getFuseId() {
        // if cache doesn't match, request a new id
        var c = Data[id];
        if (c.node && c.node !== this)
          return (this.getFuseId = createIdGetter())();
        return id;
      }
      // private id variable
      var id = String(fuseId);
      Data[fuseId++] = { };
      return getFuseId;
    }

    function getFuseId() {
      // keep a loose match because frame object !== document.parentWindow
      var id = false,
       node  = this.raw || this,
       win   = getWindow(node);

      if (node.getFuseId) {
        return node.getFuseId();
      }
      else if (node == win) {
        if (retWindowId) {
          id = '1';
          if (node != global) {
            id = getFuseId(win.frameElement) + '-1';
            Data[id] || (Data[id] = { });
          }
        }
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        if (node === fuse._doc) return '2';
        id = getFuseId(win.frameElement) + '-2';
        Data[id] || (Data[id] = { 'nodes': { } });
        return id;
      }
      return (node.getFuseId = createIdGetter())();
    }

    var fuseId = 3, retWindowId = true,
     Node = Class({ 'constructor': Node });

    Decorator.prototype = Node.plugin;
    Node.plugin.getFuseId = getFuseId;
    return Node;
  })();

  /*--------------------------------------------------------------------------*/

  Node.getFuseId = (function(__getFuseId) {
    function getFuseId(node) {
      return __getFuseId.call(node);
    }
    return getFuseId;
  })(Node.plugin.getFuseId);

  Node.updateGenerics = (function() {
    var SKIPPED_KEYS = { 'constructor': 1, 'getFuseId': 1 };

    function createGeneric(proto, methodName) {
      return new Function('proto, slice',
        'function ' + methodName + '(node) {' +
        'node = fuse.get(node);' +
        'var args = arguments;' +
        'return args.length ? proto.' + methodName +
        '.apply(node, slice.call(args, 1)) : ' +
        'proto.' + methodName + '.call(node); }' +
        'return ' + methodName)(proto, slice);
    }

    function updateGenerics(deep) {
      var Klass = this;
      if (deep) fuse.updateGenerics(Klass, deep);
      else Obj._each(Klass.prototype, function(value, key, proto) {
        if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
          Klass[key] = createGeneric(proto, key);
      });
    }

    return updateGenerics;
  })();

  // constants
  Node.DOCUMENT_FRAGMENT_NODE =      DOCUMENT_FRAGMENT_NODE;
  Node.DOCUMENT_NODE =               DOCUMENT_NODE;
  Node.ELEMENT_NODE =                ELEMENT_NODE;
  Node.TEXT_NODE =                   TEXT_NODE;
  Node.ATTRIBUTE_NODE =              2;
  Node.CDATA_SECTION_NODE =          4;
  Node.ENTITY_REFERENCE_NODE =       5;
  Node.ENTITY_NODE =                 6;
  Node.PROCESSING_INSTRUCTION_NODE = 7;
  Node.COMMENT_NODE =                8;
  Node.DOCUMENT_TYPE_NODE =          10;
  Node.NOTATION_NODE =               12;

  Node.updateGenerics();
