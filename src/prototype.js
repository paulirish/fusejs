<%= include 'HEADER' %>

(function() {
  var body, global = this, doc = document,
   docEl = doc.documentElement,
   userAgent = navigator.userAgent,
   dummy = doc.createElement('div'),
   slice = Array.prototype.slice;

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

  var P = Prototype = {
    Version: '<%= PROTOTYPE_VERSION %>',

    Browser: {
      IE:     !!(global.attachEvent && userAgent.indexOf('Opera') === -1),
      Opera:  userAgent.indexOf('Opera') > -1,
      WebKit: userAgent.indexOf('AppleWebKit/') > -1,
      Gecko:  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
      MobileSafari: !!userAgent.match(/Apple.*Mobile.*Safari/)
    },

    BrowserFeatures: {
      XPath: !!doc.evaluate,
      SelectorsAPI: !!doc.querySelector,
      ElementExtensions: !!global.HTMLElement,
      SpecificElementExtensions: 
        dummy.__proto__ && dummy.__proto__ !== 
          doc.createElement('form').__proto__
    },

    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  

    emptyFunction: function() { },
    K: function(x) { return x }
  };

  if (P.Browser.MobileSafari)
    P.BrowserFeatures.SpecificElementExtensions = false;

<%= include 'base.js' %>

<%= include 'string.js' %>

<%= include 'enumerable.js' %>

<%= include 'array.js' %>

<%= include 'number.js' %>

<%= include 'hash.js' %>

<%= include 'range.js' %>

<%= include 'ajax.js' %>

<%= include 'dom.js' %>

<%= include 'selector.js' %>

<%= include 'form.js' %>

<%= include 'event.js' %>

<%= include 'deprecated.js' %>

  Element.addMethods();
})();
