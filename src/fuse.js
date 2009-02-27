<%= include 'HEADER' %>
(function(global) {

  // Host objects have a range of typeof values. For example:
  // doc.createElement('div').offsetParent -> unknown
  // doc.createElement -> object
  function isHostObject(object, property) {
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  function getOwnerDoc(element) { // assume element is not null
    return element.ownerDocument || (element.nodeType === 9 ? element : doc);
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
  
  var Feature, Bug, body, root,
   doc   = document,
   docEl = doc.documentElement,
   dummy = doc.createElement('div'),
   slice = Array.prototype.slice,
   userAgent = global.navigator.userAgent,
   nodeListSlice = slice;

  /*---------------------------- PROTOTYPE OBJECT ----------------------------*/

  Fuse = {
    Browser: {
      Agent: {
        'IE':     isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') === -1,
        'Opera':  userAgent.indexOf('Opera') > -1,
        'WebKit': userAgent.indexOf('AppleWebKit/') > -1,
        'Gecko':  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
        'MobileSafari': !!userAgent.match(/AppleWebKit.*Mobile/)
      }
    },
    emptyFunction: function() { },
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  
    K: function(x) { return x },
    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    Version: '<%= FUSEJS_VERSION %>'
  };

<%= include('features.js') %>
  // IE will throw an error when attempting to
  // pass a nodeList to slice.call() AND
  // Safari 2 will return a full array with undefined values
  if (!Feature('ARRAY_SLICE_THIS_AS_NODELIST')) {
    nodeListSlice = function(begin, end) {
      // Avoid the nodeList length property because it might be an element 
      // with an ID/Name of `length`.
      // IE8 throws an error when attempting to access a non-existent index
      // of a StaticNodeList.
      // Safari 2 returns null when accessing a non-existant item in the list.
      var i = 0, results = [];
      while (typeof this[i] === 'object' && this[i])
        results[i] = this[i++];
      return !begin && arguments.length < 2 ?
        results : results.slice(begin, end);
    };
  }
  
<%= include(
   'lang/class.js',
   'lang/object.js',
   'lang/function.js',
   'lang/try.js',
   'lang/abstract.js',
   'lang/date.js',
   'lang/regexp.js',
   'lang/timer.js',
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
