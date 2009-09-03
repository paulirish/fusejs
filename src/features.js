  /*--------------------------- FEATURE/BUG TESTER ---------------------------*/

  (function() {
    function createTester(name) {
      var Tester = new Function('', [
        'function ' + name + '() {',
        'var title, o = ' + name + '._object, i = 0;',
      	'while (title = arguments[i++]) {',
        'if (typeof o[title] === "function") o[title] = o[title]();',
        'if (o[title] !== true) return false;',
        '}', 'return true;',
        '}', 'return ' + name].join('\n'))();

      Tester.set = function(name, value) {
        var o = this._object;
        if (typeof name === 'object'){
          for (var i in name) o[i] = name[i];
        } else o[name] = value;
      };

      Tester.unset = function(name) {
        var o = this._object;
        name = name.valueOf();
        if (typeof name === 'string') delete o[name];
        else {
          for (var i in name) delete o[i];
        }
      };

      Tester._object = { };
      return Tester;
    }

    Bug = Fuse.Env.Bug = createTester('Bug');
    Feature = Fuse.Env.Feature = createTester('Feature');
  })();

  /*---------------------------- BROWSER FEATURES ----------------------------*/

  Feature.set({
    'ACTIVE_X_OBJECT': function() {
      // true for IE
      return isHostObject(global, 'ActiveXObject');
    },

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
      return isHostObject(Fuse._doc, 'createEventObject');
    },

    'DOCUMENT_RANGE': function(){
      // true for all but IE
      return isHostObject(Fuse._doc, 'createRange');
    },

    'DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT': function() {
      if (Feature('DOCUMENT_RANGE'))
        return isHostObject(Fuse._doc.createRange(), 'createContextualFragment');
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

    'ELEMENT_COMPARE_DOCUMENT_POSITION': function() {
      // true for Firefox and Opera 9.5+
      return isHostObject(Fuse._docEl, 'compareDocumentPosition');
    },

    'ELEMENT_COMPUTED_STYLE': function() {
      // true for all but IE
      return isHostObject(Fuse._doc, 'defaultView') &&
        isHostObject(Fuse._doc.defaultView, 'getComputedStyle');
    },

    'ELEMENT_CURRENT_STYLE': function() {
      // true for IE
      return isHostObject(Fuse._docEl, 'currentStyle') &&
        !Feature('ELEMENT_COMPUTED_STYLE');
    },

    'ELEMENT_CONTAINS': function() {
      // true for all but IE and Safari 2
      if(isHostObject(Fuse._docEl, 'contains')) {
        var result, div = Fuse._div;
        div.innerHTML = '<div><\/div><div><div><\/div><\/div>';

        // ensure element.contains() returns the correct results;
        result = !div.firstChild.contains(div.childNodes[1].firstChild);
        div.innerHTML = '';
        return result;
      }
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
      var div = Fuse._div, result = false;
      try {
        div.setAttribute('align', 'center'); div.setAttribute('aLiGn', 'left');
        result = (div.getAttribute('aLiGn') === 'center' &&
          div.getAttribute('aLiGn', 1) === 'left');
        div.removeAttribute('align'); div.removeAttribute('aLiGn');
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
        typeof Fuse._docEl.style.filter === 'string' &&
        typeof Fuse._docEl.style.opacity !== 'string';
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
      var docEl = Fuse._docEl;
      return (isHostObject(global, 'HTMLHtmlElement') &&
        isHostObject(global.HTMLHtmlElement, 'prototype') && (
        docEl.constructor === HTMLHtmlElement ||
        docEl instanceof HTMLHtmlElement || Feature('OBJECT__PROTO__') &&
        docEl['__proto__'] === HTMLHtmlElement.prototype));
    },

    'ELEMENT_TEXT_CONTENT': function() {
      // true for all but IE and Safari 2
      return typeof Fuse._div.textContent === 'string';
    },

    'FUNCTION_TO_STRING_RETURNS_SOURCE': function() {
      // true for all but some mobile browsers
      function toStringTest(param1, param2) { var x = 1; }
      var source = toStringTest.toString();
      return source.indexOf('param1') > -1 && source.indexOf('x = 1') > -1;
    },

    'HTML_ELEMENT_CLASS': function() {
      // true for all but IE
      // (Safari 2 support is emulated in element.js)
      return isHostObject(global,'HTMLElement') &&
        isHostObject(global.HTMLElement, 'prototype');
    },

    'OBJECT__PROTO__': function() {
      // true for Gecko and Webkit
      if (isHostObject(Fuse._docEl, '__proto__') &&
          [ ]['__proto__'] === Array.prototype  &&
          { }['__proto__'] === Object.prototype) {
        // test if it's writable and restorable
        var result, list = [], backup = list['__proto__'];
        list['__proto__'] = { };
        result = typeof list.push === 'undefined';
        list['__proto__'] = backup;
        return result && typeof list.push === 'function';
      }
    },

    'OBJECT__COUNT__': function() {
      // true for Gecko
      if (Feature('OBJECT__PROTO__')) {
        var o = { 'x':0 };
        delete o['__count__'];
        return typeof o['__count__'] === 'number' && o['__count__'] === 1;
      }
    }
  });

  /*------------------------------ BROWSER BUGS ------------------------------*/

  Bug.set({
    'ARRAY_CONCAT_ARGUMENTS_BUGGY': function() {
      // true for Opera
      return (function() { return Array.prototype.concat &&
        [].concat(arguments).length === 2; })(1, 2);
    },

    'ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS': function() {
      // true for IE
      var node, clone, div = Fuse._div;
      (node = document.createAttribute('name')).value = 'x';
      div.setAttributeNode(node);
      (clone = div.cloneNode(false)).setAttribute('name', 'y');
      div.removeAttribute('name');
      return (node = clone.getAttributeNode('name')) && node.value === 'x';
    },

    'BODY_ACTING_AS_ROOT': function() {
      // true for IE Quirks, Opera 9.25
      var body = Fuse._body, div = Fuse._div, docEl = Fuse._docEl;
      if (docEl.clientWidth === 0) return true;

      var ds = div.style, bs = body.style, des = docEl.style,
       bsBackup = bs.cssText, desBackup = des.cssText;

      bs.margin  = des.margin = '0';
      bs.height  = des.height = 'auto';
      ds.cssText = 'display:block;height:8500px;';

      body.insertBefore(div, body.firstChild);
      var result = docEl.clientHeight >= 8500;

      // check scroll coords
      var scrollTop = docEl.scrollTop;
      Bug.set('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT',
        ++docEl.scrollTop && docEl.scrollTop === scrollTop + 1);
      docEl.scrollTop = scrollTop;

      // cleanup
      body.removeChild(div);
      bs.cssText  = bsBackup;
      des.cssText = desBackup;
      ds.cssText  = '';

      return result;
    },

    'BODY_OFFSETS_INHERIT_ITS_MARGINS': function() {
      // true for Safari
      var body = Fuse._body, bs = body.style, backup = bs.cssText;
      bs.cssText += ';position:absolute;top:0;margin:1px 0 0 0;';
      var result = body.offsetTop === 1;
      bs.cssText = backup;
      return result;
    },

    'ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var result, des = Fuse._docEl.style, backup = des.cssText;
        des.position = 'static';
        des.top = des.left = '';

        var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null);
        result = (style && style.top === '0px' && style.left === '0px');
        des.cssText = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera 9.2x
        var docEl = Fuse._docEl, des = docEl.style, backup = des.paddingBottom;
        des.paddingBottom = '1px';
        var style = Fuse._doc.defaultView.getComputedStyle(docEl, null),
         result = style && (parseInt(style.height) || 0) ===  docEl.offsetHeight;
        des.paddingBottom = backup;
        return result;
      }
    },

    'ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN': function() {
      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // true for Opera
        var des = Fuse._docEl.style, backup = des.display;
        des.display = 'none';

        // In Safari 2 getComputedStyle() will return null for elements with style display:none
        var style = Fuse._doc.defaultView.getComputedStyle(Fuse._docEl, null),
         result = style && style.height === '0px';

        des.display = backup;
        return result;
      }
    },

    'ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH': function() {
      // true for all but IE8
      var body = Fuse._body, div = Fuse._div, bs = Fuse._body.style, backup = bs.cssText;
      body.appendChild(div);
      var value = div.offsetLeft;
      bs.cssText += ';border: 1px solid transparent;';
      var result = (value === div.offsetLeft);
      bs.cssText = backup;
      body.removeChild(div);
      return result;
    },

    'ELEMENT_OBJECT_AND_RELATIVES_FAILS_TO_INHERIT_FROM_PROTOTYPE': function() {
      // IE8 bugs:
      // Must reference Element as a property of global when assigning
      // properties to its prototype or it will create a seperate instance
      // for Element and global.Element.

      // HTMLObjectElement, HTMLAppletElement and HTMLEmbedElement objects
      // don't inherit from their prototypes. Creating an APPLET element
      // will alert a warning message if Java is not installed.
      if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
        var element = Fuse._doc.createElement('object'),
         prototype = global.Element.prototype;
        prototype[expando] = true;
        var result = !element[expando];
        delete prototype[expando];
        return result;
      }
    },

    'ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT_PROPERTY_ON_INSERT': function() {
      var docEl = Fuse._docEl, element = Fuse._doc.createElement('script');
      element.text = 'Fuse.' + expando +' = true;';
      docEl.insertBefore(element, docEl.firstChild);
      var result = !Fuse[expando];
      docEl.removeChild(element);
      delete Fuse[expando];
      return result;
    },

    'ELEMENT_TABLE_INNERHTML_INSERTS_TBODY': function() {
      // true for IE and Firefox 3
      var div = Fuse._div;
      div.innerHTML = '<table><tr><td><\/td><\/tr><\/table>';
      var result = getNodeName(div.firstChild.firstChild) === 'TBODY';
      div.innerHTML = '';
      return result;
    },

    'GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES': function() {
      // true for IE
      var div = Fuse._div;
      div.innerHTML = '<p>x<\/p><!--y-->';
      var result = div.getElementsByTagName('*').length === 2;
      div.innerHTML = '';
      return result;
    },

    'STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION': function() {
       // true for Chrome 1 and 2
       return 'x'.lastIndexOf('x', -1) !== 0;
    },

    'STRING_METHODS_WRONGLY_SETS_REGEXP_LAST_INDEX': function() {
      // true for IE
      var string = 'oxo', data = [], pattern = /x/;
      string.replace(pattern, '');
      data[0] = !!pattern.lastIndex;
      string.match(pattern);
      data[1] = !!pattern.lastIndex;
      return data[0] || data[1];
    },

    'STRING_REPLACE_COHERSE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return ''; };
      return 'a'.replace(/a/, func) === String(func);
    },

    'STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN': function() {
      // true for Chrome 1
      var string = 'xy', replacement = function() { return 'o'; };
      return !(string.replace(/()/g, 'o') === 'oxoyo' &&
        string.replace(new RegExp('', 'g'), replacement) === 'oxoyo' &&
        string.replace(/(y|)/g, replacement) === 'oxoo');
    },

    'TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN': function() {
      // true for IE7 and lower
      Fuse._div.innerHTML = '<table><tbody style="display:none"><tr style="width:1px"><td><\/td><\/tr><\/tbody><\/table>';
      Fuse._body.appendChild(Fuse._div);
      var result = !!Fuse._div.firstChild.firstChild.offsetWidth;
      Fuse._body.removeChild(Fuse._div);
      return result;
    }
  });

  Bug.set((function() {
    function createInnerHTMLTest(source, innerHTML, targetNode) {
      return function() {
        var div = Fuse._div, result = true;
        div.innerHTML = source;
        var element = div.firstChild;
        if (targetNode) element = element.getElementsByTagName(targetNode)[0];
        try {
          result = (element.innerHTML = innerHTML) &&
            element.innerHTML.toLowerCase() !== innerHTML;
        } catch(e) { }
        div.innerHTML = '';
        return result;
      };
    }

    return {
      'ELEMENT_COLGROUP_INNERHTML_BUGGY': createInnerHTMLTest(
        '<table><colgroup><\/colgroup><tbody><\/tbody><\/table>',
        '<col><col>', 'colgroup'
      ),

      'ELEMENT_OPTGROUP_INNERHTML_BUGGY': createInnerHTMLTest(
        '<select><optgroup><\/optgroup><\/select>',
        '<option>x<\/option>', 'optgroup'
      ),

      'ELEMENT_SELECT_INNERHTML_BUGGY': createInnerHTMLTest(
        '<select><option><\/option><\/select>', '<option>x<\/option>'
      ),

      'ELEMENT_TABLE_INNERHTML_BUGGY': createInnerHTMLTest(
        // left out tbody to test if it's auto inserted
        '<table><tr><td><\/td><\/tr><\/table>', '<tr><td><p>x<\/p><\/td><\/tr>'
      )
    };
  })());
