  /*-------------------------------- FEATURES --------------------------------*/

  (function() {
    function createCommentTest(conditional) {
      return function() {
        Fuse._div.innerHTML = '<span>a</span><!--b-->';
        var result = conditional(Fuse._div);
        Fuse._div.innerHTML = '';
        return result;
      };
    }

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

    function createTester(cache) {
      var Tester = function() {
        var name, i = 0;
      	while (name = arguments[i++]) {
          if (typeof cache[name] === 'function')
            cache[name] = cache[name]();
          if (cache[name] !== true)
            return false;
        }
        return true;
      };
      Tester.set   = function(name, value) { cache[name] = value };
      Tester.unset = function(name) { delete cache[name] };
      return Tester;
    }

    Feature = Fuse.Browser.Feature = createTester((function() {
      function CREATE_ELEMENT_WITH_HTML() {
        try { // true for IE
          var div = Fuse._doc.createElement('<div id="test">');
          return div.id === 'test';
        } catch(e) {
          return false;
        }
      }

      function DOCUMENT_ALL_COLLECTION() {
        // true for all but Firefox
        return isHostObject(Fuse._doc, 'all');
      }

      function DOCUMENT_CREATE_EVENT() {
        // true for all but IE
        return isHostObject(Fuse._doc, 'createEvent');
      }

      function DOCUMENT_CREATE_EVENT_OBJECT() {
        // true for IE
        return isHostObject(Fuse._doc, 'createEventObject')
      }

      function DOCUMENT_RANGE(){
        // true for all but IE
        return isHostObject(Fuse._doc, 'createRange');
      }

      function DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT() {
        if (Feature('DOCUMENT_RANGE'))
          return isHostObject(Fuse._doc.createRange(), 'createContextualFragment');
      }

      function DOCUMENT_STYLE_SHEETS_COLLECTION() {
        // true for all so far
        return isHostObject(Fuse._doc, 'styleSheets');
      }

      function ELEMENT_ADD_EVENT_LISTENER() {
        // true for all but IE
        return isHostObject(Fuse._doc, 'addEventListener');
      }

      function ELEMENT_ATTACH_EVENT() {
        // true for IE
        return isHostObject(Fuse._doc, 'attachEvent') &&
          !Feature('ELEMENT_ADD_EVENT_LISTENER');
      }

      function ELEMENT_BOUNDING_CLIENT_RECT() {
        // true for IE, Firefox 3
        return isHostObject(Fuse._docEl, 'getBoundingClientRect');
      }

      function ELEMENT_CLASS() {
        // true for all but Safari 2 and IE7-
        return isHostObject(global, 'Element') &&
          isHostObject(global.Element, 'prototype');
      }

      function ELEMENT_CLIENT_COORDS() {
        // true for IE
        return typeof Fuse._docEl.clientLeft === 'number';
      }

      function ELEMENT_COMPUTED_STYLE() {
        // true for all but IE
        return isHostObject(Fuse._doc, 'defaultView') &&
          isHostObject(Fuse._doc.defaultView, 'getComputedStyle');
      }

      function ELEMENT_COMPARE_DOCUMENT_POSITION() {
        // true for Firefox and Opera 9.5+
        return isHostObject(Fuse._docEl, 'compareDocumentPosition');
      }

      function ELEMENT_CURRENT_STYLE() {
        // true for IE
        return isHostObject(Fuse._docEl, 'currentStyle') &&
          !Feature('ELEMENT_COMPUTED_STYLE');
      }

      function ELEMENT_DISPATCH_EVENT() {
        // true for all but IE
        return isHostObject(Fuse._docEl, 'dispatchEvent');
      }

      function ELEMENT_DO_SCROLL() {
        // true for IE
        return isHostObject(Fuse._docEl, 'doScroll');
      }

      function ELEMENT_EXTENSIONS() {
        // true for all but Safari 2 and IE7-
        return Feature('HTML_ELEMENT_CLASS') || Feature('ELEMENT_CLASS');
      }

      function ELEMENT_FIRE_EVENT() {
        // true for IE
        return isHostObject(Fuse._docEl, 'fireEvent');
      }

      function ELEMENT_GET_ATTRIBUTE_IFLAG() {
        // true for IE
        var result = false;
        try {
          Fuse._div.setAttribute('align', 'center'); Fuse._div.setAttribute('aLiGn', 'left');
          result = (Fuse._div.getAttribute('aLiGn') === 'center' &&
            Fuse._div.getAttribute('aLiGn', 1) === 'left');
          Fuse._div.removeAttribute('align'); Fuse._div.removeAttribute('aLiGn');
        } catch(e) { }
        return result;
      }

      function ELEMENT_INNER_TEXT() {
        // true for IE
        return !Feature('ELEMENT_TEXT_CONTENT') &&
          typeof Fuse._div.innerText === 'string';
      }

      function ELEMENT_MS_CSS_FILTERS() {
        // true for IE
        return isHostObject(Fuse._docEl, 'filters') &&
          typeof Fuse._docEl.style.filter === 'string';
      }

      function ELEMENT_REMOVE_NODE() {
        // true for IE
        return isHostObject(Fuse._docEl, 'removeNode');
      }

      function ELEMENT_SOURCE_INDEX() {
        // true for IE and Opera
        return typeof Fuse._docEl.sourceIndex === 'number';
      }

      function ELEMENT_SPECIFIC_EXTENSIONS() {
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
      }

      function ELEMENT_TEXT_CONTENT() {
        // true for all but IE and Safari 2
        return typeof Fuse._div.textContent === 'string';
      }

      function EMULATE_ELEMENT_CLASSES_WITH_PROTO() {
        return Feature('OBJECT_PROTO') &&
          Fuse._div['__proto__'] !== Fuse._docEl['__proto__'];
      }

      function FUNCTION_TO_STRING_RETURNS_SOURCE() {
        // true for all but some mobile browsers
        function toStringTest(param1, param2) { var number = 1234 }
        var source = toStringTest.toString();
        return source.indexOf('param1') > -1 && source.indexOf('number = 1234') > -1;
      }

      function HTML_ELEMENT_CLASS() {
        // true for all but IE
        // (Safari 2 support is emulated in element.js)
        return isHostObject(global,'HTMLElement') &&
          isHostObject(global.HTMLElement, 'prototype');
      }

      function OBJECT_PROTO() {
        // true for Gecko and Webkit
        return isHostObject(Fuse._docEl, '__proto__') &&
          [ ]['__proto__'] === Array.prototype  &&
          { }['__proto__'] === Object.prototype;
      }

      function SELECTORS_API() {
        // true for IE8, WebKit (Safari 3, Chrome)
        return isHostObject(Fuse._doc, 'querySelector') &&
          isHostObject(Fuse._doc, 'querySelectorAll') &&
          isHostObject(Fuse._docEl, 'querySelector') &&
          isHostObject(Fuse._docEl, 'querySelectorAll');
      }

      function XPATH() {
        // true for all but IE
        return isHostObject(Fuse._doc, 'evaluate') &&
          isHostObject(global, 'XPathResult') &&
          typeof XPathResult.ORDERED_NODE_SNAPSHOT_TYPE === 'number';
      }

      var ELEMENT_CHILDREN_NODELIST, ELEMENT_CONTAINS;
      (function() {
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
      })();

      return {
        'CREATE_ELEMENT_WITH_HTML':                  CREATE_ELEMENT_WITH_HTML,
        'DOCUMENT_ALL_COLLECTION':                   DOCUMENT_ALL_COLLECTION,
        'DOCUMENT_CREATE_EVENT':                     DOCUMENT_CREATE_EVENT,
        'DOCUMENT_CREATE_EVENT_OBJECT':              DOCUMENT_CREATE_EVENT_OBJECT,
        'DOCUMENT_RANGE':                            DOCUMENT_RANGE,
        'DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT': DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT,
        'DOCUMENT_STYLE_SHEETS_COLLECTION':          DOCUMENT_STYLE_SHEETS_COLLECTION,
        'ELEMENT_ADD_EVENT_LISTENER':                ELEMENT_ADD_EVENT_LISTENER,
        'ELEMENT_ATTACH_EVENT':                      ELEMENT_ATTACH_EVENT,
        'ELEMENT_BOUNDING_CLIENT_RECT':              ELEMENT_BOUNDING_CLIENT_RECT,
        'ELEMENT_CHILDREN_NODELIST':                 ELEMENT_CHILDREN_NODELIST,
        'ELEMENT_CLASS':                             ELEMENT_CLASS,
        'ELEMENT_CLIENT_COORDS':                     ELEMENT_CLIENT_COORDS,
        'ELEMENT_COMPARE_DOCUMENT_POSITION':         ELEMENT_COMPARE_DOCUMENT_POSITION,
        'ELEMENT_COMPUTED_STYLE':                    ELEMENT_COMPUTED_STYLE,
        'ELEMENT_CONTAINS':                          ELEMENT_CONTAINS,
        'ELEMENT_CURRENT_STYLE':                     ELEMENT_CURRENT_STYLE,
        'ELEMENT_DISPATCH_EVENT':                    ELEMENT_DISPATCH_EVENT,
        'ELEMENT_DO_SCROLL':                         ELEMENT_DO_SCROLL,
        'ELEMENT_EXTENSIONS':                        ELEMENT_EXTENSIONS,
        'ELEMENT_FIRE_EVENT':                        ELEMENT_FIRE_EVENT,
        'ELEMENT_GET_ATTRIBUTE_IFLAG':               ELEMENT_GET_ATTRIBUTE_IFLAG,
        'ELEMENT_INNER_TEXT':                        ELEMENT_INNER_TEXT,
        'ELEMENT_MS_CSS_FILTERS':                    ELEMENT_MS_CSS_FILTERS,
        'ELEMENT_REMOVE_NODE':                       ELEMENT_REMOVE_NODE,
        'ELEMENT_SOURCE_INDEX':                      ELEMENT_SOURCE_INDEX,
        'ELEMENT_SPECIFIC_EXTENSIONS':               ELEMENT_SPECIFIC_EXTENSIONS,
        'ELEMENT_TEXT_CONTENT':                      ELEMENT_TEXT_CONTENT,
        'EMULATE_ELEMENT_CLASSES_WITH_PROTO':        EMULATE_ELEMENT_CLASSES_WITH_PROTO,
        'FUNCTION_TO_STRING_RETURNS_SOURCE':         FUNCTION_TO_STRING_RETURNS_SOURCE,
        'HTML_ELEMENT_CLASS':                        HTML_ELEMENT_CLASS,
        'OBJECT_PROTO':                              OBJECT_PROTO,
        'SELECTORS_API':                             SELECTORS_API,
        'XPATH':                                     XPATH
      };
    })());

  /*---------------------------------- BUGS ----------------------------------*/

    Bug = Fuse.Browser.Bug = createTester((function() {
      function ARRAY_CONCAT_ARGUMENTS_BUGGY() {
        // true for Opera
        return (function() { return Array.prototype.concat &&
          [].concat(arguments).length === 2 })(1, 2);
      }

      function ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS() {
        // true for IE
        var node, clone;
        (node = document.createAttribute('name')).value = 'original';
        Fuse._div.setAttributeNode(node);
        (clone = Fuse._div.cloneNode(false)).setAttribute('name', 'cloned');
        Fuse._div.removeAttribute('name');

        return (node = clone.getAttributeNode('name')) &&
          node.value === 'original';
      }

      function BODY_ACTING_AS_ROOT() {
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
      }

      function BODY_OFFSETS_INHERIT_ITS_MARGINS() {
        // true for Safari
        var backup = Fuse._body.style.cssText || '';
        Fuse._body.style.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
        var result = Fuse._body.offsetTop === 1;
        Fuse._body.style.cssText = backup;
        return result;
      }

      function ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO() {
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
      }

      function ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX() {
        if (Feature('ELEMENT_COMPUTED_STYLE')) {
          // true for Opera 9.2x
          var backup = Fuse._docEl.style.paddingBottom;
          Fuse._docEl.style.paddingBottom = '1px';
          var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null),
           result = style && (parseInt(style.height) || 0) ===  Fuse._docEl.offsetHeight;
          Fuse._docEl.style.paddingBottom = backup;
          return result;
        }
      }

      function ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN() {
        if (Feature('ELEMENT_COMPUTED_STYLE')) {
          // true for Opera
          var backup = Fuse._docEl.style.display;
          Fuse._docEl.style.display = 'none';

          // Safari 2: getComputedStyle() will return null
          // for elements with style display:none
          var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null),
           result = style && style.height === '0px';

          Fuse._docEl.style.display = backup;
          return result;
        }
      }

      function ELEMENT_PROPERTIES_ARE_ATTRIBUTES() {
        // true for IE
        Fuse._div.__attrAsExpandoProps = 'something';
        var result = Fuse._div.getAttribute('__attrAsExpandoProps') === 'something';
        Fuse._div.removeAttribute('__propertiesAreAttributes');
        if (typeof Fuse._div.__propertiesAreAttributes !== 'undefined')
          delete Fuse._div.__propertiesAreAttributes;
        return result;
      }

      function ELEMENT_TABLE_INNERHTML_INSERTS_TBODY() {
        // true for IE and Firefox 3
        Fuse._div.innerHTML = '<table><tr><td></td></tr></table>';
        var result = getNodeName(Fuse._div.firstChild.firstChild) === 'TBODY';
        Fuse._div.innerHTML = '';
        return result;
      }

      function REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY() {
        // true for Webkit and IE
        return !!'\x09\x0B\x0C\x20\xA0\x0A\x0D\u2028\u2029\u1680\u180e\u2000-\u200a\u202f\u205f\u3000'
          .replace(/\s+/, '').length;
      }

      function SELECTORS_API_CASE_INSENSITIVE_CLASSNAME() {
        // Safari 3 before 3.1.2 treat class names
        // case-insensitively in quirks mode.
        var result = false;
        if (Feature('SELECTORS_API')) {
          Fuse._div.id = 'fusejs_test_id';
          Fuse._div.innerHTML = '<span class="Test"></span>';
          result = Fuse._div.querySelector('#fusejs_test_id .test') !== null;
          Fuse._div.id = Fuse._div.innerHTML = '';
        }
        return result;
      }

      function STRING_REPLACE_COHERSE_FUNCTION_TO_STRING() {
        // true for Safari 2
        var func = function() { return '' };
        return 'a'.replace(/a/, func) === String(func);
      }

      var COMMENT_NODES_IN_CHILDREN_NODELIST = createCommentTest(function(element) {
        // true for IE
        return Feature('ELEMENT_CHILDREN_NODELIST') && element.children.length === 2;
      });

      var ELEMENT_SELECT_INNERHTML_BUGGY = createInnerHTMLTest(
        '<select><option></option></select>', '<option>test</option>'
      );

      var ELEMENT_TABLE_INNERHTML_BUGGY = createInnerHTMLTest(
        // left out tbody to test if it's auto inserted
        '<table><tr><td></td></tr></table>', '<tr><td><div>test</div></td></tr>'
      );

      var GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES = createCommentTest(function(element) {
        // true for IE
        return element.getElementsByTagName('*').length === 2;
      });

      return {
        'ARRAY_CONCAT_ARGUMENTS_BUGGY':                       ARRAY_CONCAT_ARGUMENTS_BUGGY,
        'ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS':         ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS,
        'BODY_ACTING_AS_ROOT':                                BODY_ACTING_AS_ROOT,
        'BODY_OFFSETS_INHERIT_ITS_MARGINS':                   BODY_OFFSETS_INHERIT_ITS_MARGINS,
        'COMMENT_NODES_IN_CHILDREN_NODELIST':                 COMMENT_NODES_IN_CHILDREN_NODELIST,
        'ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO':            ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO,
        'ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX': ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX,
        'ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN':  ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN,
        'ELEMENT_PROPERTIES_ARE_ATTRIBUTES':                  ELEMENT_PROPERTIES_ARE_ATTRIBUTES,
        'ELEMENT_SELECT_INNERHTML_BUGGY':                     ELEMENT_SELECT_INNERHTML_BUGGY,
        'ELEMENT_TABLE_INNERHTML_BUGGY':                      ELEMENT_TABLE_INNERHTML_BUGGY,
        'ELEMENT_TABLE_INNERHTML_INSERTS_TBODY':              ELEMENT_TABLE_INNERHTML_INSERTS_TBODY,
        'GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES':     GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES,
        'SELECTORS_API_CASE_SENSITIVE_CLASSNAME':             SELECTORS_API_CASE_INSENSITIVE_CLASSNAME,
        'STRING_REPLACE_COHERSE_FUNCTION_TO_STRING':          STRING_REPLACE_COHERSE_FUNCTION_TO_STRING,
        'REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY':            REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY
      };
    })());
  })();
