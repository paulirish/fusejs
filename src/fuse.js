<%= include 'HEADER' %>
(function(global) {
  global.Fuse = {
    '_body':          null,
    '_root':          null,
    '_scrollEl':      null,
    '_div':           document.createElement('div'),
    '_doc':           document,
    '_docEl':         document.documentElement,
    'JSONFilter':     /^\/\*-secure-([\s\S]*)\*\/\s*$/, 
    'ScriptFragment': '<script[^>]*>([^\\x00]*?)<\/script>',
    'Version':        '<%= FUSEJS_VERSION %>'
  };

  Fuse.emptyFunction = (function() {
    function emptyFunction() { }
    return emptyFunction;
  })();

  Fuse.K = (function() {
    function K(x) { return x }
    return K;
  })();

  Fuse._info = {
    'body':  { 'nodeName': 'BODY', 'property': 'body' },
    'docEl': { 'nodeName': 'HTML', 'property': 'documentElement' }
  };

  Fuse._info.root = Fuse._info.docEl;
  Fuse._info.scrollEl = Fuse._info.body;

  /*----------------------- PRIVATE VARIABLES/METHODS ------------------------*/

  var Bug, Feature,
   expando = '_fuse' + String(+new Date).slice(0, 10),
   slice = Array.prototype.slice,
   userAgent = global.navigator.userAgent;

  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  function isHostObject(object, property) {
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  function getDocument(element) { // assume element is not null
    // Check for `ownerDocument` first because an element of a document fragment
    // will have a `document` property that is NOT the pages document object.
    return element.ownerDocument || element.document ||
      (element.nodeType === 9 ? element : Fuse._doc);
  }

  function concatList(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  }

  function prependList(list, value) {
    var results = [value], length = list.length;
    while (length--) results[1 + length] = list[length];
    return results;
  }

  var getNodeName = Fuse._docEl.nodeName === 'HTML'
    ? function getNodeName(element) { return element.nodeName }
    : function getNodeName(element) { return element.nodeName.toUpperCase() };

  /* Based on work by Diego Perini */
  var getWindow =
    isHostObject(Fuse._doc, 'parentWindow') ?
      function getWindow(element) {
        return getDocument(element).parentWindow || element;
      } :
    isHostObject(document, 'defaultView') && Fuse._doc.defaultView === global ?
      function getWindow(element) {
        return getDocument(element).defaultView || element;
      } :
    function getWindow(element) {
      // Safari 2.0.x returns `Abstract View` instead of `global`
      var frame, i = 0, doc = getDocument(element);
      if (Fuse._doc !== doc) {
        while (frame = global.frames[i++]) {
          if (frame.document === doc) return frame;
        }
      }
      return global;
    };

  // IE throws an error when passing a nodeList to slice.call()
  // Safari 2 will return a full array with undefined values
  // Opera 9.2x will return an empty array if an element has an id of `length`
  var nodeListSlice = (function() {  
    var nodeListSlice = function nodeListSlice(begin, end) {
      var i = 0, results = [];
      while (results[i] = this[i++]) { }
      results.length--;
      return !begin && end == null ?
        results : results.slice(begin || 0, end || results.length);
    };

    Fuse._div.innerHTML = '<div id="length"></div>';
    Fuse._docEl.insertBefore(Fuse._div, Fuse._docEl.firstChild);

    try {
      if (slice.call(Fuse._div.childNodes, 0)[0])
        nodeListSlice = slice;
    } catch(e) {
      // IE8 throws an error when accessing a non-existant item of a StaticNodeList.
      // TODO: Confirm using instanceof on elements causes a memory leak in IE8
      var _nodeListSlice = nodeListSlice;
      nodeListSlice = function nodeListSlice(begin, end) {
        if (this != '[object StaticNodeList]')
          return _nodeListSlice.call(this, begin, end);
        var i = 0, results = [];
        while (typeof this[i] === 'object')
          results[i] = this[i++];
        return !begin && end == null ?
          results : results.slice(begin || 0, end || results.length);
      };
    }

    Fuse._docEl.removeChild(Fuse._div).innerHTML = '';
    return nodeListSlice;
  })();

  /*--------------------------- NAMESPACE UTILITY ----------------------------*/

  Fuse.addNS = function(path) {
    var part, object = this, propIndex = 0, parts = path.split('.'),
     length = parts.length, i = 0, properties = slice.call(arguments, 1);

    // if parent is passed then incriment the propIndex by 1
    if (typeof properties[0] === 'function') propIndex++;
    properties[propIndex] = properties[propIndex] || { };

    while (part = parts[i++]) {
      if (object[part]) {
        object = object[part];
      } else {
        if (i === length) {
          // if no parent pass prepend object as parent
          if (!propIndex) properties = prependList(properties, object);
          object = object[part] = Fuse.Class.apply(null,
            Fuse.Object.hasKey(properties[1], 'constructor') ? properties :
              (properties[1].constructor = part) && properties);
        }
        else object = object[part] = Fuse.Class(object, { 'constructor': part });
      }
    }
    return object;
  };

<%= include(
   'browser.js',
   'features.js',
   'fusebox.js',

   'lang/object.js',
   'lang/class.js',

   'lang/function.js',
   'lang/enumerable.js',
   'lang/array.js',
   'lang/number.js',
   'lang/regexp.js',
   'lang/string.js',

   'lang/hash.js',
   'lang/range.js',
   'lang/template.js',
   'lang/timer.js',
   'lang/json.js',

   'ajax/ajax.js',
   'ajax/responders.js',
   'ajax/base.js',
   'ajax/request.js',
   'ajax/response.js',
   'ajax/updater.js',
   'ajax/timed-updater.js',

   'dom/element/element.js',
   'dom/element/attribute.js',
   'dom/element/style.js',
   'dom/element/traversal.js',
   'dom/element/position.js',
   'dom/element/helpers.js',

   'dom/form/form.js',
   'dom/form/timed-observer.js',
   'dom/form/event-observer.js',

   'dom/node.js',
   'dom/viewport.js',
   'dom/selector.js',

   'dom/event/event.js',
   'dom/event/dom-loaded.js') %>
  /*--------------------------------------------------------------------------*/

  Element.addMethods();
})(this);
