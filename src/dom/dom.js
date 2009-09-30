  /*---------------------------------- DOM -----------------------------------*/

  Fuse._doc   = global.document;
  Fuse._div   = Fuse._doc.createElement('div');
  Fuse._docEl = Fuse._doc.documentElement;
  Fuse._info  = { };

  Fuse._info.docEl =
  Fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' }

  Fuse._info.body =
  Fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  // set the debug flag based on script debug query parameter
  Fuse.debug = (function() {
    var script, i = 0,
     matchDebug = /(^|&)debug=(1|true)(&|$)/,
     matchFilename = /(^|\/)fuse\.js\?/,
     scripts = Fuse._doc.getElementsByTagName('script');

    while (script = scripts[i++])
      if (matchFilename.test(script.src) &&
          matchDebug.test(script.src.split('?')[1])) return true;
    return false;
  })();

  getNodeName = Fuse._docEl.nodeName === 'HTML'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  getDocument =
  Fuse.getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === 9 ? element : Fuse._doc);
  };

  /* Based on work by Diego Perini */
  getWindow =
  Fuse.getWindow = (function() {
    var getWindow = function getWindow(element) {
      var frame, i = 0, doc = getDocument(element), frames = global.frames;
      if (Fuse._doc !== doc)
        while (frame = frames[i++])
          if (frame.document === doc) return frame;
      return global;
    };

    // Safari 2.0.x returns `Abstract View` instead of `global`
    if (isHostObject(Fuse._doc, 'defaultView') && Fuse._doc.defaultView === global) {
      getWindow = function getWindow(element) {
        return getDocument(element).defaultView || element;
      };
    }
    else if (isHostObject(Fuse._doc, 'parentWindow')) {
      getWindow = function getWindow(element) {
        return getDocument(element).parentWindow || element;
      };
    }
    return getWindow;
  })();
