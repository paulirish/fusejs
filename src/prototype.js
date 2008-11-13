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
  
  function getOwnerDoc(element) { // assume element is not null
    return element.ownerDocument || (element.nodeType === 9  ? element : doc);
  }

  var P = Prototype = {
    Version: '<%= PROTOTYPE_VERSION %>',

    Browser: {
      IE:     !!(global.attachEvent && userAgent.indexOf('Opera') === -1),
      Opera:  userAgent.indexOf('Opera') > -1,
      WebKit: userAgent.indexOf('AppleWebKit/') > -1,
      Gecko:  userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') === -1,
      MobileSafari: !!userAgent.match(/AppleWebKit.*Mobile/)
    },

    BrowserFeatures: {
      XPath: !!doc.evaluate,
      SelectorsAPI: !!doc.querySelector,
      ElementExtensions: !!global.HTMLElement,
      SpecificElementExtensions:
        document.createElement('div').__proto__ &&
        document.createElement('div').__proto__ !==
          document.createElement('form').__proto__
    },

    ScriptFragment: '<script[^>]*>([^\\x00]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,  

    emptyFunction: function() { },
    K: function(x) { return x }
  };

  function Test(testObject) {
    return function() {
      for (var i = 0, answer, name; name = arguments[i++]; ) {
        answer = (name.charAt(0) !== '!') ? true : false;
        if (typeof testObject[name] === 'function')
          testObject[name] = testObject[name]();
        if (testObject[name] !== answer)
          return false;
      }
      return true;
    };
  }

  /* Feature tests */

  var Feature = Test({
    ARGUMENTS_INSTANCEOF_ARRAY: function() {
      // True for Opera
      return (function() { return arguments instanceof Array })();
    },

    CREATE_ELEMENT_WITH_HTML: function() {
      try { // True for IE
        doc.createElement('<div>');
        return true;
      } catch(e) {
        return false;
      }
    },

    DOCUMENT_RANGE: function() {
      // True for all but IE
      return !!doc.createRange;
    },

    ELEMENT_BOUNDING_CLIENT_RECT: function() {
      // True for IE, Firefox 3
      return !!docEl.getBoundingClientRect;
    },

    ELEMENT_CHILDREN_NODELIST: function() {
      // True for IE, Safari, Opera, Firefox 3+
      return !!docEl.children;
    },

    ELEMENT_CLIENT_COORDS: function() {
      // True for IE
      return 'clientLeft' in docEl;
    },

    ELEMENT_EXTENSIONS: function() {
      // True for Firefox, WebKit
      if (!P.BrowserFeatures.ElementExtensions && dummy.__proto__) {
        global.HTMLElement = { };
        global.HTMLElement.prototype = dummy.__proto__;
        P.BrowserFeatures.ElementExtensions = true;
      }
      return P.BrowserFeatures.ElementExtensions;
    },

    ELEMENT_COMPUTED_STYLE: function() {
      // True for all but IE
      return !!(doc.defaultView && doc.defaultView.getComputedStyle);
    },

    ELEMENT_CURRENT_STYLE: function() {
      // True for IE
      return docEl.currentStyle && !Feature('ELEMENT_COMPUTED_STYLE');
    },

    ELEMENT_INNER_TEXT: function() {
      // True for IE
      return 'innerText' in dummy && !('textContent' in dummy);
    },

    ELEMENT_MS_CSS_FILTERS: function() {
      // True for IE
      return ('filters' in docEl && 'filter' in docEl.style);
    },

    ELEMENT_REMOVE_NODE: function() {
      // True for IE
      return !!docEl.removeNode;
    },

    ELEMENT_SPECIFIC_EXTENSIONS: function() {
      if (P.Browser.MobileSafari)
        P.BrowserFeatures.SpecificElementExtensions = false;
      return P.BrowserFeatures.SpecificElementExtensions;
    },

    EVENT_USES_ATTACH: function() {
      // True for IE
      return (doc.attachEvent && !doc.addEventListener);
    },

    SELECTORS_API: function() {
      // True for WebKit (Safari 3, Chrome)
      return P.BrowserFeatures.SelectorsAPI;
    },

    TYPEOF_NODELIST_IS_FUNCTION: function() {
      // True for WebKit
      return typeof docEl.childNodes === 'function';
    },

    XPATH: function() {
      // True for all but IE
      return P.BrowserFeatures.XPath;
    }
  });

  /* Bug tests */

  var Bug = Test((function() {

    function createInnerHTMLTest(source, innerHTML, level) {
      return function() {
        dummy.innerHTML = source;
        var result = true, element = dummy.firstChild;
      try {
          result = (element.innerHTML = innerHTML) &&
            element.innerHTML.toLowerCase() !== innerHTML;
        } catch(e) { }
        dummy.innerHTML = '';
        return result;
      };
    }

    function createCommentTest(conditional) {
      return function() {
        dummy.innerHTML = '<span>a</span><!--b-->';
        var result = conditional(dummy);
        dummy.innerHTML = '';
        return result;
      };
    }

    return {
      ARRAY_CONCAT_ARGUMENTS_BUGGY: function() {
        // True for Opera
        return (function() { return [].concat(arguments) === 1 })(1, 2);
      },

      BODY_ACTING_AS_ROOT: function() {
        // True for IE Quirks, Opera 9.25
        if (docEl.clientWidth === 0) return true;
        var backup = { };
        ['body', 'documentElement']._each(function(name) {
          backup[name] = doc[name].style.cssText;
          doc[name].style.cssText += ';margin:0;height:auto;';
        });
        Element.insert(body, { top: '<div style="display:block;height:8500px;"></div>' });
        var result = docEl.clientHeight >= 8500;
        body.removeChild(body.firstChild);

        for (name in backup)
          doc[name].style.cssText = backup[name];
        return result;
      },

      BODY_OFFSETS_INHERIT_ITS_MARGINS: function() {
        // True for Safari
        var backup = body.style.cssText || '';
        body.style.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
        var result = body.offsetTop === 1;
        body.style.cssText = backup;
        return result;
      },

      COMMENT_NODES_IN_CHILDREN_NODELIST: createCommentTest(function(element) {
        // True for IE
        return Feature('ELEMENT_CHILDREN_NODELIST') && element.children.length === 2;
      }),

      ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN: function() {
        if (!Feature('ELEMENT_COMPUTED_STYLE')) return false;

        // true for Opera
        var backup = docEl.style.display;
        docEl.style.display = 'none';
        var style = doc.defaultView.getComputedStyle(docEl, null),
         result = style && style.height === '0px';

        docEl.style.display = backup;
        return result;
      },

      ELEMENT_PROPERTIES_ARE_ATTRIBUTES: function() {
        // True for IE
        dummy.__attrAsExpandoProps = 'something';
        var result = dummy.getAttribute('__attrAsExpandoProps') === 'something';
        dummy.removeAttribute('__propertiesAreAttributes');

        if (typeof dummy.__propertiesAreAttributes !== 'undefined')
          delete dummy.__propertiesAreAttributes;
        return result;
      },

      ELEMENT_SELECT_INNERHTML_BUGGY: createInnerHTMLTest(
        '<select><option></option></select>', '<option>test</option>'
      ),

      ELEMENT_TABLE_INNERHTML_BUGGY: createInnerHTMLTest(
        '<table><tbody><tr><td></td></tr></tbody></table>', '<tbody><tr><td><div>test</div></td></tr></tbody>'
      ),

      EVENT_OBSERVER_ORDER_NOT_FIFO: function() {
        // True for all but IE
        var result = '';
        ['a', 'b', 'c', 'd']._each(function(n) {
          doc.observe('eventOrder:checked', function() { result += n });
        });
        doc.fire('eventOrder:checked');
        doc.stopObserving('eventOrder:checked');
        return result !== 'abcd';
      },

      GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES: createCommentTest(function(element) {
        // True for IE
        return element.getElementsByTagName('*').length === 2;
      })
    };
  })());

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
