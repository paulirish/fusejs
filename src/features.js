  /*-------------------------------- FEATURES --------------------------------*/

  (function() {
    function createTester(cache) {
      cache = cache || { };
      function Tester() {
        var name, i = 0;
      	while (name = arguments[i++]) {
          if (typeof cache[name] === 'function')
            cache[name] = cache[name]();
          if (cache[name] !== true)
            return false;
        }
        return true;
      };

      Tester.set = function(name, value) {
        if (arguments.length === 1 && typeof name === 'object'){
          for (var i in name) cache[i] = name[i];
        } else cache[name] = value;
      };

      Tester.unset = function(name) {
        if (typeof name === 'string') delete cache[name];
        else {
          for (var i in name) delete cache[i];
        }
      };
      return Tester;
    }

    Bug = Fuse.Browser.Bug = createTester();
    Feature = Fuse.Browser.Feature = createTester();
  })();

  Feature.set({
    'CREATE_ELEMENT_WITH_HTML': function() {
      try { // true for IE
        var div = Fuse._doc.createElement('<div id="x">');
        return div.id === 'x';
      } catch(e) {
        return false;
      }
    },

    'DOCUMENT_ALL_COLLECTION': function() {
      // true for all but Firefox
       isHostObject(Fuse._doc, 'all');
    },

    'DOCUMENT_CREATE_EVENT': function() {
      // true for all but IE
      return isHostObject(Fuse._doc, 'createEvent');
    },

    'DOCUMENT_CREATE_EVENT_OBJECT': function() {
      // true for IE
      return isHostObject(Fuse._doc, 'createEventObject')
    },

    'DOCUMENT_RANGE': function(){
      // true for all but IE
      return isHostObject(Fuse._doc, 'createRange');
    },

    'DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT': function() {
      if (Feature('DOCUMENT_RANGE'))
        return isHostObject(Fuse._doc.createRange, 'createContextualFragment');
    },

    'DOCUMENT_STYLE_SHEETS_COLLECTION': function() {
      // true for all so far
      return isHostObject(Fuse._doc, 'styleSheets');
    },

    'ELEMENT_ADD_EVENT_LISTENER': function() {
      // true for all but IE
      return isHostObject(Fuse._doc, 'addEventListener');
    },

    'ELEMENT_ATTACH_EVENT': function() {
      // true for IE
      return isHostObject(Fuse._doc, 'attachEvent') &&
        !Feature('ELEMENT_ADD_EVENT_LISTENER');
    },

    'ELEMENT_BOUNDING_CLIENT_RECT': function() {
      // true for IE, Firefox 3
      return isHostObject(Fuse._docEl, 'getBoundingClientRect');
    },

    'ELEMENT_CLASS': function() {
      // true for all but Safari 2 and IE7-
      return isHostObject(global, 'Element') &&
        isHostObject(global.Element, 'prototype');
    },

    'ELEMENT_COMPUTED_STYLE': function() {
      // true for all but IE
      return isHostObject(Fuse._doc, 'defaultView') &&
        isHostObject(Fuse._doc.defaultView, 'getComputedStyle');
    },

    'ELEMENT_COMPARE_DOCUMENT_POSITION': function() {
      // true for Firefox and Opera 9.5+
      return isHostObject(Fuse._docEl, 'compareDocumentPosition');
    },

    'ELEMENT_CURRENT_STYLE': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'currentStyle') &&
        !Feature('ELEMENT_COMPUTED_STYLE');
    },

    'ELEMENT_DISPATCH_EVENT': function() {
      // true for all but IE
      return isHostObject(Fuse._docEl, 'dispatchEvent');
    },

    'ELEMENT_DO_SCROLL': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'doScroll');
    },

    'ELEMENT_EXTENSIONS': function() {
      // true for all but Safari 2 and IE7-
      return Feature('HTML_ELEMENT_CLASS') || Feature('ELEMENT_CLASS');
    },

    'ELEMENT_FIRE_EVENT': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'fireEvent');
    },

    'ELEMENT_GET_ATTRIBUTE_IFLAG': function() {
      // true for IE
      var result = false;
      try {
        Fuse._div.setAttribute('align', 'center'); Fuse._div.setAttribute('aLiGn', 'left');
        result = (Fuse._div.getAttribute('aLiGn') === 'center' &&
          Fuse._div.getAttribute('aLiGn', 1) === 'left');
        Fuse._div.removeAttribute('align'); Fuse._div.removeAttribute('aLiGn');
      } catch(e) { }
      return result;
    },

    'ELEMENT_INNER_TEXT': function() {
      // true for IE
      return !Feature('ELEMENT_TEXT_CONTENT') &&
        typeof Fuse._div.innerText === 'string';
    },

    'ELEMENT_MS_CSS_FILTERS': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'filters') &&
        typeof Fuse._docEl.style.filter === 'string';
    },

    'ELEMENT_REMOVE_NODE': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'removeNode');
    },

    'ELEMENT_SOURCE_INDEX': function() {
      // true for IE and Opera
      return typeof Fuse._docEl.sourceIndex === 'number';
    },

    'ELEMENT_SPECIFIC_EXTENSIONS': function() {
      var result = false;
      if (isHostObject(global, 'HTMLHtmlElement') &&
          isHostObject(global.HTMLHtmlElement, 'prototype') &&
          (Fuse._docEl.constructor === HTMLHtmlElement || 
           Fuse._docEl instanceof HTMLHtmlElement || Feature('OBJECT_PROTO') &&
           Fuse._docEl['__proto__'] === HTMLHtmlElement.prototype)) {
        result = true;
      } else result = Feature('EMULATE_ELEMENT_CLASSES_WITH_PROTO');

      // TODO: Remove this browser sniff
      return Fuse.Browser.Agent.MobileSafari ? false : result;
    },

    'ELEMENT_TEXT_CONTENT': function() {
      // true for all but IE and Safari 2
      return typeof Fuse._div.textContent === 'string';
    },

    'EMULATE_ELEMENT_CLASSES_WITH_PROTO': function() {
      return Feature('OBJECT_PROTO') &&
        Fuse._div['__proto__'] !== Fuse._docEl['__proto__'];
    },

    'FUNCTION_TO_STRING_RETURNS_SOURCE': function() {
      // true for all but some mobile browsers
      function toStringTest(param1, param2) { var x = 1 }
      var source = toStringTest.toString();
      return source.indexOf('param1') > -1 && source.indexOf('x = 1') > -1;
    },

    'HTML_ELEMENT_CLASS': function() {
      // true for all but IE
      // (Safari 2 support is emulated in element.js)
      return isHostObject(global,'HTMLElement') &&
        isHostObject(global.HTMLElement, 'prototype');
    },

    'OBJECT_PROTO': function() {
      // true for Gecko and Webkit
      return isHostObject(Fuse._docEl, '__proto__') &&
        [ ]['__proto__'] === Array.prototype  &&
        { }['__proto__'] === Object.prototype;
    },

    'SELECTORS_API': function() {
      // true for IE8, WebKit (Safari 3, Chrome)
      return isHostObject(Fuse._doc, 'querySelector') &&
        isHostObject(Fuse._doc, 'querySelectorAll') &&
        isHostObject(Fuse._docEl, 'querySelector') &&
        isHostObject(Fuse._docEl, 'querySelectorAll');
    },

    'XPATH': function() {
      // true for all but IE
      return isHostObject(Fuse._doc, 'evaluate') &&
        isHostObject(global, 'XPathResult') &&
        typeof XPathResult.ORDERED_NODE_SNAPSHOT_TYPE === 'number';
    }
  });

  (function() {
    var ELEMENT_CHILDREN_NODELIST, ELEMENT_CONTAINS;

    // true for IE, Safari 3, Opera, Firefox 3+
    if (!isHostObject(Fuse._docEl, 'children'))
      ELEMENT_CHILDREN_NODELIST = false;

    // true for all but IE and Safari 2
    if (!isHostObject(Fuse._docEl, 'contains'))
      ELEMENT_CONTAINS = false;

    // no need to test further is both failed
    if (ELEMENT_CHILDREN_NODELIST === false &&
      ELEMENT_CONTAINS === false) return;

    Fuse._div.innerHTML = '<div></div><div><div></div></div>';

    // ensure children collection only contains direct descendants
    if (ELEMENT_CHILDREN_NODELIST !== false)
      ELEMENT_CHILDREN_NODELIST = Fuse._div.children.length === Fuse._div.childNodes.length;

    // ensure element.contains() returns the correct results;
    if (ELEMENT_CONTAINS !== false)
      ELEMENT_CONTAINS = !Fuse._div.firstChild.contains(Fuse._div.childNodes[1].firstChild);

    Fuse._div.innerHTML = '';

    Feature.set({
      'ELEMENT_CHILDREN_NODELIST': ELEMENT_CHILDREN_NODELIST,
      'ELEMENT_CONTAINS':          ELEMENT_CONTAINS
    });
  })();

  /*---------------------------------- BUGS ----------------------------------*/

  Bug.set({
    'ARRAY_CONCAT_ARGUMENTS_BUGGY': function() {
      // true for Opera
      return (function() { return Array.prototype.concat &&
        [].concat(arguments).length === 2 })(1, 2);
    },

    'ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS': function() {
      // true for IE
      var node, clone;
      (node = document.createAttribute('name')).value = 'x';
      Fuse._div.setAttributeNode(node);
      (clone = Fuse._div.cloneNode(false)).setAttribute('name', 'y');
      Fuse._div.removeAttribute('name');

      return (node = clone.getAttributeNode('name')) && node.value === 'x';
    },

    'BODY_ACTING_AS_ROOT': function() {
      // true for IE Quirks, Opera 9.25
      if (Fuse._docEl.clientWidth === 0) return true;

      var dms = Fuse._div.style, bs = Fuse._body.style, des = Fuse._docEl.style,
       bsBackup = bs.cssText, desBackup = des.cssText;

      bs.margin   = des.margin = '0';
      bs.height   = des.height = 'auto';
      dms.cssText = 'display:block;height:8500px;';

      Fuse._body.insertBefore(Fuse._div, Fuse._body.firstChild);
      var result = Fuse._docEl.clientHeight >= 8500;
      Fuse._body.removeChild(Fuse._div);

      bs.cssText  = bsBackup;
      des.cssText = desBackup;
      dms.cssText = '';

      return result;
    },

    'BODY_OFFSETS_INHERIT_ITS_MARGINS': function() {
      // true for Safari
      var backup = Fuse._body.style.cssText || '';
      Fuse._body.style.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
      var result = Fuse._body.offsetTop === 1;
      Fuse._body.style.cssText = backup;
      return result;
    },

    'ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var result, s = Fuse._docEl.style, backup = s.cssText;
        s.position = 'static';
        s.top = s.left = '';

        var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null);
        result = (style && style.top === '0px' && style.left === '0px');
        Fuse._docEl.style.cssText = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera 9.2x
        var backup = Fuse._docEl.style.paddingBottom;
        Fuse._docEl.style.paddingBottom = '1px';
        var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null),
         result = style && (parseInt(style.height) || 0) ===  Fuse._docEl.offsetHeight;
        Fuse._docEl.style.paddingBottom = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var backup = Fuse._docEl.style.display;
        Fuse._docEl.style.display = 'none';

        // In Safari 2 getComputedStyle() will return null for elements with style display:none
        var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null),
         result = style && style.height === '0px';

        Fuse._docEl.style.display = backup;
        return result;
      }
    },

    'ELEMENT_PROPERTIES_ARE_ATTRIBUTES': function() {
      // true for IE
      Fuse._div[expando] = 'x';
      var result = Fuse._div.getAttribute(expando) === 'x';
      Fuse._div.removeAttribute(expando);
      if (typeof Fuse._div[expando] !== 'undefined')
        delete Fuse._div[expando];
      return result;
    },

    'ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT_PROPERTY_ON_INSERT': function() {
      var element = Fuse._doc.createElement('script');
      element.text = 'Fuse.' + expando +' = true;';
      Fuse._docEl.insertBefore(element, Fuse._docEl.firstChild);
      var result = !Fuse[expando];
      Fuse._docEl.removeChild(element);
      delete Fuse[expando];
      return result;
    },

    'ELEMENT_TABLE_INNERHTML_INSERTS_TBODY': function() {
      // true for IE and Firefox 3
      Fuse._div.innerHTML = '<table><tr><td></td></tr></table>';
      var result = getNodeName(Fuse._div.firstChild.firstChild) === 'TBODY';
      Fuse._div.innerHTML = '';
      return result;
    },

    'REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY': function() {
      // true for Webkit and IE
      return !!'\x09\x0B\x0C\x20\xA0\x0A\x0D\u2028\u2029\u1680\u180e\u2000-\u200a\u202f\u205f\u3000'
        .replace(/\s+/, '').length;
    },

    'SELECTORS_API_CASE_INSENSITIVE_CLASSNAME': function() {
      // Safari 3 before 3.1.2 treat class names
      // case-insensitively in quirks mode.
      var result = false;
      if (Feature('SELECTORS_API')) {
        Fuse._div.id = expando;
        Fuse._div.innerHTML = '<span class="X"></span>';
        result = Fuse._div.querySelector('#'+ expando +' .x') !== null;
        Fuse._div.id = Fuse._div.innerHTML = '';
      }
      return result;
    },

    'STRING_REPLACE_COHERSE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return '' };
      return 'a'.replace(/a/, func) === String(func);
    },
    
    'STRING_REPLACE_SETS_REGEXP_LAST_INDEX': function() {
      // true for IE
      var pattern = /x/;
      'oxo'.replace(pattern, '');
      return !!pattern.lastIndex;
    }
  });

  Bug.set((function() {
    function createInnerHTMLTest(source, innerHTML) {
      return function() {
        Fuse._div.innerHTML = source;
        var result = true, element = Fuse._div.firstChild;
        try {
          result = (element.innerHTML = innerHTML) &&
            element.innerHTML.toLowerCase() !== innerHTML;
        } catch(e) { }
        Fuse._div.innerHTML = '';
        return result;
      };
    }

    return {
      'ELEMENT_SELECT_INNERHTML_BUGGY': createInnerHTMLTest(
        '<select><option></option></select>', '<option>x</option>'
      ),

      'ELEMENT_TABLE_INNERHTML_BUGGY': createInnerHTMLTest(
        // left out tbody to test if it's auto inserted
        '<table><tr><td></td></tr></table>', '<tr><td><div>x</div></td></tr>'
      )
    };
  })());

  Bug.set((function() {
    function createCommentTest(conditional) {
      return function() {
        Fuse._div.innerHTML = '<p>x</p><!--y-->';
        var result = conditional(Fuse._div);
        Fuse._div.innerHTML = '';
        return result;
      };
    }

    return {
      'COMMENT_NODES_IN_CHILDREN_NODELIST': createCommentTest(function(element) {
        // true for IE
        return Feature('ELEMENT_CHILDREN_NODELIST') && element.children.length === 2;
      }),

      'GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES': createCommentTest(function(element) {
        // true for IE
        return element.getElementsByTagName('*').length === 2;
      })
    };
  })());

  if (Feature('ELEMENT_CLASS')) {
    Bug.set((function() {
      function createElementInheritableTest(nodeName) {
        return function() {
          // IE8 bug:
          // Must reference Element as a property of global when assigning
          // properties to its prototype or it will create a seperate instance
          // for Element and global.Element.
          var element = Fuse._doc.createElement(nodeName),
           prototype = global.Element.prototype;
          prototype._fuseInheritableTest = true;
          var result = !element._fuseInheritableTest;
          delete prototype._fuseInheritableTest;
          return result;
        };
      }

      return {
        'ELEMENT_APPLET_FAILS_TO_INHERIT_FROM_PROTOTYPE':
          createElementInheritableTest('applet'),
        'ELEMENT_OBJECT_FAILS_TO_INHERIT_FROM_PROTOTYPE':
          createElementInheritableTest('object')
      };
    })());
  }
