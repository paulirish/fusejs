  /*-------------------------------- ELEMENT ---------------------------------*/

  $ = function(element) {
    if (arguments.length > 1) {
      for (var i = 0, elements = [], length = arguments.length; i < length; i++)
        elements.push($(arguments[i]));
      return elements;
    }
    if (typeof element === 'string')
      element = doc.getElementById(element || '');
    return Element.extend(element);
  };

  /*--------------------------------------------------------------------------*/

  (function() {
    var original = global.Element;

    function createElement(tagName, attributes) {
      tagName = tagName.toLowerCase();
      if (!Element.cache[tagName]) Element.cache[tagName] = Element.extend(doc.createElement(tagName));
      return Element.writeAttribute(Element.cache[tagName].cloneNode(false), attributes || { });
    }

    global.Element = createElement;
    if (Feature('CREATE_ELEMENT_WITH_HTML')) {
      global.Element = function(tagName, attributes) {
        if (attributes && (attributes.name || attributes.type)) {
          tagName = '<' + tagName +
           (attributes.name ? ' name="' + attributes.name + '"' : '') +
            (attributes.type ? ' type="' + attributes.type + '"' : '') + '>';
          delete attributes.name; delete attributes.type;
        }
        return createElement(tagName, attributes);
      };
    }

    if (original) {
      Object.extend(global.Element, original);
      global.Element.prototype = original.prototype;
    }
  })();

  Element.cache = { };
  Element.idCounter = 1;

  /*--------------------------------------------------------------------------*/

  Element.extend = (function() {
    var Methods, ByTag, revision = 0;

    function extend(element) {
      // Bail on elements that don't need extending, 
      // XML nodes (IE errors on them), document, window objects
      if (!element || (typeof element._extendedByPrototype !== 'undefined' && 
        element._extendedByPrototype() >= revision) ||
        element.nodeType !== 1 || element === global ||
        !('write' in element.ownerDocument)) return element;

      var pair,
       tagName = element.tagName.toUpperCase(), 
       methods = ByTag[tagName] || Methods,
       length  = methods.length;

      while (length--) {
        pair = methods[length];
        if (!(pair[0] in element))
          element[pair[0]] = pair[1];
      }

      // avoid using Prototype.K.curry(revision) for speed
      element._extendedByPrototype = (function(r) {
        return function() { return r };
      })(revision);

      return element;
    }

    function refresh() {
      Methods = []; ByTag = { };
      var name, tagName;

      for (name in Element.Methods)
        if (name !== 'Simulated' && name !== 'ByTag')
          Methods.push([name, Element.Methods[name].methodize()]);

      for (name in Element.Methods.Simulated)
        Methods.push([name, Element.Methods.Simulated[name].methodize()]);

      for (tagName in Element.Methods.ByTag) {
        ByTag[tagName] = slice.call(Methods, 0);
        for (name in Element.Methods.ByTag[tagName])
          ByTag[tagName].push([name, Element.Methods.ByTag[tagName][name].methodize()]);
      }
      revision++;
    }

    // Browsers with specific element extensions
  	// don't need their elements extended UNLESS
  	// they belong to a different document
	if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
	  return Object.extend(function(element) {
	    return (element && element.ownerDocument &&
	      element.ownerDocument !== doc) ? extend(element) : element;
	  }, { 'refresh': refresh });
	}

    extend.refresh = refresh;
    return extend;
  })();

  Element.addMethods = (function() {
    function extend(tagName, methods) {
      tagName = tagName.toUpperCase();
      if (!Element.Methods.ByTag[tagName])
        Element.Methods.ByTag[tagName] = { };
      Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
      onlyIfAbsent = onlyIfAbsent || false;
      for (var property in methods) {
        var value = methods[property];
        if (typeof value !== 'function') continue;
        if (!onlyIfAbsent || !(property in destination))
          destination[property] = value.methodize();
      }
    }

    function findDOMClass(tagName) {
      var klass;
      var trans = {
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
      };

      if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
      if (global[klass]) return global[klass];

      klass = 'HTML' + tagName + 'Element';
      if (global[klass]) return global[klass];

      klass = 'HTML' + tagName.capitalize() + 'Element';
      if (global[klass]) return global[klass];

      global[klass] = { };
      global[klass].prototype = doc.createElement(tagName).__proto__;
      return global[klass];
    }

    return function(methods) {
      var tagName, T = Element.Methods.ByTag;

      if (!methods) {
        Object.extend(Form, Form.Methods);
        Object.extend(Form.Element, Form.Element.Methods);
        Object.extend(Element.Methods.ByTag, {
          'BUTTON':   Object.clone(Form.Element.Methods),
          'FORM':     Object.clone(Form.Methods),
          'INPUT':    Object.clone(Form.Element.Methods),
          'SELECT':   Object.clone(Form.Element.Methods),
          'TEXTAREA': Object.clone(Form.Element.Methods)
        });
      }

      if (arguments.length == 2) {
        tagName = methods;
        methods = arguments[1];
      }

      if (!tagName)
        Object.extend(Element.Methods, methods || { });  
      else {
        Object.isArray(tagName)
          ? tagName._each(function(name) { extend(name, methods) })
          : extend(tagName, methods);
      }

      if (Feature('ELEMENT_EXTENSIONS')) {
        copy(Element.Methods, HTMLElement.prototype);
        copy(Element.Methods.Simulated, HTMLElement.prototype, true);
      }

      if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
        var klass, infiniteRevision = function() { return Infinity };
        for (var tag in Element.Methods.ByTag) {
          klass = findDOMClass(tag);
          if (typeof klass === 'undefined') continue;
          copy(T[tag], klass.prototype);
          klass.prototype._extendedByPrototype = infiniteRevision;
        }
        HTMLElement.prototype._extendedByPrototype = infiniteRevision;
      }

      Object.extend(Element, Element.Methods);
      delete Element.ByTag;

      Element.extend.refresh();
      Element.cache = { };
    };
  })();

  /*--------------------------------------------------------------------------*/

  Element.Methods = (function() {
    // removes whitespace-only text node children
    function cleanWhitespace(element) {
      element = $(element);
      var nextNode, node = element.firstChild;
      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType === 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return element;
    }

    function empty(element) {
      return $(element).innerHTML.blank();
    }

    function getDimensions(element) {
      return { 'width': Element.getWidth(element), 'height': Element.getHeight(element) };
    }
    
    function getOffsetParent(element) {
      element = $(element);

      // IE throws an error if the element is not in the document.
      if (Element.isFragment(element) || !element.offsetParent)
        return Element.extend(getOwnerDoc(element).body);

      while ((element = element.offsetParent) &&
       !/^(html|body)$/i.test(element.tagName)) {
        if (Element.getStyle(element, 'position') !== 'static')
          return Element.extend(element);
      }
      return Element.extend(getOwnerDoc(element).body);
    }

    function identify(element) {
      var id = Element.readAttribute(element, 'id');
      if (id) return id;

      var ownerDoc = element.ownerDocument;
      do { id = 'anonymous_element_' + Element.idCounter++ }
      while (ownerDoc.getElementById(id));
      Element.writeAttribute(element, 'id', id);
      return id;
    }

    function inspect(element) {
      element = $(element);
      var attribute, value, result = '<' + element.tagName.toLowerCase(),
       translation = { 'id':'id', 'className':'class' };

      for (var property in translation) {
        attribute = translation[property];
        value = (element[property] || '').toString();
        if (value) result += ' ' + attribute + '=' + value.inspect(true);
      }
      return result + '>';
    }

    function insert(element, insertions) {
      element = $(element);
      var content, fragment, insert, tagName;

      if (typeof insertions === 'string' || typeof insertions === 'number' ||
          Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML))) {
        insertions = { 'bottom':insertions };
      }

      for (var position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insert   = Element._insertionTranslations[position];

        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
          insert(element, content);
          continue;
        }

        content = Object.toHTML(content);
        if (!content) continue;

        tagName = ((position === 'before' || position === 'after')
          ? element.parentNode : element).tagName.toUpperCase();

        fragment = Element._getContentFromAnonymousElement(element.ownerDocument, tagName, content.stripScripts());
        insert(element, fragment);
        content.evalScripts.bind(content).defer();
      }
      return element;
    }

    function hide(element) {
      element = $(element);
      var originalDisplay = element.style.display;
      if (originalDisplay && originalDisplay !== 'none')
        element._originalDisplay = originalDisplay;
      element.style.display = 'none';
      return element;
    }

    function show(element) {
      element = $(element);
      if (element._originalDisplay) {
        element.style.display = element._originalDisplay;
        element._originalDisplay = null;
      } else element.style.display = '';
      return element;
    }

    function scrollTo(element) {
      var pos = Element.cumulativeOffset(element);
      global.scrollTo(pos[0], pos[1]);
      return $(element);
    }

    function remove(element) {
      element = $(element);
      element.parentNode &&
      element.parentNode.removeChild(element);
      return element;
    }

    function toggle(element) {
      return Element[Element.visible(element) ? 'hide' : 'show'](element);
    }

    function visible(element) {
      return $(element).style.display != 'none';
    }

    function wrap(element, wrapper, attributes) {
      element = $(element);
      if (Object.isElement(wrapper))
        $(wrapper).writeAttribute(attributes || { });
      else if (typeof wrapper === 'string')
        wrapper = new Element(wrapper, attributes);
      else wrapper = new Element('div', wrapper);
      if (element.parentNode)
        element.parentNode.replaceChild(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    }

    var isFragment = (function() {
      return Feature('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION') ?
        function (element) {
          element = $(element);
          var nodeType = element.nodeType;
          return nodeType === 11 || (nodeType === 1 &&
            element.ownerDocument.all[element.sourceIndex] !== element);
        } :
        function (element) {
          element = $(element);
          var nodeType = element.nodeType;
          return nodeType === 11 || (nodeType === 1 && !(element.parentNode &&
            Element.descendantOf(element, element.ownerDocument)));
        };
    })();

    var update = (function() {
      var setInnerHTML = Bug('ELEMENT_SELECT_INNERHTML_BUGGY') || Bug('ELEMENT_TABLE_INNERHTML_BUGGY') || Bug('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY') ?
        function(element, content) {
          var tagName = element.tagName.toUpperCase();
          if (tagName in Element._insertionTranslations.tags) {
            var children = element.childNodes, length = children.length;
            while (length--) element.removeChild(children[length]);
            element.appendChild(Element._getContentFromAnonymousElement(element.ownerDocument, tagName, content));
          } else element.innerHTML = content;
        } :
        function(element, content) {
          element.innerHTML = content;
        };

      return function(element, content) {
        element = $(element);
        if (content && content.toElement)
          content = content.toElement();
        if (Object.isElement(content)) {
          element.innerHTML = '';
          element.appendChild(content);
          return element;
        }
        content = Object.toHTML(content);
        setInnerHTML(element, content.stripScripts());
        content.evalScripts.bind(content).defer();
        return element;
      };
    })()

    var replace = (function() {
      var createFragment = Feature('DOCUMENT_RANGE') ?
        function(element, content) {
          var range = element.ownerDocument.createRange();
          range.selectNode(element);
          return range.createContextualFragment(content);
        } :
        function(element, content) {
          return Element._getContentFromAnonymousElement(element.ownerDocument, element.parentNode.tagName.toUpperCase(), content);
        };

      return function(element, content) {
        element = $(element);
        if (content && content.toElement)
          content = content.toElement();
        else if (!Object.isElement(content)) {
          content = Object.toHTML(content);
          content.evalScripts.bind(content).defer();
          content = createFragment(element, content.stripScripts());
        }
        return element.parentNode.replaceChild(content, element);
      };
    })();

    return {
      'ByTag':           { },
      'Simulated':       { },
      'cleanWhitespace': cleanWhitespace,
      'empty':           empty,
      'getDimensions':   getDimensions,
      'getOffsetParent': getOffsetParent,
      'hide':            hide,
      'identify':        identify,
      'inspect':         inspect,
      'insert':          insert,
      'isFragment':      isFragment,
      'remove':          remove,
      'replace':         replace,
      'scrollTo':        scrollTo,
      'show':            show,
      'toggle':          toggle,
      'update':          update,
      'visible':         visible,
      'wrap':            wrap
    };
  })();

  // define Element#getWidth() and Element#getHeight()
  $w('Width Height')._each(function(D) {
    Element.Methods['get' + D] = function(element) {
      element = $(element);
      var result = element['offset' + D],
       display = Element.getStyle(element, 'display');

      // width and height properties return 0 on elements with display:none,
      // so show the element temporarily
      if (display === 'none' || display === null || result === 0) {
        var backup = element.style.cssText;
        element.style.cssText += ';position:absolute;display:block;visibility:hidden;';
        result = element['offset' + D];
        element.style.cssText = backup;
      }
      return result;
    };
  });
