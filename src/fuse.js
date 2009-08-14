<%= include 'HEADER' %>
(function(global) {

  var Fuse =
  global.Fuse = function Fuse() { };

  Fuse._body =
  Fuse._root =
  Fuse._scrollEl = null;

  Fuse._doc =   document;
  Fuse._div =   Fuse._doc.createElement('div');
  Fuse._docEl = Fuse._doc.documentElement;

  Fuse._info = {
    'body':  { 'nodeName': 'BODY', 'property': 'body' },
    'docEl': { 'nodeName': 'HTML', 'property': 'documentElement' }
  };

  Fuse._info.root = Fuse._info.docEl;
  Fuse._info.scrollEl = Fuse._info.body;

  Fuse.JSONFilter =     /^\/\*-secure-([\s\S]*)\*\/\s*$/;
  Fuse.ScriptFragment = '<script[^>]*>([^\\x00]*?)<\/script>';
  Fuse.Version =        '<%= FUSEJS_VERSION %>';

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

  /*----------------------- PRIVATE VARIABLES/METHODS ------------------------*/

  var $, Bug, Feature, Obj, Func, _extend, bind, clone, defer, undef,
   eachKey, hasKey, inspect, isArray, isElement, isEmpty, isHash, isFunction,
   isNumber, isPrimitive, isSameOrigin, isString, isRegExp, isUndefined,

   emptyFunction =
   Fuse.emptyFunction = function emptyFunction() { },

   K =
   Fuse.K = function K(x) { return x },

   // a unqiue 15 char id used throughout Fuse
   expando = '_fuse' + String(1 * new Date).slice(0, 10),

   // a quick way to copy an array slice.call(array, 0)
   slice = global.Array.prototype.slice,

   // used to access the an object's internal [[Class]] property
   toString = global.Object.prototype.toString,

   // used for some required browser sniffing
   userAgent = global.navigator.userAgent;


  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  function isHostObject(object, property) {
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  function getDocument(element) {
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

  function prependList(list, value, results) {
    // allow a pre-sugared array to be passed
    (results = results || [])[0] = value;
    var length = list.length;
    while (length--) results[1 + length] = list[length];
    return results;
  }

  var getNodeName =
    function getNodeName(element) { return element.nodeName.toUpperCase() };
  if (Fuse._docEl.nodeName === 'HTML')
    getNodeName = function getNodeName(element) { return element.nodeName };

  // based on work by Diego Perini
  var getWindow = function getWindow(element) {
    // Safari 2.0.x returns `Abstract View` instead of `global`
    var frame, i = 0, doc = getDocument(element), frames = global.frames;
    if (Fuse._doc !== doc) {
      while (frame = frames[i++]) {
        if (frame.document === doc) return frame;
      }
    }
    return global;
  };

  if (isHostObject(Fuse._doc, 'parentWindow')) {
    getWindow = function getWindow(element) {
      return getDocument(element).parentWindow || element;
    };
  }
  else if (isHostObject(document, 'defaultView') && Fuse._doc.defaultView === global) {
    getWindow = function getWindow(element) {
      return getDocument(element).defaultView || element;
    };
  }

  /*--------------------------- NAMESPACE UTILITY ----------------------------*/

  Fuse.addNS = function(path) {
    var part, i = 0,
     global     = Fuse._global,
     object     = this,
     propIndex  = 0,
     parts      = path.split('.'),
     length     = parts.length,
     properties = slice.call(arguments, 1);

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
          object = object[part] = Fuse.Class.apply(global,
            hasKey(properties[1], 'constructor') ? properties :
              (properties[1].constructor = part) && properties);
        }
        else object = object[part] = Fuse.Class(object, { 'constructor': part });
      }
    }
    return object;
  };

<%= include(
   'env.js',
   'features.js',
   'fusebox.js',

   'lang/object.js',
   'lang/class.js',
   'lang/exception.js',

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

   'dom/selector/nwmatcher.js',

   'dom/event/event.js',
   'dom/event/dom-loaded.js') %>
  /*--------------------------------------------------------------------------*/

  // update native generics and element methods
  Fuse.updateGenerics();
  Element.addMethods();
})(this);
