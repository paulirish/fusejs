  /*----------------------------- DOM: DOCUMENT ------------------------------*/

  Document = (function() {
    var Document = function Document(node) {
      // bail if empty, already decorated, or not a document node
      if (!node || node.raw || node.nodeType !== 9)
        return node;

      var decorated, pluginViewport, viewport,
       id = Node.getFuseId(node),
       data = (Data[id] = Data[id] || { });

      // return cached if available
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;

      pluginViewport = Document.plugin.viewport;
      viewport = decorated.viewport = { };

      data.node =
      viewport.ownerDocument =
      decorated.raw = node;

      eachKey(pluginViewport, function(value, key, object) {
        if (hasKey(object, key)) viewport[key] = value;
      });

      return decorated;
    };

    function Decorator() { }
    Document = Fuse.addNS('Dom.Document', Node, { 'constructor': Document });
    Decorator.prototype = Document.plugin;

    return Document;
  })();

  (function(plugin) {
    var viewport =
    plugin.viewport = { };

    function define() {
      function getHeight() {
        return Fuse.Number(dimensionNode.clientHeight);
      }

      function getWidth() {
        return Fuse.Number(dimensionNode.clientWidth);
      }

      // Safari < 3 -> doc
      // Opera  < 9.5, Quirks mode -> body
      // Others -> docEl
      var doc = this.ownerDocument,
       dimensionNode = 'clientWidth' in doc ? doc : doc[Fuse._info.root.property];

      // lazy define methods
      this.getHeight = getHeight;
      this.getWidth  = getWidth;

      return this[arguments[0]]();
    }

    plugin.getFuseId = function getFuseId() {
      return Node.getFuseId(this.raw|| this);
    };

    viewport.getDimensions = function getDimensions() {
      return { 'width': this.getWidth(), 'height': this.getHeight() };
    };

    viewport.getHeight = function getHeight() {
      return define.call(this, 'getHeight');
    };

    viewport.getWidth = function getWidth() {
      return define.call(this, 'getWidth');
    };

    viewport.getScrollOffsets = (function() {
      var getScrollOffsets = function getScrollOffsets() {
        return returnOffset(global.pageXOffset, global.pageYOffset);
      };

      if (typeof global.pageXOffset !== 'number')
        getScrollOffsets = function getScrollOffsets() {
          var scrollEl = Fuse._scrollEl;
          return returnOffset(scrollEl.scrollLeft, scrollEl.scrollTop);
        };

      return getScrollOffsets;
    })();

    // prevent JScript bug with named function expressions
    var getDimensions = nil,
     getFuseId =        nil,
     getHeight =        nil,
     getWidth =         nil,
     getScrollOffsets = nil;
  })(Document.plugin);
