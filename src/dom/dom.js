  /*---------------------------------- DOM -----------------------------------*/

  Data =
  Fuse.addNS('Dom.Data');

  Data['1'] = { };
  Data['2'] = { };

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

  /*--------------------------------------------------------------------------*/

  // set the debug flag based on the fuse.js debug query parameter
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

  getDocument =
  Fuse.getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === DOCUMENT_NODE ? element : Fuse._doc);
  };

  // based on work by Diego Perini
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

  getNodeName = Fuse._docEl.nodeName === 'HTML'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  returnOffset = function(left, top) {
    var result  = Fuse.Array(Fuse.Number(left || 0), Fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };
