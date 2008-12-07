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
        var node = Bug('BODY_ACTING_AS_ROOT') ? body : docEl;
        this.getScrollOffsets = function() {
          return Element._returnOffset(node.scrollLeft, node.scrollTop);
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
      node = node ||
        (Bug('BODY_ACTING_AS_ROOT') ? body :     // Opera < 9.5, Quirks mode
          ('clientWidth' in doc) ? doc : docEl); // Safari < 3 : Others
      v['get' + D] = function() { return node['client' + D] };
      return v['get' + D]();
    }
    v.getHeight = define.curry('Height');
    v.getWidth  = define.curry('Width');
  })(doc.viewport);
