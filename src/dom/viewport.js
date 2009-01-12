  doc.viewport = (function() {
    function getDimensions() {
      return { 'width': this.getWidth(), 'height': this.getHeight() };
    }

    function getScrollOffsets() {
      // lazy define
      if ('pageXOffset' in global) {
        this.getScrollOffsets = function() {
          return Element._returnOffset(global.pageXOffset, global.pageYOffset);
        };
      } else {
        this.getScrollOffsets = function() {
          return Element._returnOffset(root.scrollLeft, root.scrollTop);
        };
      }
      return this.getScrollOffsets();
    }

    return {
      'getDimensions':    getDimensions,
      'getScrollOffsets': getScrollOffsets
    };
  })();

  // lazy define document.viewport.getWidth() and document.viewport.getHeight()
  (function(v) {
    var node;
    function define(D) {
      // Safari < 3 -> doc
      // Opera < 9.5, Quirks mode -> body
      // Others -> docEl
      node = node || ('clientWidth' in doc ? doc : root);
      v['get' + D] = function() { return node['client' + D] };
      return v['get' + D]();
    }
    v.getHeight = define.curry('Height');
    v.getWidth  = define.curry('Width');
  })(doc.viewport);
