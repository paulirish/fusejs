  /*--------------------------- DOCUMENT VIEWPORT ----------------------------*/

  Fuse._doc.viewport = { };

  (function() {
    this.getDimensions = function getDimensions() {
      return { 'width': this.getWidth(), 'height': this.getHeight() };
    };

    this.getScrollOffsets = function getScrollOffsets() {
      // lazy define
      return (this.getScrollOffsets =
        typeof global.pageXOffset === 'number' ?
          function() {
            return Element._returnOffset(global.pageXOffset, global.pageYOffset);
          } :
          function() {
            return Element._returnOffset(Fuse._scrollEl.scrollLeft, Fuse._scrollEl.scrollTop);
          }
      )();
    };

    // prevent JScript bug with named function expressions
    var getDimensions = null, getScrollOffsets = null;
  }).call(Fuse._doc.viewport);

  // lazy define document.viewport.getWidth() and document.viewport.getHeight()
  (function(v) {
    var node;
    function define(D) {
      // Safari < 3 -> doc
      // Opera  < 9.5, Quirks mode -> body
      // Others -> docEl
      node = node || ('clientWidth' in Fuse._doc ? Fuse._doc : Fuse._root);
      v['get' + D] = function() { return Fuse.Number(node['client' + D]) };
      return v['get' + D]();
    }
    v.getHeight = Fuse.Function.curry(define, 'Height');
    v.getWidth  = Fuse.Function.curry(define, 'Width');
  })(Fuse._doc.viewport);
