  /*-------------------------------- ELEMENT ---------------------------------*/

  Fuse.addNS('Util');

  $ = Fuse.Util.$ = (function() {
    function $(element) {
      if (arguments.length > 1) {
        for (var i = 0, elements = Fuse.List(), length = arguments.length; i < length; i++)
          elements.push($(arguments[i]));
        return elements;
      }
      if (Fuse.Object.isString(element))
        element = Fuse._doc.getElementById(element || expando);
      return Element.extend(element);
    }
    return $;
  })();

  /*--------------------------------------------------------------------------*/

  // Cache Element capabilities before overwriting the Element object
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
      Fuse.Object._extend(global.Element, original);
      global.Element.prototype = original.prototype;
    }

    cache = global.Element.cache = { };
    global.Element.idCounter = 1;
  })();

  /*--------------------------------------------------------------------------*/

  Element.extend = (function() {
    var Methods, ByTag, revision = 0;

    function _createRevisionGetter(r) {
      return function() { return r };
    }

    function _extendElement(element, nodeName) {
      nodeName = nodeName || getNodeName(element);
      var pair, methods = ByTag[nodeName] || Methods, length = methods.length;
      while (length--) {
        pair = methods[length];
        if (!Fuse.Object.hasKey(element, pair[0]))
          element[pair[0]] = pair[1];
      }

      // avoid using Fuse.K.curry(revision) for speed
      element._extendedByFuse = _createRevisionGetter(revision);
      return element;
    }

    function extend(element) {
      // Bail on elements that don't need extending,
      // XML nodes (IE errors on them), document, window objects
      if (!element || (typeof element._extendedByFuse !== 'undefined' &&
        element._extendedByFuse() >= revision) ||
        element.nodeType !== 1 || element == getWindow(element) ||
        !element.ownerDocument.body) return element;

      return _extendElement(element);
    }

    function refresh() {
      var tagName; Methods = []; ByTag = { };

      Fuse.Object._each(Element.Methods, function(value, key, object) {
        if (key !== 'Simulated' && key !== 'ByTag')
          Methods.push([key, Fuse.Function.methodize([key, object])]);
      });

      Fuse.Object._each(Element.Methods.Simulated, function(value, key, object) {
        Methods.push([key, Fuse.Function.methodize([key, object])]);
      });

      for (tagName in Element.Methods.ByTag) {
        ByTag[tagName] = slice.call(Methods, 0);
        Fuse.Object._each(Element.Methods.ByTag[tagName], function(value, key, object) {
          ByTag[tagName].push([key, Fuse.Function.methodize([key, object])]);
        });
      }
      revision++;
    }

    // Browsers with specific element extensions
    // don't need their elements extended UNLESS
    // they belong to a different document
    if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
      extend = (function(_extend) {
        function extend(element) {
          return (element && element.ownerDocument &&
            element.ownerDocument !== Fuse._doc) ? _extend(element) : element;
        }
        return extend;
      })(extend);
    }

    // In IE8 APPLET, EMBED, and OBJECT elements don't inherit from their prototypes
    if (Bug('ELEMENT_OBJECT_AND_RELATIVES_FAILS_TO_INHERIT_FROM_PROTOTYPE')) {
      extend = (function(_extend) {
        function extend(element) {
          var nodeName = element && getNodeName(element);
          if (BUGGY[nodeName]) {
            return (typeof element._extendedByFuse !== 'undefined' &&
              element._extendedByFuse() >= revision) ?
                element : _extendElement(element, nodeName);
          }
          return _extend(element);
        }
        var BUGGY = { 'APPLET': 1, 'EMBED': 1, 'OBJECT': 1 };
        return extend;
      })(extend);
    }

    extend.refresh = refresh;
    return extend;
  })();

  /*--------------------------------------------------------------------------*/

  Element.addMethods = (function() {
    // add HTMLElement for Safari 2
    if (Feature('OBJECT__PROTO__') && !Feature('HTML_ELEMENT_CLASS')) {
      Feature.set({ 'HTML_ELEMENT_CLASS': true, 'ELEMENT_EXTENSIONS': true });
      _emulateDOMClass('HTMLElement', 'DIV');
    }

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

    EMULATE_ELEMENT_CLASSES_WITH_PROTO =
      Feature('EMULATE_ELEMENT_CLASSES_WITH_PROTO'),

    // supports IE8 as well as EOMB
    elementPrototype = Feature('HTML_ELEMENT_CLASS') ?
      global.HTMLElement.prototype : Feature('ELEMENT_CLASS') ?
        global.Element.prototype : false;

    function _copy(methods, destination, onlyIfAbsent) {
      onlyIfAbsent = onlyIfAbsent || false;
      Fuse.Object._each(methods, function(value, key) {
        if (typeof value === 'function' && 
           (!onlyIfAbsent || !(key in destination)))
          destination[key] = Fuse.Function.methodize([key, methods]);
      });
    }

    function _emulateDOMClass(className, tagName) {
      (global[className] = { }).prototype =
        Fuse._doc.createElement(tagName)['__proto__'];
      return global[className];
    }

    function _extend(tagName, methods) {
      tagName = tagName.toUpperCase();
      if (!Element.Methods.ByTag[tagName])
        Element.Methods.ByTag[tagName] = { };
      Fuse.Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function _findDOMClass(tagName) {
      // catch most classes like HTMLUListElement and HTMLSelectElement
      var className = 'HTML' + (tagNameClassLookup[tagName] ||
        Fuse.String(tagName).capitalize()) + 'Element';
      if (global[className])
        return global[className];
      // catch element classes like HTMLLIElement
      className = 'HTML' + tagName + 'Element';
      if (global[className])
        return global[className];
      // emulate the class (not used by any browser)
      if (EMULATE_ELEMENT_CLASSES_WITH_PROTO)
        return _emulateDOMClass(className, tagName);
    }

    return function(methods) {
      var tagName, T = Element.Methods.ByTag;

      if (arguments.length < 2) {
        Fuse.Object.extend(Form, Form.Methods);
        Fuse.Object.extend(Form.Element, Form.Element.Methods);
        Fuse.Object.extend(Element.Methods.ByTag, {
          'BUTTON':   Fuse.Object.clone(Form.Element.Methods),
          'FORM':     Fuse.Object.clone(Form.Methods),
          'INPUT':    Fuse.Object.clone(Form.Element.Methods),
          'SELECT':   Fuse.Object.clone(Form.Element.Methods),
          'TEXTAREA': Fuse.Object.clone(Form.Element.Methods)
        });
      } else {
        tagName = methods;
        methods = arguments[1];
      }

      if (!tagName || tagName == '')
        Fuse.Object.extend(Element.Methods, methods);
      else {
        Fuse.List.isArray(tagName)
          ? tagName._each(function(name) { _extend(name, methods) })
          : _extend(tagName, methods);
      }

      if (Feature('ELEMENT_EXTENSIONS')) {
        _copy(Element.Methods, elementPrototype);
        _copy(Element.Methods.Simulated, elementPrototype, true);
      }

      if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
        var klass, infiniteRevision = function() { return Infinity };
        for (tagName in Element.Methods.ByTag) {
          klass = _findDOMClass(tagName);
          if (typeof klass === 'undefined') continue;
          _copy(T[tagName], klass.prototype);
        }
        elementPrototype._extendedByFuse = infiniteRevision;
      }

      Fuse.Object.extend(Element, Element.Methods);
      delete Element.ByTag;

      Element.extend.refresh();
      Element.cache = { };
    };
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

  (function() {
    // TODO: Opera fails to render optgroups when set with innerHTML
    Fuse.Object._extend(this.tags, {
      'OPTGROUP': this.tags.SELECT,
      'TFOOT':    this.tags.TBODY,
      'TH':       this.tags.TD,
      'THEAD':    this.tags.TBODY
    });

    this.before = function before(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element);
    };

    this.top = function top(element, node) {
      element.insertBefore(node, element.firstChild);
    };

    this.bottom = function bottom(element, node) {
      element.appendChild(node);
    };

    this.after = function after(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element.nextSibling);
    };

    // prevent JScript bug with named function expressions
    var after = null, before = null,  bottom = null, top = null;
  }).call(Element._insertionTranslations);

  /*--------------------------------------------------------------------------*/

  Element.Methods = {
    'ByTag':     { },
    'Simulated': { }
  };

  (function() {
    this.cleanWhitespace = function cleanWhitespace(element) {
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

    this.empty = function empty(element) {
      return Fuse.String($(element).innerHTML).blank();
    };

    this.getDimensions = function getDimensions(element) {
      return { 'width': Element.getWidth(element), 'height': Element.getHeight(element) };
    };

    this.getOffsetParent = (function() {
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

    this.identify = function identify(element) {
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

    this.inspect = function inspect(element) {
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
    };

    this.isFragment = (function() {
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

    this.hide = function hide(element) {
      element = $(element);
      var display = element.style.display;
      if (display && display !== 'none')
        element._originalDisplay = display;
      element.style.display = 'none';
      return element;
    };

    this.show = function show(element) {
      element = $(element);
      var display = element.style.display;
      if (display === 'none')
        element.style.display = element._originalDisplay || '';
      element._originalDisplay = null;
      return element;
    };

    this.scrollTo = function scrollTo(element) {
      var pos = Element.cumulativeOffset(element);
      global.scrollTo(pos[0], pos[1]);
      return $(element);
    };

    this.remove = function remove(element) {
      element = $(element);
      element.parentNode &&
      element.parentNode.removeChild(element);
      return element;
    };

    this.toggle = function toggle(element) {
      return Element[Element.isVisible(element) ?
        'hide' : 'show'](element);
    };

    this.isVisible = (function() {
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

    this.wrap = function wrap(element, wrapper, attributes) {
      element = $(element);
      if (Fuse.Object.isElement(wrapper))
        $(wrapper).writeAttribute(attributes);
      else if (Fuse.Object.isString(wrapper))
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
     inspect =            null,
     isFragment =         null,
     isVisible =          null,
     remove =             null,
     scrollTo =           null,
     show =               null,
     toggle =             null,
     wrap =               null;
  }).call(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _isInsertable(node) {
      return _isInsertable.nodeType[node.nodeType];
    }
    _isInsertable.nodeType = { '1': 1, '3': 1, '8': 1, '10': 1, '11': 1 };

    function _replaceElement(element, node) {
      element.parentNode.replaceChild(node, element);
    }

    this.insert = function insert(element, insertions) {
      element = $(element);
      var content, fragment, insertContent, position, nodeName;

      if (insertions) {
        if (insertions instanceof Fuse.Hash)
          insertions = insertions._object;

        if (Fuse.Object.isString(insertions) ||
            Fuse.Object.isNumber(insertions) || _isInsertable(insertions) ||
            insertions.toElement || insertions.toHTML)
          insertions = { 'bottom': insertions };
      }

      for (position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insertContent = Element._insertionTranslations[position];

        if (content && content != '') {
          if (content.toElement) content = content.toElement();
          if (_isInsertable(content)) {
            insertContent(element, content);
            continue;
          }
          content = Fuse.Object.toHTML(content);
        }
        else continue;

        nodeName = getNodeName(position === 'before' || position === 'after'
          ? element.parentNode : element);

        fragment = Element._getContentFromAnonymousElement(
          element.ownerDocument, nodeName, content.stripScripts());

        insertContent(element, fragment);
        Fuse.Function.defer(Fuse.Function.bind(content.evalScripts, content));
      }
      return element;
    };

    this.replace = (function() {
      var _createContextualFragment = function(element, content) {
        return Element._getContentFromAnonymousElement(element.ownerDocument,
          getNodeName(element.parentNode), content);
      };

      if (Feature('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT'))
        (function(fn) {
          _createContextualFragment = function(element, content) {
            try {
              // Konqueror throws when trying to create a fragment from
              // incompatible markup such as table rows. Similar to IE's issue
              // with setting table's innerHTML.

              // WebKit and KHTML throw when creating contextual fragments from orphaned elements
              var range = element.ownerDocument.createRange();
              range.selectNode(element);
              return range.createContextualFragment(content);
            } catch (e) {
              return fn(element, content);
            }
          };
        })(_createContextualFragment);

      function replace(element, content) {
        element = $(element);
        if (!content || content == '')
          return element.parentNode.removeChild(element);
        if (content.toElement)
          content = content.toElement();
        else if (!_isInsertable(content)) {
          content = Fuse.Object.toHTML(content);
          Fuse.Function.defer(Fuse.Function.bind(content.evalScripts, content));
          content = _createContextualFragment(element, content.stripScripts());
        }
        _replaceElement(element, content);
        return element;
      }

      return replace;
    })();

    this.update = function update(element, content) {
      element = $(element);
      if (getNodeName(element) === 'SCRIPT') {
        element.text = Fuse.String.interpret(content);
      } else {
        if (content && content != '') {
          if (content.toElement)
            content = content.toElement();
          if (_isInsertable(content)) {
            element.innerHTML = '';
            element.appendChild(content);
            return element;
          }
          content = Fuse.Object.toHTML(content);
          element.innerHTML = content.stripScripts();
          Fuse.Function.defer(Fuse.Function.bind(content.evalScripts, content));
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
            if (_isInsertable(content)) element.appendChild(content);
            else {
              content = Fuse.Object.toHTML(content);
              if (isBuggy)
                element.appendChild(Element._getContentFromAnonymousElement(
                  element.ownerDocument, nodeName, content.stripScripts()));
              else element.innerHTML = content.stripScripts();
              Fuse.Function.defer(Fuse.Function.bind(content.evalScripts, content));
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

      if (!Fuse.Object.isEmpty(BUGGY))
        this.update = update;
    }).call(this);

    // fix Safari <= 2.0.2 inserting script elements
    (function() {
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
        if (_isInsertable(node)) {
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

      if (Bug('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT_PROPERTY_ON_INSERT')) {
        _replaceElement = Fuse.Function.wrap(_replaceElement, wrapper);

        Fuse.Util.$w('before top bottom after').each(function(method) {
          this[method] = Fuse.Function.wrap(this[method], wrapper);
        }, Element._insertionTranslations);
      }
    })();

    // prevent JScript bug with named function expressions
    var insert = null, update = null;
  }).call(Element.Methods);

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
