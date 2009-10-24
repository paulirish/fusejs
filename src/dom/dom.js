  /*---------------------------------- DOM -----------------------------------*/

  Data =
  Fuse.addNS('Dom.Data');

  Data['1'] = { };
  Data['2'] = { };

  Fuse._doc   = global.document;
  Fuse._div   = Fuse._doc.createElement('DiV');
  Fuse._docEl = Fuse._doc.documentElement;
  Fuse._info  = { };

  Fuse._info.docEl =
  Fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' }

  Fuse._info.body =
  Fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  /*--------------------------------------------------------------------------*/

  // make Fuse() pass to Fuse.get()
  Fuse =
  global.Fuse = (function(__Fuse) {
    function Fuse(object, context) {
      return Fuse.get(object, context);
    }
    return Obj.extend(Class({ 'constructor': Fuse }), __Fuse,
      function(value, key, object) { if (hasKey(object, key)) object[key] = value; });
  })(Fuse);

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

  (function() {
    function $(element) {
      var elements, args = arguments, length = args.length;
      if (length > 1) {
        elements = NodeList();
        while (length--) elements[length] = $(args[length]);
        return elements;
      }
      if (isString(element))
        element = doc.getElementById(element || expando);
      return element && fromElement(element);
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

      return object && Node(object);
    }

    function getById(id, context) {
      var element = (context || doc).getElementById(id || expando);
      return element && fromElement(element);
    }

    var doc = Fuse._doc;

    Fuse.get = get;
    Fuse.getById = getById;

    Fuse.addNS('Util');
    Fuse.Util.$ = $;
  })();

  /*--------------------------------------------------------------------------*/

  getDocument =
  Fuse.getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === DOCUMENT_NODE ? element : Fuse._doc);
  };

  // Based on work by Diego Perini
  getWindow =
  Fuse.getWindow = function getWindow(element) {
    var frame, i = 0, doc = getDocument(element), frames = global.frames;
    if (Fuse._doc !== doc)
      while (frame = frames[i++])
        if (frame.document === doc) return frame;
    return global;
  };

  // HTML document coerce nodeName to uppercase
  getNodeName = Fuse._div.nodeName === 'DIV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  returnOffset = function(left, top) {
    var result  = Fuse.Array(Fuse.Number(left || 0), Fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };

  // Safari 2.0.x returns `Abstract View` instead of `global`
  if (isHostObject(Fuse._doc, 'defaultView') && Fuse._doc.defaultView === global) {
    getWindow = function getWindow(element) {
      return getDocument(element).defaultView || element;
    };
  } else if (isHostObject(Fuse._doc, 'parentWindow')) {
    getWindow = function getWindow(element) {
      return getDocument(element).parentWindow || element;
    };
  }
