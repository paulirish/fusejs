  /*---------------------------------- DOM -----------------------------------*/

  fuse.addNS('dom');

  Data =
  fuse.dom.Data = { };

  Data['1'] = { };
  Data['2'] = { 'nodes': { } };

  fuse._doc   = global.document;
  fuse._div   = fuse._doc.createElement('DiV');
  fuse._docEl = fuse._doc.documentElement;
  fuse._info  = { };

  fuse._info.docEl =
  fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' };

  fuse._info.body =
  fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  /*--------------------------------------------------------------------------*/

  // make fuse() pass to fuse.get()
  fuse =
  global.fuse = (function(__fuse) {
    function fuse(object, context) {
      return fuse.get(object, context);
    }
    return Obj.extend(Class({ 'constructor': fuse }), __fuse,
      function(value, key, object) { if (hasKey(object, key)) object[key] = value; });
  })(fuse);

  // set the debug flag based on the fuse.js debug query parameter
  fuse.debug = (function() {
    var script, i = 0,
     matchDebug = /(^|&)debug=(1|true)(&|$)/,
     matchFilename = /(^|\/)fuse\.js\?/,
     scripts = fuse._doc.getElementsByTagName('script');

    while (script = scripts[i++])
      if (matchFilename.test(script.src) &&
          matchDebug.test(script.src.split('?')[1])) return true;
    return false;
  })();

  (function() {
    function $(element) {
      var elements, args = arguments, length = args.length;
      if (length > 1) {
        elements = NodeList();
        while (length--) elements[length] = $(args[length]);
        return elements;
      }
      if (isString(element)) {
        element = doc.getElementById(element || expando);
        return element && fromElement(element);
      }

      return Node(element);
    }

    function get(object, attributes, context) {
      if (isString(object)) {
        if (attributes && typeof attributes.nodeType !== 'string')
          return Element.create(object, attributes, context);

        context = attributes;
        if (object.charAt(0) == '<')
          return Element.create(object, context);
        object = (context || doc).getElementById(object || expando);
        return object && fromElement(object);
      }

      return Node(object);
    }

    function getById(id, context) {
      var element = (context || doc).getElementById(id || expando);
      return element && fromElement(element);
    }

    var doc = fuse._doc;

    fuse.get = get;
    fuse.getById = getById;

    fuse.addNS('util');
    fuse.util.$ = $;
  })();

  /*--------------------------------------------------------------------------*/

  getDocument =
  fuse.getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === DOCUMENT_NODE ? element : fuse._doc);
  };

  // Based on work by Diego Perini
  getWindow =
  fuse.getWindow = function getWindow(element) {
    var frame, i = 0, doc = getDocument(element), frames = global.frames;
    if (fuse._doc !== doc)
      while (frame = frames[i++])
        if (frame.document === doc) return frame;
    return global;
  };

  // HTML document coerce nodeName to uppercase
  getNodeName = fuse._div.nodeName === 'DIV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  returnOffset = function(left, top) {
    var result  = fuse.Array(fuse.Number(left || 0), fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };

  // Safari 2.0.x returns `Abstract View` instead of `global`
  if (isHostObject(fuse._doc, 'defaultView') && fuse._doc.defaultView === global) {
    getWindow = function getWindow(element) {
      return getDocument(element).defaultView || element;
    };
  } else if (isHostObject(fuse._doc, 'parentWindow')) {
    getWindow = function getWindow(element) {
      return getDocument(element).parentWindow || element;
    };
  }
