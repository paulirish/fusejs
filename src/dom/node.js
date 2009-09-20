  /*---------------------------------- NODE ----------------------------------*/

  Node =
  Fuse.addNS('Dom.Node', {
    'constructor': (function() {
      function Node(node) {
        if (this === Fuse.Dom)
          return new Node(node);

        if (node) {
          // return if already a decorator
          if (node.raw) return node;

          // return custom element class if available
          var klass, nodeName = node.nodeName;
          if (nodeName && this.constructor === Node &&
              (klass = Fuse.Dom[capitalize.call(nodeName) + 'Element']))
            return new klass(node);

          // return cached if available
          var id = Node.getFuseId(node),
           cache = (Data[id] = Data[id] || { });
          if (cache.decorator) return cache.decorator;
 
          cache.decorator = this;
          cache.node =
          this.raw = node;
        }
        else return node;
      }

      return Node;
    })()
  });

  // Node constants
  Node.extend({
    'ELEMENT_NODE':                1,
    'ATTRIBUTE_NODE':              2,
    'TEXT_NODE':                   3,
    'CDATA_SECTION_NODE':          4,
    'ENTITY_REFERENCE_NODE':       5,
    'ENTITY_NODE':                 6,
    'PROCESSING_INSTRUCTION_NODE': 7,
    'COMMENT_NODE':                8,
    'DOCUMENT_NODE':               9,
    'DOCUMENT_TYPE_NODE':          10,
    'DOCUMENT_FRAGMENT_NODE':      11,
    'NOTATION_NODE':               12
  }, null);

  Node.getFuseId = (function() {
    var fuseId = 3;

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
      else if (node.nodeType === 9) {
        if (node === Fuse._doc) return 2;
        return getFuseId(win.frameElement) + '-2';
      }
      else if (node.getFuseId)
        return node.getFuseId();

      return (node.getFuseId = createGetter())();
    }

    return getFuseId;
  })();
