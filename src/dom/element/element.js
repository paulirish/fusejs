  /*-------------------------------- ELEMENT ---------------------------------*/

  // Cache Element capabilities before overwriting the Element object
  Feature('ELEMENT_CLASS');
  Feature('ELEMENT_EXTENSIONS');
  Feature('ELEMENT_SPECIFIC_EXTENSIONS');

  // For speed we don't normalize tagName case.
  // There is the potential for cache.div, cache.DIV, cache['<div name="x">']
  // Please stick to either all uppercase or lowercase tagNames.
  //
  // IE7 and below need to use the sTag of createElement to set the `name` attribute
  // http://msdn.microsoft.com/en-us/library/ms536389.aspx
  //
  // IE fails to set the BUTTON element's `type` attribute without using the sTag
  // http://dev.rubyonrails.org/ticket/10548
  (function() {
    var cache, original = global.Element;

    function createElement(tagName, attributes) {
      var element = cache[tagName];
      if (!element)
        element = cache[tagName] = Element.extend(Fuse._doc.createElement(tagName));
      element = element.cloneNode(false);
      return attributes
        ? Element.writeAttribute(element, attributes)
        : element;
    }

    function emulateDOMClass(className) {
      var proto = (global[className] = global[className] || { })
        .prototype = Fuse._div['__proto__'];

      // bonus! make the dom methods able to execute via call/apply
      eachKey(proto, function(value, key) {
        if (hasKey(proto, key) && typeof value === 'function' && 
            value['__proto__'] !== Function.prototype)
          proto[key]['__proto__'] = Function.prototype;
      });
    }

    if (Feature('CREATE_ELEMENT_WITH_HTML')) {
      global.Element = function(tagName, attributes) {
        var name, type;
        if (attributes && ((name = attributes.name) || (type = attributes.type))) {
          tagName = '<' + tagName +
            (name ? ' name="' + name + '"' : '') +
            (type ? ' type="' + type + '"' : '') + '>';
          delete attributes.name; delete attributes.type;
        }
        return createElement(tagName, attributes);
      };
    }
    else global.Element = createElement;

    // Avoid Fuse.Object.extend() because IE8 cannot set any variable/property
    // reference to Element.toString.
    if (original) {
      _extend(global.Element, original);
      global.Element.prototype = original.prototype;
    }

    // Safari 2
    if (Feature('OBJECT__PROTO__')) {
      // add Element prototype
      if (!Feature('ELEMENT_CLASS')) {
        Feature.set({ 'ELEMENT_CLASS': true, 'ELEMENT_EXTENSIONS': true });
        emulateDOMClass('Element');
      }

      // add HTMLElement for Safari 2
      if (!Feature('HTML_ELEMENT_CLASS')) {
        Feature.set({ 'HTML_ELEMENT_CLASS': true, 'ELEMENT_EXTENSIONS': true });
        emulateDOMClass('HTMLElement');
      }
    }

    cache = global.Element.cache = { };
    global.Element.idCounter = 1;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    // element method caches
    var Methods, ByTag, revision = 0;

    function refreshMethodCache() {
      Methods = []; ByTag = { };

      eachKey(Element.Methods, function(value, key, object) {
        if (key !== 'Simulated' && key !== 'ByTag')
          Methods.push([key, Func.methodize([key, object])]);
      });

      eachKey(Element.Methods.Simulated, function(value, key, object) {
        Methods.push([key, Func.methodize([key, object])]);
      });

      for (var tagName in Element.Methods.ByTag) {
        ByTag[tagName] = slice.call(Methods, 0);
        eachKey(Element.Methods.ByTag[tagName], function(value, key, object) {
          ByTag[tagName].push([key, Func.methodize([key, object])]);
        });
      }
      revision++;
    }

    /*------------------------------------------------------------------------*/

    Element.extend = (function() {
      function createRevisionGetter(r) {
        return function() { return r };
      }

      function extendElement(element, nodeName) {
        nodeName = nodeName || getNodeName(element);
        var pair, methods = ByTag[nodeName] || Methods, length = methods.length;
        while (length--) {
          pair = methods[length];
          if (!hasKey(element, pair[0]))
            element[pair[0]] = pair[1];
        }

        // avoid using Fuse.K.curry(revision) for speed
        element._extendedByFuse = createRevisionGetter(revision);
        return element;
      }

      function extend(element) {
        // Bail on elements that don't need extending,
        // XML nodes (IE errors on them), document, window objects
        if (!element || (typeof element._extendedByFuse !== 'undefined' &&
          element._extendedByFuse() >= revision) ||
          element.nodeType !== 1 || element == getWindow(element) ||
          !element.ownerDocument.body) return element;

        return extendElement(element);
      }

      // Browsers with specific element extensions
      // don't need their elements extended UNLESS
      // they belong to a different document
      if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
        extend = (function(__extend) {
          function extend(element) {
            return (element && element.ownerDocument &&
              element.ownerDocument !== Fuse._doc) ? __extend(element) : element;
          }
          return extend;
        })(extend);
      }

      // In IE8 APPLET, EMBED, and OBJECT elements don't inherit from their prototypes
      if (Bug('ELEMENT_OBJECT_AND_RELATIVES_FAILS_TO_INHERIT_FROM_PROTOTYPE')) {
        extend = (function(__extend) {
          function extend(element) {
            var nodeName = element && getNodeName(element);
            if (BUGGY[nodeName]) {
              return (typeof element._extendedByFuse !== 'undefined' &&
                element._extendedByFuse() >= revision) ?
                  element : extendElement(element, nodeName);
            }
            return __extend(element);
          }
          var BUGGY = { 'APPLET': 1, 'EMBED': 1, 'OBJECT': 1 };
          return extend;
        })(extend);
      }

      return extend;
    })();

    /*------------------------------------------------------------------------*/

    Element.addMethods = (function() {
      var tagNameClassLookup = {
        'A':        'Anchor',
        'CAPTION':  'TableCaption',
        'COL':      'TableCol',
        'COLGROUP': 'TableCol',
        'DEL':      'Mod',
        'DIR':      'Directory',
        'DL':       'DList',
        'H1':       'Heading',
        'H2':       'Heading',
        'H3':       'Heading',
        'H4':       'Heading',
        'H5':       'Heading',
        'H6':       'Heading',
        'IFRAME':   'IFrame',
        'IMG':      'Image',
        'INS':      'Mod',
        'FIELDSET': 'FieldSet',
        'FRAMESET': 'FrameSet',
        'OL':       'OList',
        'OPTGROUP': 'OptGroup',
        'P':        'Paragraph',
        'Q':        'Quote',
        'TBODY':    'TableSection',
        'TD':       'TableCell',
        'TEXTAREA': 'TextArea',
        'TH':       'TableCell',
        'TFOOT':    'TableSection',
        'THEAD':    'TableSection',
        'TR':       'TableRow',
        'UL':       'UList'
      },

      // supports IE8 as well as EOMB
      elementProto = Feature('HTML_ELEMENT_CLASS') && global.HTMLElement.prototype ||
        Feature('ELEMENT_CLASS') && global.Element.prototype;

      function copyMethods(methods, destination, onlyIfAbsent) {
        onlyIfAbsent = onlyIfAbsent || false;
        eachKey(methods, function(value, key) {
          if (typeof value === 'function' &&
             (!onlyIfAbsent || !(key in destination)))
            destination[key] = Func.methodize([key, methods]);
        });
      }

      function extendByTag(tagName, methods) {
        tagName = tagName.toUpperCase();
        if (!Element.Methods.ByTag[tagName])
          Element.Methods.ByTag[tagName] = { };
        Obj.extend(Element.Methods.ByTag[tagName], methods);
      }

      function findDOMClass(tagName) {
        // catch most classes like HTMLUListElement and HTMLSelectElement
        var className = 'HTML' + (tagNameClassLookup[tagName] ||
          Fuse.String(tagName).capitalize()) + 'Element';
        if (global[className]) return global[className];

        // catch element classes like HTMLLIElement
        className = 'HTML' + tagName + 'Element';
        if (global[className]) return global[className];
      }

      function addMethods(tagName, methods) {
        var extend = Obj.extend, elementMethods = Element.Methods,
         formMethods = Form.Methods, fieldMethods = Field.Methods,
         T = elementMethods.ByTag;

        // if arguments.length < 2
        if (tagName && !methods || !tagName && !methods) {
          methods = tagName; tagName = null;
          extend(Form,  formMethods);
          extend(Field, fieldMethods);
          extend(T, {
            'BUTTON':   clone(fieldMethods),
            'FORM':     clone(formMethods),
            'INPUT':    clone(fieldMethods),
            'SELECT':   clone(fieldMethods),
            'TEXTAREA': clone(fieldMethods)
          });
        }

        if (!tagName || tagName == '')
          extend(elementMethods, methods);
        else {
          isArray(tagName)
            ? tagName._each(function(name) { extendByTag(name, methods) })
            : extendByTag(tagName, methods);
        }

        if (Feature('ELEMENT_EXTENSIONS')) {
          copyMethods(elementMethods, elementProto);
          copyMethods(elementMethods.Simulated, elementProto, true);
        }

        if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
          var domClass, infiniteRevision = function() { return Infinity };
          for (tagName in T) {
            domClass = findDOMClass(tagName);
            if (typeof domClass === 'undefined') continue;
            copyMethods(T[tagName], domClass.prototype);
          }
          elementProto._extendedByFuse = infiniteRevision;
        }

        extend(Element, elementMethods);
        delete Element.ByTag;

        // refresh element method cache and clear element cache
        refreshMethodCache();
        Element.cache = { };
      }

      return addMethods;
    })();
  })();

  /*--------------------------------------------------------------------------*/

  Element._insertionTranslations = {
    'tags': {
      'COLGROUP': ['<table><colgroup>',      '<\/colgroup><tbody><\/tbody><\/table>', 2],
      'SELECT':   ['<select>',               '<\/select>',                            1],
      'TABLE':    ['<table>',                '<\/table>',                             1],
      'TBODY':    ['<table><tbody>',         '<\/tbody><\/table>',                    2],
      'TR':       ['<table><tbody><tr>',     '<\/tr><\/tbody><\/table>',              3],
      'TD':       ['<table><tbody><tr><td>', '<\/td><\/tr><\/tbody><\/table>',        4]
    }
  };

  (function(T) {
    // TODO: Opera fails to render optgroups when set with innerHTML
    _extend(T.tags, {
      'OPTGROUP': T.tags.SELECT,
      'TFOOT':    T.tags.TBODY,
      'TH':       T.tags.TD,
      'THEAD':    T.tags.TBODY
    });

    T.before = function before(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element);
    };

    T.top = function top(element, node) {
      element.insertBefore(node, element.firstChild);
    };

    T.bottom = function bottom(element, node) {
      element.appendChild(node);
    };

    T.after = function after(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element.nextSibling);
    };

    // prevent JScript bug with named function expressions
    var after = null, before = null,  bottom = null, top = null;
  })(Element._insertionTranslations);

  /*--------------------------------------------------------------------------*/

  Element.Methods = {
    'ByTag':     { },
    'Simulated': { }
  };

  (function(methods) {
    methods.cleanWhitespace = function cleanWhitespace(element) {
      // removes whitespace-only text node children
      element = $(element);
      var nextNode, node = element.firstChild;
      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType === 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return element;
    };

    methods.empty = function empty(element) {
      return Fuse.String($(element).innerHTML).blank();
    };

    methods.getDimensions = function getDimensions(element) {
      return { 'width': Element.getWidth(element), 'height': Element.getHeight(element) };
    };

    methods.getOffsetParent = (function() {
      var END_ON_NODE = { 'BODY': 1, 'HTML': 1 },
       OFFSET_PARENTS = { 'TABLE': 1, 'TD': 1, 'TH': 1 };

      function getOffsetParent(element) {
        // http://www.w3.org/TR/cssom-view/#offset-attributes
        element = $(element);
        var original = element, nodeName = getNodeName(element);
        if (nodeName === 'AREA') return Element.extend(element.parentNode);

        // IE throws an error if the element is not in the document.
        // Many browsers report offsetParent as null if the element's
        // style is display:none.
        if (Element.isFragment(element) || element.nodeType === 9 || END_ON_NODE[nodeName] ||
           !element.offsetParent && Element.getStyle(element, 'display') != 'none')
          return null;

        while (element = element.parentNode) {
          nodeName = getNodeName(element);
          if (END_ON_NODE[nodeName]) break;
          if (OFFSET_PARENTS[nodeName] ||
              Element.getStyle(element, 'position') != 'static')
            return Element.extend(element);
        }
        return Element.extend(getDocument(original).body);
      };
      return getOffsetParent;
    })();

    methods.identify = function identify(element) {
      // use readAttribute to avoid issues with form elements and
      // child controls with ids/names of "id"
      var id = Element.readAttribute(element, 'id');
      if (id.length) return id;

      var ownerDoc = element.ownerDocument;
      do { id = 'anonymous_element_' + Element.idCounter++ }
      while (ownerDoc.getElementById(id));
      Element.writeAttribute(element, 'id', id);
      return Fuse.String(id);
    };

    methods.inspect = (function() {
      function inspect(element) {
        element = $(element);
        var attribute, property, value,
         result = '<' + element.nodeName.toLowerCase(),
         translation = { 'id': 'id', 'className': 'class' };

        for (property in translation) {
          attribute = translation[property];
          value = element[property] || '';
          if (value) result += ' ' + attribute + '=' + Fuse.String(value).inspect(true);
        }
        return Fuse.String(result + '>');
      }
      return inspect;
    })();

    methods.isFragment = (function() {
      var isFragment = function isFragment(element) {
        element = $(element);
        var nodeType = element.nodeType;
        return nodeType === 11 || (nodeType === 1 && !(element.parentNode &&
          Element.descendantOf(element, element.ownerDocument)));
      };

      if (Feature('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION')) {
        isFragment = function isFragment(element) {
          element = $(element);
          var nodeType = element.nodeType;
          return nodeType === 11 || (nodeType === 1 &&
            element.ownerDocument.all[element.sourceIndex] !== element);
        };
      }
      if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        isFragment = function isFragment(element) {
          /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
          element = $(element);
          var nodeType = element.nodeType;
          return nodeType === 11 || (nodeType === 1 &&
            (element.ownerDocument.compareDocumentPosition(element) & 1) === 1);
        };
      }
      return isFragment;
    })();

    methods.hide = function hide(element) {
      element = $(element);
      var display = element.style.display;
      if (display && display !== 'none')
        element._originalDisplay = display;
      element.style.display = 'none';
      return element;
    };

    methods.show = function show(element) {
      element = $(element);
      var display = element.style.display;
      if (display === 'none')
        element.style.display = element._originalDisplay || '';
      element._originalDisplay = null;
      return element;
    };

    methods.scrollTo = function scrollTo(element) {
      var pos = Element.cumulativeOffset(element);
      global.scrollTo(pos[0], pos[1]);
      return $(element);
    };

    methods.remove = function remove(element) {
      element = $(element);
      element.parentNode &&
      element.parentNode.removeChild(element);
      return element;
    };

    methods.toggle = function toggle(element) {
      return Element[Element.isVisible(element) ?
        'hide' : 'show'](element);
    };

    methods.isVisible = (function() {
      function isVisible(element) {
        if (!Fuse._body) return false;

        var isVisible = function isVisible(element) {
          // handles IE and the fallback solution
          element = $(element);
          var style = element.currentStyle;
          return style !== null && (style || element.style).display !== 'none' &&
            !!(element.offsetHeight || element.offsetWidth);
        };

        if (Feature('ELEMENT_COMPUTED_STYLE')) {
          isVisible = function isVisible(element) {
            element = $(element);
            var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
            return !!(style && (element.offsetHeight || element.offsetWidth));
          };
        }
        if (Bug('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
          var _isVisible = isVisible;
          isVisible = function isVisible(element) {
            element = $(element);
            if (_isVisible(element)) {
              var nodeName = getNodeName(element);
              if ((nodeName === 'THEAD' || nodeName === 'TBODY' || nodeName === 'TR') &&
                 (element = element.parentNode))
                return Element.isVisible(element);
              return true;
            }
            return false;
          };
        }
        // update API hooks
        Element.isVisible = Element.Methods.isVisible = isVisible;
        return isVisible(element);
      }
      return isVisible;
    })();

    methods.wrap = function wrap(element, wrapper, attributes) {
      element = $(element);
      if (isElement(wrapper))
        $(wrapper).writeAttribute(attributes);
      else if (isString(wrapper))
        wrapper = new Element(wrapper, attributes);
      else wrapper = new Element('div', wrapper);
      if (element.parentNode)
        element.parentNode.replaceChild(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    };

    // prevent JScript bug with named function expressions
    var cleanWhitespace = null,
     empty =              null,
     getDimensions =      null,
     getOffsetParent =    null,
     hide =               null,
     identify =           null,
     isFragment =         null,
     isVisible =          null,
     remove =             null,
     scrollTo =           null,
     show =               null,
     toggle =             null,
     wrap =               null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function(methods) {
    var insertableNodeTypes = { '1': 1, '3': 1, '8': 1, '10': 1, '11': 1 };

    function replaceElement(element, node) {
      element.parentNode.replaceChild(node, element);
    }

    function createContextualFragment(element, content) {
      return Element._getFragmentFromString(element.ownerDocument,
        getNodeName(element.parentNode), content);
    }

    if (Feature('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT'))
      createContextualFragment = (function(__createContextualFragment) {
        return function(element, content) {
          try {
            // Konqueror throws when trying to create a fragment from
            // incompatible markup such as table rows. Similar to IE's issue
            // with setting table's innerHTML.

            // WebKit and KHTML throw when creating contextual fragments from orphaned elements
            var range = element.ownerDocument.createRange();
            range.selectNode(element);
            return range.createContextualFragment(content);
          } catch (e) {
            return __createContextualFragment(element, content);
          }
        };
      })(createContextualFragment);

    // fix Safari <= 2.0.2 inserting script elements
    if (Bug('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT_PROPERTY_ON_INSERT'))
      replaceElement = (function() {
        function getByTagName(node, tagName) {
          var results = [], child = node.firstChild;
          while (child) {
            if (getNodeName(child) === tagName)
              results.push(child);
            else if (child.getElementsByTagName) {
              // concatList implementation for nodeLists
              var i = 0, pad = results.length, nodes = child.getElementsByTagName(tagName);
              while (results[pad + i] = nodes[i++]) { }
              results.length--;
            }
            child = child.nextSibling;
          }
          return results;
        }

        function wrapper(proceed, element, node) {
          var i = 0, scripts = [];
          if (insertableNodeTypes[node.nodeType]) {
            if (getNodeName(node) === 'SCRIPT')
              scripts = [node];
            else if (node.getElementsByTagName)
              scripts = node.getElementsByTagName('SCRIPT');
            // Safari 2 fragments don't have GEBTN
            else scripts = getByTagName(node, 'SCRIPT');
          }
          proceed(element, node);
          while (scripts[i]) global.eval(String(scripts[i++].text));
        }

        // wrap insertion translations and replaceElement
        Fuse.Util.$w('before top bottom after').each(function(method) {
          this[method] = Func.wrap(this[method], wrapper);
        }, Element._insertionTranslations);

        return Func.wrap(replaceElement, wrapper);
      })();


    methods.insert = function insert(element, insertions) {
      element = $(element);
      var content, fragment, insertContent, position, nodeName;

      if (insertions) {
        if (insertions instanceof Fuse.Hash)
          insertions = insertions._object;

        if (isString(insertions) || isNumber(insertions) ||
            insertableNodeTypes[insertions.nodeType] || insertions.toElement || insertions.toHTML)
          insertions = { 'bottom': insertions };
      }

      for (position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insertContent = Element._insertionTranslations[position];

        if (content && content != '') {
          if (content.toElement) content = content.toElement();
          if (insertableNodeTypes[content.nodeType]) {
            insertContent(element, content);
            continue;
          }
          content = Obj.toHTML(content);
        }
        else continue;

        nodeName = getNodeName(position === 'before' || position === 'after'
          ? element.parentNode : element);

        fragment = Element._getFragmentFromString(
          element.ownerDocument, nodeName, content.stripScripts());

        insertContent(element, fragment);
        defer(function() { content.evalScripts() });
      }
      return element;
    };

    methods.replace = function replace(element, content) {
      element = $(element);
      if (!content || content == '')
        return element.parentNode.removeChild(element);
      if (content.toElement)
        content = content.toElement();
      else if (!insertableNodeTypes[content.nodeType]) {
        var html = Obj.toHTML(content);
        defer(function() { html.evalScripts() });
        content = createContextualFragment(element, html.stripScripts());
      }
      replaceElement(element, content);
      return element;
    };

    methods.update = function update(element, content) {
      element = $(element);
      if (getNodeName(element) === 'SCRIPT') {
        element.text = Fuse.String.interpret(content);
      } else {
        if (content && content != '') {
          if (content.toElement)
            content = content.toElement();
          if (insertableNodeTypes[content.nodeType]) {
            element.innerHTML = '';
            element.appendChild(content);
            return element;
          }
          content = Obj.toHTML(content);
          element.innerHTML = content.stripScripts();
          defer(function() { content.evalScripts() });
        } else element.innerHTML = '';
      }
      return element;
    };

    // fix browsers with buggy innerHTML implementations
    (function() {
      function update(element, content) {
        element = $(element);
        var nodeName = getNodeName(element), isBuggy = BUGGY[nodeName];
        if (nodeName === 'SCRIPT') {
          element.text = Fuse.String.interpret(content);
        } else {
          // remove children
          if (isBuggy) {
            while (element.lastChild)
              element.removeChild(element.lastChild);
          } else element.innerHTML = '';

          if (content && content != '') {
            if (content.toElement) content = content.toElement();
            if (insertableNodeTypes[content.nodeType]) element.appendChild(content);
            else {
              content = Obj.toHTML(content);
              if (isBuggy)
                element.appendChild(Element._getFragmentFromString(
                  element.ownerDocument, nodeName, content.stripScripts()));
              else element.innerHTML = content.stripScripts();
              defer(function() { content.evalScripts() });
            }
          }
        }
        return element;
      };

      var BUGGY = { };
      if (Bug('ELEMENT_COLGROUP_INNERHTML_BUGGY'))
        BUGGY.COLGROUP = 1;
      if (Bug('ELEMENT_OPTGROUP_INNERHTML_BUGGY'))
        BUGGY.OPTGROUP = 1;
      if (Bug('ELEMENT_SELECT_INNERHTML_BUGGY'))
        BUGGY.SELECT   = 1;
      if (Bug('ELEMENT_TABLE_INNERHTML_BUGGY'))
        BUGGY.TABLE = BUGGY.TBODY = BUGGY.TR = BUGGY.TD =
        BUGGY.TFOOT = BUGGY.TH    = BUGGY.THEAD = 1;

      if (!isEmpty(BUGGY))
        methods.update = update;
    })();

    // prevent JScript bug with named function expressions
    var insert = null, replace = null, update = null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth() and Element#getHeight()
  Fuse.Util.$w('Width Height')._each(function(D) {
    Element.Methods['get' + D] = (function() {
      var property = 'offset' + D;
      return function(element) {
        element = $(element);

        // offsetHidth/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        var result;
        if (!Element.isVisible(element)) {
          var s = element.style, backup = s.cssText;
          s.cssText += ';display:block;visibility:hidden;';
          result = element[property];
          s.cssText = backup;
        }
        else result = element[property];
        return Fuse.Number(result);
      };
    })();
  });

  /*--------------------------------------------------------------------------*/

  Fuse.addNS('Util');

  $ = Fuse.Util.$ = (function() {
    function $(element) {
      var args = arguments, length = args.length;
      if (length > 1) {
        var elements = Fuse.List();
        while (length--) elements[length] = $(args[length]);
        return elements;
      }
      if (isString(element)) element = doc.getElementById(element || expando);
      return extend(element);
    }

    var doc = Fuse._doc, extend = Element.extend;
    return $;
  })();
