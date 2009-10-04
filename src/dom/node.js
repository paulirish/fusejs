  /*------------------------------- DOM: NODE --------------------------------*/

  Node =
  Fuse.Dom.Node = (function() {
    var Decorator = function() { },

    Node = function Node(node) {
      // return if already decoratored or falsy
      if (!node || node.raw) return node;

      // pass to element decorator
      switch (node.nodeType) {
        case 1: return fromElement(node);
        case 9: return Document(node);
      }

      var decorated,
       id = Node.getFuseId(node),
       data = (Data[id] = Data[id] || { });

      // return cached if available
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;

      data.node =
      decorated.raw = node;

      return decorated;
    };

    Node = Class(Fuse.Dom, { 'constructor': Node });
    Decorator.prototype = Node.plugin;
    return Node;
  })();

  // Node constants
  Node.extend({
    'DOCUMENT_FRAGMENT_NODE':      DOCUMENT_FRAGMENT_NODE,
    'DOCUMENT_NODE':               DOCUMENT_NODE,
    'ELEMENT_NODE':                ELEMENT_NODE,
    'ATTRIBUTE_NODE':              2,
    'TEXT_NODE':                   3,
    'CDATA_SECTION_NODE':          4,
    'ENTITY_REFERENCE_NODE':       5,
    'ENTITY_NODE':                 6,
    'PROCESSING_INSTRUCTION_NODE': 7,
    'COMMENT_NODE':                8,
    'DOCUMENT_TYPE_NODE':          10,
    'NOTATION_NODE':               12
  }, null);

  Node.getFuseId = (function() {
    function createGetter() {
      function getFuseId() {
        // if cache doesn't match, request a new id
        var c = Data[id];
        if (c && c.node !== this)
          id = fuseId++;
        return id;
      }
      // private id variable
      var id = fuseId++;
      return getFuseId;
    }

    function getFuseId(node) {
      node = node.raw || node;

      // keep a loose match because frame object !== document.parentWindow
      var win = getWindow(node);
      if (node == win) {
        if (node == global) return 1;
        return getFuseId(win.frameElement) + '-1';
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        if (node === Fuse._doc) return 2;
        return getFuseId(win.frameElement) + '-2';
      }
      else if (node.getFuseId)
        return node.getFuseId();

      return (node.getFuseId = createGetter())();
    }

    var fuseId = 3;
    return getFuseId;
  })();

  Node.plugin.getFuseId = (function() {
    function getFuseId() { return (this.raw || this).getFuseId(); }
    return getFuseId;
  })();
