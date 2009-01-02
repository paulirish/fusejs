  /*-------------------------------- FEATURES --------------------------------*/

  var Feature, Bug;
  (function() {
    function Test(testObject) {
      var Tester = function() {
        for (var i = 0, answer, name; name = arguments[i++]; ) {
          answer = name.charAt(0) !== '!';
          if (typeof testObject[name] === 'function')
            testObject[name] = testObject[name]();
          if (testObject[name] !== answer)
            return false;
        }
        return true;
      };
      Tester.add = function(name, value) { testObject[name] = value };
      Tester.remove = function(name) { delete testObject[name] };
      return Tester;
    }

    Feature = Test((function() {
      function ARGUMENTS_INSTANCEOF_ARRAY() {
        // true for Opera
        return (function() { return arguments instanceof Array })();
      }

      function CREATE_ELEMENT_WITH_HTML() {
        try { // true for IE
          var div = doc.createElement('<div id="test">');
          return div.id === 'test';
        } catch(e) {
          return false;
        }
      }

      function DOCUMENT_ALL_COLLECTION() {
        // true for all but Firefox
        return isHostObject(doc, 'all');
      }

      function DOCUMENT_CREATE_EVENT() {
        // true for all but IE
        return isHostObject(doc, 'createEvent');
      }

      function DOCUMENT_RANGE(){
        // true for all but IE
        return isHostObject(doc, 'createRange');
      }

      function DOCUMENT_STYLE_SHEETS_COLLECTION() {
        // true for all so far
        return isHostObject(doc, 'styleSheets');
      }

      function ELEMENT_ADD_EVENT_LISTENER() {
        // true for all but IE
        return isHostObject(doc, 'addEventListener');
      }

      function ELEMENT_ATTACH_EVENT() {
        // true for IE
        return isHostObject(doc, 'attachEvent') &&
          !Feature('ELEMENT_ADD_EVENT_LISTENER');
      }

      function ELEMENT_BOUNDING_CLIENT_RECT() {
        // true for IE, Firefox 3
        return isHostObject(docEl, 'getBoundingClientRect');
      }

      function ELEMENT_CLIENT_COORDS() {
        // true for IE
        return typeof docEl.clientLeft === 'number';
      }

      function ELEMENT_COMPUTED_STYLE() {
        // true for all but IE
        return isHostObject(doc, 'defaultView') && isHostObject(doc.defaultView, 'getComputedStyle');
      }

      function ELEMENT_COMPARE_DOCUMENT_POSITION() {
        // true for Firefox and Opera 9.5+
        return isHostObject(docEl, 'compareDocumentPosition');
      }

      function ELEMENT_CURRENT_STYLE() {
        // true for IE
        return isHostObject(docEl, 'currentStyle') && !Feature('ELEMENT_COMPUTED_STYLE');
      }

      function ELEMENT_DO_SCROLL() {
        // true for IE
        return isHostObject(docEl, 'doScroll');
      }

      function ELEMENT_EXTENSIONS() {
        // true for Firefox, WebKit
        if (!P.BrowserFeatures.ElementExtensions && isHostObject(dummy, '__proto__')) {
          global.HTMLElement = { };
          global.HTMLElement.prototype = dummy.__proto__;
          P.BrowserFeatures.ElementExtensions = true;
        }
        return P.BrowserFeatures.ElementExtensions;
      }

      function ELEMENT_GET_ATTRIBUTE_IFLAG() {
        // create new div because we can't remove these
        // once they are added :(
        var result = false;
        try {
          var div = doc.createElement('div');
          div.setAttribute('test', 1);
          div.setAttribute('tEsT', 2);
          result = (div.getAttribute('tEsT') === 1 &&
            div.getAttribute('tEsT', 1) === 2);
        } catch(e) { }
        return result;
      }

      function ELEMENT_INNER_TEXT() {
        // true for IE
        return !Feature('ELEMENT_TEXT_CONTENT') &&
          typeof dummy.innerText === 'string';
      }

      function ELEMENT_MS_CSS_FILTERS() {
        // true for IE
        return isHostObject(docEl, 'filters') &&
          typeof docEl.style.filter === 'string';
      }

      function ELEMENT_REMOVE_NODE() {
        // true for IE
        return isHostObject(docEl, 'removeNode');
      }

      function ELEMENT_SOURCE_INDEX() {
        // true for IE and Opera
        return typeof docEl.sourceIndex === 'number';
      }

      function ELEMENT_SPECIFIC_EXTENSIONS() {
        if (P.Browser.MobileSafari)
          P.BrowserFeatures.SpecificElementExtensions = false;
        return P.BrowserFeatures.SpecificElementExtensions;
      }

      function ELEMENT_TEXT_CONTENT() {
        // true for all but IE and Safari 2
        return typeof dummy.textContent === 'string';
      }

      function SELECTORS_API() {
        // true for WebKit (Safari 3, Chrome)
        return P.BrowserFeatures.SelectorsAPI;
      }

      function TYPEOF_NODELIST_IS_FUNCTION() {
        // true for WebKit
        return typeof docEl.childNodes === 'function';
      }

      function XPATH() {
        // true for all but IE
        return P.BrowserFeatures.XPath;
      }

      var ELEMENT_CHILDREN_NODELIST, ELEMENT_CONTAINS;
      (function() {
        // true for IE, Safari 3, Opera, Firefox 3+
		if (!isHostObject(docEl, 'children'))
		  ELEMENT_CHILDREN_NODELIST = false;

        // true for all but IE and Safari 2
		if (!isHostObject(docEl, 'contains'))
		  ELEMENT_CONTAINS = false;

        // no need to test further is both failed
        if (ELEMENT_CHILDREN_NODELIST === false &&
          ELEMENT_CONTAINS === false) return;

        dummy.appendChild(dummy.cloneNode(false));
        dummy.appendChild(dummy.cloneNode(true));

        // ensure children collection only contains direct descendants
        if (ELEMENT_CHILDREN_NODELIST !== false)
          ELEMENT_CHILDREN_NODELIST = dummy.children.length === dummy.childNodes.length;

        // ensure element.contains() returns the correct results;
        if (ELEMENT_CONTAINS !== false)
          ELEMENT_CONTAINS = !dummy.firstChild.contains(dummy.childNodes[1].firstChild);

        // cleanup dummy
        dummy.removeChild(dummy.firstChild);
        dummy.removeChild(dummy.firstChild);
      })();

      return {
        'ARGUMENTS_INSTANCEOF_ARRAY':        ARGUMENTS_INSTANCEOF_ARRAY,
        'CREATE_ELEMENT_WITH_HTML':          CREATE_ELEMENT_WITH_HTML,
        'DOCUMENT_ALL_COLLECTION':           DOCUMENT_ALL_COLLECTION,
        'DOCUMENT_CREATE_EVENT':             DOCUMENT_CREATE_EVENT,
        'DOCUMENT_RANGE':                    DOCUMENT_RANGE,
        'DOCUMENT_STYLE_SHEETS_COLLECTION':  DOCUMENT_STYLE_SHEETS_COLLECTION,
        'ELEMENT_ADD_EVENT_LISTENER':        ELEMENT_ADD_EVENT_LISTENER,
        'ELEMENT_ATTACH_EVENT':              ELEMENT_ATTACH_EVENT,
        'ELEMENT_BOUNDING_CLIENT_RECT':      ELEMENT_BOUNDING_CLIENT_RECT,
        'ELEMENT_CHILDREN_NODELIST':         ELEMENT_CHILDREN_NODELIST,
        'ELEMENT_CLIENT_COORDS':             ELEMENT_CLIENT_COORDS,
        'ELEMENT_COMPARE_DOCUMENT_POSITION': ELEMENT_COMPARE_DOCUMENT_POSITION,
        'ELEMENT_COMPUTED_STYLE':            ELEMENT_COMPUTED_STYLE,
        'ELEMENT_CONTAINS':                  ELEMENT_CONTAINS,
        'ELEMENT_CURRENT_STYLE':             ELEMENT_CURRENT_STYLE,
        'ELEMENT_DO_SCROLL':                 ELEMENT_DO_SCROLL,
        'ELEMENT_EXTENSIONS':                ELEMENT_EXTENSIONS,
        'ELEMENT_GET_ATTRIBUTE_IFLAG':       ELEMENT_GET_ATTRIBUTE_IFLAG,
        'ELEMENT_INNER_TEXT':                ELEMENT_INNER_TEXT,
        'ELEMENT_MS_CSS_FILTERS':            ELEMENT_MS_CSS_FILTERS,
        'ELEMENT_REMOVE_NODE':               ELEMENT_REMOVE_NODE,
        'ELEMENT_SOURCE_INDEX':              ELEMENT_SOURCE_INDEX,
        'ELEMENT_SPECIFIC_EXTENSIONS':       ELEMENT_SPECIFIC_EXTENSIONS,
        'ELEMENT_TEXT_CONTENT':              ELEMENT_TEXT_CONTENT,
        'SELECTORS_API':                     SELECTORS_API,
        'TYPEOF_NODELIST_IS_FUNCTION':       TYPEOF_NODELIST_IS_FUNCTION,
        'XPATH':                             XPATH
      };
    })());

    /*----------------------------------- BUGS ---------------------------------*/

    Bug = Test((function() {
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

      function ARRAY_CONCAT_ARGUMENTS_BUGGY() {
        // true for Opera
        return (function() { return Array.prototype.concat && [].concat(arguments) === 1 })(1, 2);
      }

      function BODY_ACTING_AS_ROOT() {
        // true for IE Quirks, Opera 9.25
        if (docEl.clientWidth === 0) return true;

        var backup = { };
        ['body', 'documentElement']._each(function(name) {
          backup[name] = doc[name].style.cssText || '';
          doc[name].style.cssText += ';margin:0;height:auto;';
        });

        Element.insert(body, { top: '<div style="display:block;height:8500px;"></div>' });
        var result = docEl.clientHeight >= 8500;
        body.removeChild(body.firstChild);

        for (name in backup)
          doc[name].style.cssText = backup[name];
        return result;
      }

      function BODY_OFFSETS_INHERIT_ITS_MARGINS() {
        // true for Safari
        var backup = body.style.cssText || '';
        body.style.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
        var result = body.offsetTop === 1;
        body.style.cssText = backup;
        return result;
      }

      function ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO() {
        if (!Feature('ELEMENT_COMPUTED_STYLE')) return false;

        // true for Opera
        var result, s = docEl.style, backup = s.cssText;
        s.position = 'static';
        s.top = s.left = '';

        var style = doc.defaultView.getComputedStyle(docEl, null);
        result = (style && style.top === '0px' && style.left === '0px');
        docEl.style.cssText = backup;
        return result;
      }

      function ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX() {
        if (!Feature('ELEMENT_COMPUTED_STYLE')) return false;

        // true for Opera 9.2x
        var backup = docEl.style.paddingBottom;
        docEl.style.paddingBottom = '1px';
        var style = doc.defaultView.getComputedStyle(docEl, null),
         result = style && (parseInt(style.height) || 0) ===  docEl.offsetHeight;
        docEl.style.paddingBottom = backup;
        return result;
      }

      function ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN() {
        if (!Feature('ELEMENT_COMPUTED_STYLE')) return false;

        // true for Opera
        var backup = docEl.style.display;
        docEl.style.display = 'none';
        var style = doc.defaultView.getComputedStyle(docEl, null),
         result = style && style.height === '0px';

        docEl.style.display = backup;
        return result;
      }

      function ELEMENT_PROPERTIES_ARE_ATTRIBUTES() {
        // true for IE
        dummy.__attrAsExpandoProps = 'something';
        var result = dummy.getAttribute('__attrAsExpandoProps') === 'something';
        dummy.removeAttribute('__propertiesAreAttributes');
        if (typeof dummy.__propertiesAreAttributes !== 'undefined')
          delete dummy.__propertiesAreAttributes;
        return result;
      }

      function ELEMENT_TABLE_INNERHTML_INSERTS_TBODY() {
        // true for IE and Firefox 3
        dummy.innerHTML = '<table><tr><td></td></tr></table>';
        var result = dummy.firstChild.firstChild.tagName.toUpperCase() === 'TBODY';
        dummy.innerHTML = '';
        return result;
      }

      function ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR() {
        try { doc.createElement('table').getAttribute('xml:lang') }
        catch(e) { return true }
        return false;
      }

      function EVENT_OBSERVER_ORDER_NOT_FIFO() {
        // true for all but IE
        var result = '';
        ['a', 'b', 'c', 'd']._each(function(n) {
          doc.observe('eventOrder:checked', function() { result += n });
        });
        doc.fire('eventOrder:checked');
        doc.stopObserving('eventOrder:checked');
        return result !== 'abcd';
      }

      function FORM_CHILDNODES_ARE_ATTRIBUTES() {
        var form = doc.createElement('form');
        form.appendChild(doc.createElement('input'));
        form.firstChild.id = 'method';
        return typeof form.getAttribute('method') !== 'string';
      }

      function REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY() {
        return !!'\x09\x0B\x0C\x20\xA0\x0A\x0D\u2028\u2029\u1680\u180e\u2000-\u200a\u202f\u205f\u3000'
          .replace(/\s+/, '').length;
      }

      function SELECTORS_API_CASE_INSENSITIVE_CLASSNAME() {
        // Safari 3 before 3.1.2 treat class names 
        // case-insensitively in quirks mode.
        var result = false;
        if (Feature('SELECTORS_API')) {
          var span = document.createElement('span');
          dummy.id = 'fusejs_test_id';
          span.className = 'Test';
          dummy.appendChild(span);
          result = dummy.querySelector('#fusejs_test_id .test') !== null;

          // cleanup dummy
          dummy.id = '';
          dummy.removeChild(span);
        }
        return result;
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
        'ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR':              ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR,
        'EVENT_OBSERVER_ORDER_NOT_FIFO':                      EVENT_OBSERVER_ORDER_NOT_FIFO,
        'FORM_CHILDNODES_ARE_ATTRIBUTES':                     FORM_CHILDNODES_ARE_ATTRIBUTES,
        'GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES':     GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES,
        'SELECTORS_API_CASE_SENSITIVE_CLASSNAME':             SELECTORS_API_CASE_INSENSITIVE_CLASSNAME,
        'REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY':            REGEXP_WHITESPACE_CHARACTER_CLASS_BUGGY
      };
    })());
  })();
