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

  Fuse.version = '<%= FUSEJS_VERSION %>';

  /*----------------------- PRIVATE VARIABLES/METHODS ------------------------*/

  var Bug, Data, Element, Feature, Field, Form, Func, Obj, Node, NodeList,
   _extend, addListMethods, bind, capitalize, clone, decorate, defer, eachKey,
   hasKey, inspect, isArray, isElement, isEmpty, isHash, isFunction, isNumber,
   isPrimitive, isRegExp, isSameOrigin, isString, isUndefined, undef,

   $break =
   Fuse.$break = function $break() { },

   emptyFunction =
   Fuse.emptyFunction = function emptyFunction() { },

   K =
   Fuse.K = function K(x) { return x },

   concatList = function(list, otherList) {
     var pad = list.length, length = otherList.length;
     while (length--) list[pad + length] = otherList[length];
     return list;
   },

   escapeRegExpChars = (function() {
     var matchSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
     return function(string) {
       return String(string).replace(matchSpecialChars, '\\$1');
     };
   })(),

   // a unqiue 15 char id used throughout Fuse
   expando = '_fuse' + String(+new Date).slice(0, 10),

   // Check for `ownerDocument` first because an element of a document fragment
   // will have a `document` property that is NOT the pages document object.
   getDocument = function(element) {
     return element.ownerDocument || element.document ||
       (element.nodeType === 9 ? element : Fuse._doc);
   },

   getNodeName = Fuse._docEl.nodeName === 'HTML'
     ? function(element) { return element.nodeName }
     : function(element) { return element.nodeName.toUpperCase() },

   getWindow = function(element) {
     var frame, i = 0, doc = getDocument(element), frames = global.frames;
     if (Fuse._doc !== doc) {
       while (frame = frames[i++]) {
         if (frame.document === doc) return frame;
       }
     }
     return global;
   },

   // Host objects have a range of typeof values. For example:
   // document.createElement('div').offsetParent -> unknown
   // document.createElement -> object
   isHostObject = function(object, property) {
     var type = typeof object[property];
     return type === 'function' || type === 'object' || type === 'unknown';
   },

   // Allow a pre-sugared array to be passed
   prependList = function(list, value, results) {
     (results = results || [])[0] = value;
     var length = list.length;
     while (length--) results[1 + length] = list[length];
     return results;
   },

   // a quick way to copy an array slice.call(array, 0)
   slice = global.Array.prototype.slice,

   // ECMA-5 9.4 ToInteger implementation
   toInteger = (function() {
     var abs = Math.abs, floor = Math.floor,
      maxBitwiseNumber = Math.pow(2, 31);

     return function(object) {
       var number = +object; // fast coerce to number
       if (number == 0 || !isFinite(number)) return number || 0;

       // avoid issues with large numbers against bitwise operators
       return number < maxBitwiseNumber
         ? number | 0
         : (number < 0 ? -1 : 1) * floor(abs(number));
     };
   })(),

   // used to access the an object's internal [[Class]] property
   toString = global.Object.prototype.toString,

   // used for some required browser sniffing
   userAgent = global.navigator.userAgent;

  // Based on work by Diego Perini
  // Safari 2.0.x returns `Abstract View` instead of `global`
  if (isHostObject(document, 'defaultView') && Fuse._doc.defaultView === global)
    getWindow = function(element) { return getDocument(element).defaultView || element };
  else if (isHostObject(Fuse._doc, 'parentWindow'))
    getWindow = function(element) { return getDocument(element).parentWindow || element };

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
   'lang/console.js',

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

   
   'dom/data.js',
   'dom/node.js',

   'dom/element/element.js',
   'dom/element/attribute.js',
   'dom/element/style.js',
   'dom/element/position.js',

   'dom/form/field.js',
   'dom/form/form.js',

   'lang/grep.js',
   'lang/inspect.js',
   'lang/json.js',

   'dom/node-list.js',
   'dom/selector/selector.js',
   'dom/selector/nwmatcher.js',
   'dom/element/traversal.js',

   'dom/event/event.js',
   'dom/event/dom-loaded.js',

   'ajax/ajax.js',
   'ajax/responders.js',
   'ajax/base.js',
   'ajax/request.js',
   'ajax/updater.js',
   'ajax/timed-updater.js') %>
  /*--------------------------------------------------------------------------*/

  // update native generics and element methods
  Fuse.updateGenerics();

  if (global.Event && global.Event.Methods)
    Event.addMethods();
})(this);
