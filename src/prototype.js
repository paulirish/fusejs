<%= include 'HEADER' %>
(function(global) {
  var body, root,
   doc       = document,
   docEl     = doc.documentElement,
   userAgent = navigator.userAgent,
   dummy     = doc.createElement('div'),
   slice     = Array.prototype.slice;

  // IE will throw an error when attempting to
  // pass a nodeList to slice.call() AND
  // Safari 2 will return a full array with undefined values
  var nodeListSlice = slice;
  (function() {
    var result;
    try { result = nodeListSlice.call(docEl.childNodes, 0) } catch(e) { }
	if (result && result[0] && result[0].nodeType === 1) return;

	nodeListSlice = function(begin, end) {
      return !begin && arguments.length < 2 ?
        $A(this) : $A(this).slice(begin, end);
    };
  })();

  function mergeList(list, other) {
    list = slice.call(list, 0); // quick shallow clone
    var pad = list.length, length = other.length;
    while (length--) list[pad + length] = other[length];
    return list;
  }

  function prependList(list, value) {
    (list = slice.call(list, 0)).unshift(value);
    return list;
  }

  function getOwnerDoc(element) { // assume element is not null
    return element.ownerDocument || (element.nodeType === 9  ? element : doc);
  }

  function isHostObject(object, property) {
    // Host objects have a range of typeof values. For example:
    // doc.createElement('div').offsetParent -> unknown
    // doc.createElement -> object
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  /*---------------------------- PROTOTYPE OBJECT ----------------------------*/

  var P = Prototype = {
    Version: '<%= PROTOTYPE_VERSION %>',

    Browser: {
      'IE':     isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') === -1,
      'Opera':  userAgent.indexOf('Opera') > -1,
      'WebKit': userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko':  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
      'MobileSafari': !!userAgent.match(/AppleWebKit.*Mobile/)
    },

    BrowserFeatures: {
      'XPath': isHostObject(doc, 'evaluate'),
      'SelectorsAPI': isHostObject(doc, 'querySelector'),
      'ElementExtensions': isHostObject(global,'HTMLElement'),
      'SpecificElementExtensions': isHostObject(dummy, '__proto__') &&
        dummy['__proto__'] !== document.createElement('form')['__proto__']
    },

    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  

    emptyFunction: function() { },
    K: function(x) { return x }
  };

  var K = P.K;

<%= include(
   'features.js',

   'lang/class.js',
   'lang/object.js',
   'lang/function.js',
   'lang/try.js',
   'lang/abstract.js',
   'lang/date.js',
   'lang/regexp.js',
   'lang/periodical-executer.js',
   'lang/string.js',
   'lang/template.js',
   'lang/enumerable.js',
   'lang/array.js',
   'lang/hash.js',
   'lang/number.js',
   'lang/range.js',

   'ajax/ajax.js',
   'ajax/responders.js',
   'ajax/base.js',
   'ajax/request.js',
   'ajax/response.js',
   'ajax/updater.js',
   'ajax/periodical-updater.js',

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
   'dom/event/dom-loaded.js',

   'deprecated.js') %>
  /*--------------------------------------------------------------------------*/

  Element.addMethods();
})(this);
