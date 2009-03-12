<%= include 'HEADER' %>
(function(global) {

  var Bug, Feature,
   slice = Array.prototype.slice,
   userAgent = global.navigator.userAgent,
   nodeListSlice = slice;

  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  function isHostObject(object, property) {
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  function getDocument(element) { // assume element is not null
    return element.ownerDocument || element.document ||
      (element.nodeType === 9 ? element : Fuse._doc);
  }

  function concatList(list, other) {
    var result = slice.call(list, 0), pad = list.length, length = other.length;
    while (length--) result[pad + length] = other[length];
    return result;
  }

  function prependList(list, value) {
    var result = [value], length = list.length;
    while (length--) result[1 + length] = list[length];
    return result;
  }

  /*---------------------------- FUSE OBJECT ---------------------------------*/

  Fuse = {
    '_body':  { },
    '_root':  { },
    '_div':   document.createElement('div'),
    '_doc':   document,
    '_docEl': document.documentElement,

    Browser: {
      Agent: {
        'IE':     isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') === -1,
        'Opera':  userAgent.indexOf('Opera') > -1,
        'WebKit': userAgent.indexOf('AppleWebKit/') > -1,
        'Gecko':  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
        'MobileSafari': !!userAgent.match(/AppleWebKit.*Mobile/)
      }
    },

    emptyFunction:  function() { },
    JSONFilter:     /^\/\*-secure-([\s\S]*)\*\/\s*$/, 
    K:              function(x) { return x },
    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    Version:        '<%= FUSEJS_VERSION %>'
  };

  var getNodeName = Fuse._docEl.nodeName === 'HTML'
    ? function(element) { return element.nodeName }
    : function(element) { return element.nodeName.toUpperCase() };

  var getRoot = function(element) {
    return (getRoot = getNodeName(Fuse._root) === 'BODY'
      ? function(element) { return getDocument(element).body }
      : function(element) { return getDocument(element).documentElement }
    )(element);
  };

  // based on work by Diego Perini
  var getWindow =
    isHostObject(Fuse._doc, 'parentWindow') ?
      function(element) {
        return getDocument(element).parentWindow || element;
      } :
    isHostObject(document, 'defaultView') && Fuse._doc.defaultView === global ?
      function(element) {
        return getDocument(element).defaultView || element;
      } :
    function(element) {
      // Safari 2.0.x returns `Abstract View` instead of `global`
      var frame, i = 0, doc = getDocument(element);
      if (Fuse._doc !== doc) {
        while (frame = global.frames[i++]) {
          if (frame === doc) return frame;
        }
      }
      return global;
    };

  // IE throws an error when passing a nodeList to slice.call()
  // Safari 2 will return a full array with undefined values
  // Opera 9.2x will return an empty array if an element has an id of `length`
  (function() {
    function complex(begin, end) {
      // IE8 throws an error when accessing a non-existant item of a StaticNodeList.
      // TODO: Confirm using instanceof on elements causes a memory leak in IE8
      if (this != '[object StaticNodeList]')
        return simple.call(this, begin, end);
      var i = 0, results = [];
      while (typeof this[i] === 'object')
        results[i] = this[i++];
      return !begin && end == null ?
        results : results.slice(begin, end);
    }

    function simple(begin, end) {
      // Safari 2 and Opera 9.2x
      var i = 0, results = [];
      while (results[i] = this[i++]) { }
      results.length--;
      return !begin && end == null ?
        results : results.slice(begin, end);
    }

    try {
      Fuse._div.innerHTML = '<div id="length"></div>';
      Fuse._docEl.insertBefore(Fuse._div, Fuse._docEl.firstChild);
      if (!slice.call(Fuse._div.childNodes, 0)[0])
        nodeListSlice = simple;
    } catch(e) {
      nodeListSlice = complex;
    } finally {
      Fuse._docEl.removeChild(Fuse._div).innerHTML = '';
    }
  })();

<%= include(
   'features.js',

   'lang/class.js',
   'lang/object.js',
   'lang/function.js',
   'lang/try.js',
   'lang/abstract.js',
   'lang/date.js',
   'lang/timer.js',
   'lang/enumerable.js',
   'lang/array.js',
   'lang/regexp.js',
   'lang/string.js',
   'lang/template.js',
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
