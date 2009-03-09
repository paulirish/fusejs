<%= include 'HEADER' %>
(function(global) {

  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  function isHostObject(object, property) {
    var type = typeof object[property];
    return type === 'function' || type === 'object' || type === 'unknown';
  }

  function getDocument(element) { // assume element is not null
    return element.ownerDocument || (element.nodeType === 9 ? element : Fuse._doc);
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

  var Bug, Feature,
   slice = Array.prototype.slice,
   userAgent = global.navigator.userAgent,
   nodeListSlice = slice;

  var getNodeName = document.documentElement.nodeName === 'HTML'
    ? function(element) { return element.nodeName }
    : function(element) { return element.nodeName.toUpperCase() };

  try {
    if (false === !!slice.call(document.documentElement.childNodes, 0)[0])
      throw true;
  } catch(e) {
    // IE throws an error when passing a nodeList to slice.call()
    // Safari 2 will return a full array with undefined values
    nodeListSlice = function(begin, end) {
      // 1) Avoid the length property, it might be an element with an id/name of `length`.
      // 2) IE8 throws an error when accessing a non-existant item of a StaticNodeList.
      // 3) Safari 2 returns null when accessing a non-existant item.
      var i = 0, results = [];
      while (typeof this[i] === 'object' && this[i])
        results[i] = this[i++];
      return !begin && arguments.length < 2 ?
        results : results.slice(begin, end);
    };
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
