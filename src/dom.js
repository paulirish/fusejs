  $ = function(element) {
    if (arguments.length > 1) {
      for (var i = 0, elements = [], length = arguments.length; i < length; i++)
        elements.push($(arguments[i]));
      return elements;
    }
    if (typeof element === 'string')
      element = doc.getElementById(element);
    return Element.extend(element);
  };

  if (Feature('XPATH')) {
    doc._getElementsByXPath = function(expression, parentElement) {
      parentElement = $(parentElement);
      var results = [], ownerDoc = getOwnerDoc(parentElement);
      var query = ownerDoc.evaluate(expression, parentElement || ownerDoc,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0, length = query.snapshotLength; i < length; i++)
        results.push(Element.extend(query.snapshotItem(i)));
      return results;
    };
  }

  /*--------------------------------------------------------------------------*/

  if (!global.Node) Node = { };

  if (!Node.ELEMENT_NODE) {
    // DOM level 2 ECMAScript Language Binding
    Object.extend(Node, {
      ELEMENT_NODE: 1,
      ATTRIBUTE_NODE: 2,
      TEXT_NODE: 3,
      CDATA_SECTION_NODE: 4,
      ENTITY_REFERENCE_NODE: 5,
      ENTITY_NODE: 6,
      PROCESSING_INSTRUCTION_NODE: 7,
      COMMENT_NODE: 8,
      DOCUMENT_NODE: 9,
      DOCUMENT_TYPE_NODE: 10,
      DOCUMENT_FRAGMENT_NODE: 11,
      NOTATION_NODE: 12
    });
  }

  (function() {
    var original = this.Element;

    function createElement(tagName, attributes) {
      tagName = tagName.toLowerCase();
      if (!Element.cache[tagName]) Element.cache[tagName] = Element.extend(doc.createElement(tagName));
      return Element.writeAttribute(Element.cache[tagName].cloneNode(false), attributes || { });
    }

    this.Element = createElement;
    if (Feature('CREATE_ELEMENT_WITH_HTML')) {
      this.Element = function(tagName, attributes) {
        if (attributes && (attributes.name || attributes.type)) {
          tagName = '<' + tagName +
           (attributes.name ? ' name="' + attributes.name + '"' : '') +
            (attributes.type ? ' type="' + attributes.type + '"' : '') + '>';
          delete attributes.name; delete attributes.type;
        }
        return createElement(tagName, attributes);
      };
    }

    Object.extend(this.Element, original || { });
    if (original) this.Element.prototype = original.prototype;
  })();

  Element.cache = { };

  Element.Methods = {
    visible: function(element) {
      return $(element).style.display != 'none';
    },

    toggle: function(element) {
      return Element[Element.visible(element) ? 'hide' : 'show'](element);
    },

    hide: function(element) {
      element = $(element);
      var originalDisplay = element.style.display;
      if (originalDisplay && originalDisplay !== 'none')
        element._originalDisplay = originalDisplay;
      element.style.display = 'none';
      return element;
    },

    show: function(element) {
      element = $(element);
      if (element._originalDisplay) {
        element.style.display = element._originalDisplay;
        element._originalDisplay = null;
      } else element.style.display = '';
      return element;
    },

    remove: function(element) {
      element = $(element);
      element.parentNode.removeChild(element);
      return element;
    },

    update: (function() {
      var setInnerHTML = Bug('ELEMENT_SELECT_INNERHTML_BUGGY') || Bug('ELEMENT_TABLE_INNERHTML_BUGGY') ?
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
    })(),

    replace: (function() {
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
    })(),

    insert: function(element, insertions) {
      element = $(element);

      if (typeof insertions === 'string' || typeof insertions === 'number' ||
          Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
            insertions = {bottom:insertions};

      var content, fragment, insert, tagName;

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
        tagName = ((position == 'before' || position == 'after')
          ? element.parentNode : element).tagName.toUpperCase();

        fragment = Element._getContentFromAnonymousElement(element.ownerDocument, tagName, content.stripScripts());
        insert(element, fragment);
        content.evalScripts.bind(content).defer();
      }
      return element;
    },

    wrap: function(element, wrapper, attributes) {
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
    },

    inspect: function(element) {
      element = $(element);
      var result = '<' + element.tagName.toLowerCase();

      $H({ 'id': 'id', 'className': 'class' })._each(function(pair) {
        var property = pair.first(), attribute = pair.last(),
         value = (element[property] || '').toString();
        if (value) result += ' ' + attribute + '=' + value.inspect(true);
      });
      return result + '>';
    },

    recursivelyCollect: function(element, property) {
      element = $(element);
      var elements = [];
      while (element = element[property])
        if (element.nodeType == 1)
          elements.push(Element.extend(element));
      return elements;
    },

    ancestors: function(element) {
      return Element.recursivelyCollect(element, 'parentNode');
    },

    descendants: function(element) {
      return Element.select(element, '*');
    },

    firstDescendant: function(element) {
      element = $(element).firstChild;
      while (element && element.nodeType != 1) element = element.nextSibling;
      return Element.extend(element);
    },

    immediateDescendants: function(element) {
      if (!(element = $(element).firstChild)) return [];
      while (element && element.nodeType != 1) element = element.nextSibling;
      if (element) return prependList(Element.nextSiblings(element), element);
      return [];
    },

    previousSiblings: function(element) {
      return Element.recursivelyCollect(element, 'previousSibling');
    },

    nextSiblings: function(element) {
      return Element.recursivelyCollect(element, 'nextSibling');
    },

    siblings: function(element) {
      return mergeList(Element.previousSiblings(element).reverse(), Element.nextSiblings(element));
    },

    match: function(element, selector) {
      if (typeof selector === 'string')
        selector = new Selector(selector);
      return selector.match($(element));
    },

    up: function(element, expression, index) {
      if (arguments.length == 1) return Element.extend($(element).parentNode);
      var ancestors = Element.ancestors(element);
      return typeof expression === 'number' ? ancestors[expression] :
        Selector.findElement(ancestors, expression, index);
    },

    down: function(element, expression, index) {
      if (arguments.length == 1) return Element.firstDescendant(element);
      return typeof expression === 'number' ? Element.descendants(element)[expression] :
        Element.select(element, expression)[index || 0];
    },

    previous: function(element, expression, index) {
      if (arguments.length == 1) return Element.extend(Selector.handlers.previousElementSibling(element));
      var previousSiblings = Element.previousSiblings(element);
      return typeof expression === 'number' ? previousSiblings[expression] :
        Selector.findElement(previousSiblings, expression, index);   
    },

    next: function(element, expression, index) {
      if (arguments.length == 1) return Element.extend(Selector.handlers.nextElementSibling(element));
      var nextSiblings = Element.nextSiblings(element);
      return typeof expression === 'number' ? nextSiblings[expression] :
        Selector.findElement(nextSiblings, expression, index);
    },

    select: function(element) {
      var args = slice.call(arguments, 1);
      return Selector.findChildElements($(element), args);
    },

    adjacent: function(element) {
      element = $(element);
      var args = slice.call(arguments, 1),
       parent = Element.extend(element.parentNode),
       oldId = parent.id, newId = parent.identify();

      // ensure match against siblings and not children of siblings
      args = args.map(function(a) { return '#' + newId + '>' + a });
      var matches = Selector.matchElements(parent.childNodes, args).without(element);
      parent.id = oldId;
      return matches;
    },

    identify: function(element) {
      var self = arguments.callee,
       id = Element.readAttribute(element, 'id');
      if (id) return id;

      var ownerDoc = element.ownerDocument;
      do { id = 'anonymous_element_' + self.counter++ }
      while (ownerDoc.getElementById(id));
      Element.writeAttribute(element, 'id', id);
      return id;
    },

    readAttribute: function(element, name) {
      element = $(element);
      var result;
      if (P.Browser.IE) {
        var t = Element._attributeTranslations.read;
        if (t.names[name]) name = t.names[name];
        // If we're reading from a form, avoid a conflict between an attribute
        // and a child name.
        var tagName = element.tagName.toUpperCase();
        if (tagName === 'FORM' &&
          !/^((child|parent)Node|(next|previous)Sibling)$/.test(name) &&
            element.children[name]){
          element = element.cloneNode(false); // don't extend here
        }
        if (tagName === 'IFRAME' && name === 'type')
          result = element.getAttribute(name, 1);
        else if (t.values[name])
          result = t.values[name](element, name);
        else if (name.include(':')) {
          result = (!element.attributes || !element.attributes[name]) ? '' : 
           element.attributes[name].value;
        }
      }
      if (typeof result === 'undefined')
        result = element.getAttribute(name);
      return result !== null ? result : '';
    },

    writeAttribute: function(element, name, value) {
      element = $(element);
      var attributes = { }, t = Element._attributeTranslations.write;

      if (typeof name == 'object') attributes = name;
      else attributes[name] = (typeof value === 'undefined') ? true : value;

      for (var attr in attributes) {
        name = t.names[attr] || attr;
        value = attributes[attr];
        if (t.values[name]) name = t.values[name](element, value);
        if (value === false || value === null)
          element.removeAttribute(name);
        else if (value === true)
          element.setAttribute(name, name);
        else element.setAttribute(name, value);
      }
      return element;
    },

    classNames: function(element) {
      return new Element.ClassNames(element);
    },

    hasClassName: function(element, className) {
      element = $(element);
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName == className || 
        new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },

    addClassName: function(element, className) {
      element = $(element);
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    },

    removeClassName: function(element, className) {
      element = $(element);
      element.className = element.className.replace(
        new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
      return element;
    },

    toggleClassName: function(element, className) {
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    },

    // removes whitespace-only text node children
    cleanWhitespace: function(element) {
      element = $(element);
      var node = element.firstChild;
      while (node) {
        var nextNode = node.nextSibling;
        if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return element;
    },

    empty: function(element) {
      return $(element).innerHTML.blank();
    },

    descendantOf: function(element, ancestor) {
      element = $(element), ancestor = $(ancestor);

      if (element.compareDocumentPosition)
        return (element.compareDocumentPosition(ancestor) & 8) === 8;

      if (ancestor.contains)
        return ancestor.contains(element) && ancestor !== element;

      while (element = element.parentNode)
        if (element == ancestor) return true;

      return false;
    },

    scrollTo: function(element) {
      element = $(element);
      var pos = Element.cumulativeOffset(element);
      global.scrollTo(pos[0], pos[1]);
      return element;
    },

    getStyle: (function() {
      var RELATIVE_CSS_UNITS = {
        'em' : true,
        'ex' : true
      };

      // setup the span for testing font-size
      var span = doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.innerHTML = 'M';

      var getComputedStyle = function(element, styleName) {
        styleName = getStyleName(styleName);
        var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
        if (css) return getResult(styleName, css[styleName]);
        return getStyle(element, styleName);
      };

      function getStyleName(styleName) {
        return styleName === 'float' ? 'cssFloat' : styleName.camelize();
      }

      function getResult(styleName, value) {
        if (styleName === 'opacity') return value ? parseFloat(value) : 1.0;
        return value === 'auto' ? null : value;
      }

      function getStyle(element, styleName) {
        return getResult(getStyleName(styleName), $(element).style[styleName]);
      }

      function getStyleIE(element, styleName) {
        element = $(element);
        styleName = styleName.camelize();
        var value = getComputedStyle(element, styleName);

        if (styleName === 'opacity') {
          if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
            if (value[1]) return parseFloat(value[1]) / 100;
          return 1.0;
        }
        if (value === 'auto') {
          if ((styleName === 'width' || styleName === 'height') && Element.visible(element))
            return element['offset' + styleName.capitalize()] + 'px';
          return null;
        }

        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(value)) {
          if (styleName === 'fontSize') {
            // We need to insert a span with the M character in it.  The offsetHeight
            // will give us the font size as this is the definition of the CSS font-size
            // attribute.
            // Inspired by Google Doctype:
            // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
            var unit = value.match(/\D+$/)[0];
            if (unit === '%') {
              var size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return Math.round(size) + 'px';
            } else if (unit in RELATIVE_CSS_UNITS)
              element = element.parentNode;
          }

          // backup values
          var pos = (styleName === 'height') ? 'top' : 'left',
           stylePos = element.style[pos], runtimePos = element.runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          element.runtimeStyle[pos] = element.currentStyle[pos];
          element.style[pos] = value;
          value = element.style['pixel' + pos.capitalize()] + 'px';

          // revert changes
          element.style[pos] = stylePos;
          element.runtimeStyle[pos] = runtimePos;
        }
        return value;
      }

      function getStyleOpera(element, styleName) {
        element = $(element);
        switch (styleName) {
          case 'left': case 'top': case 'right': case 'bottom':
            if (getComputedStyle(element, 'position') === 'static') return null;

          case 'height': case 'width':
            // returns '0px' for hidden elements; we want it to return null
            if (!Element.visible(element)) return null;

            // returns the border-box dimensions rather than the content-box
            // dimensions, so we subtract padding and borders from the value
            var D = styleName.capitalize(),
             dim = parseFloat(getComputedStyle(element, styleName)) || 0;
            if (dim !== element['offset' + D]) return dim + 'px';
            return Element['_getCss' + D](element) + 'px';

          default: return getComputedStyle(element, styleName);
        }
      }

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // Opera
        if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN'))
          return getStyleOpera;
        // Firefox, Safari, etc...
        return function(element, styleName) {
          return getComputedStyle($(element), styleName);
        };
      }
      else if (Feature('ELEMENT_CURRENT_STYLE')) {
        // IE
        getComputedStyle = function(element, styleName) {
          styleName = (styleName === 'float' || styleName === 'cssFloat') ? 'styleFloat' : styleName;
          var currentStyle = element.currentStyle;
          return element[element.currentStyle ? 'currentStyle' : 'style'][styleName];
        };
        return getStyleIE;
      }

      return getStyle;
    })(),

    getOpacity: function(element) {
      return Element.getStyle(element, 'opacity');
    },

    setStyle: function(element, styles) {
      element = $(element);
      var elementStyle = element.style, match;
      if (typeof styles === 'string') {
        element.style.cssText += ';' + styles;
        return styles.include('opacity') ?
          Element.setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
      }
      for (var property in styles)
        if (property == 'opacity') Element.setOpacity(element, styles[property]);
        else 
          elementStyle[(property == 'float' || property == 'cssFloat') ?
            (typeof elementStyle.styleFloat === 'undefined' ? 'cssFloat' : 'styleFloat') : 
              property] = styles[property];

      return element;
    },

    setOpacity: (function() {

      function stripAlpha(filter){
        return filter.replace(/alpha\([^\)]*\)/gi,'');
      }

      function setOpacity(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : 
        (value < 0.00001) ? 0 : value;
        return element;
      }

      if (P.Browser.WebKit &&
         (userAgent.match(/AppleWebKit\/(\d)/) || [])[1] < 5) {
        return function(element, value) {
          element = setOpacity(element, value);
          if (value == 1)
            if (element.tagName.toUpperCase() == 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              var n = element.ownerDocument.createTextNode(' ');
              element.removeChild(element.appendChild(n));
            } catch (e) { }

          return element;
        };
      }
      else if (P.Browser.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        return function(element, value) {
          element = $(element);
          element.style.opacity = (value == 1) ? 0.999999 : 
            (value === '') ? '' : (value < 0.00001) ? 0 : value;
          return element;
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        return function(element, value) {
          element = $(element);
          if (!Element._hasLayout(element))
            element.style.zoom = 1;

          var filter = element.getStyle('filter'), style = element.style;
          if (value == 1 || value === '') {
            (filter = stripAlpha(filter)) ?
              style.filter = filter : style.removeAttribute('filter');
            return element;
          } else if (value < 0.00001) value = 0;

          style.filter = stripAlpha(filter) + 'alpha(opacity=' + (value * 100) + ')';
          return element;   
        };
      }

      return setOpacity;
    })(),

    getDimensions: function(element) {
      return { width: Element.getWidth(element), height: Element.getHeight(element) };
    },

    makePositioned: function(element) {
      element = $(element);
      var pos = Element.getStyle(element, 'position');
      if (pos == 'static' || !pos) {
        element._madePositioned = true;
        element.style.position = 'relative';
        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        if (P.Browser.Opera) {
          element.style.top = 0;
          element.style.left = 0;
        }  
      }
      return element;
    },

    undoPositioned: function(element) {
      element = $(element);
      if (element._madePositioned) {
        element._madePositioned = undefined;
        element.style.position =
          element.style.top =
          element.style.left =
          element.style.bottom =
          element.style.right = '';   
      }
      return element;
    },

    makeClipping: function(element) {
      element = $(element);
      if (element._overflow) return element;
      element._overflow = Element.getStyle(element, 'overflow') || 'auto';
      if (element._overflow !== 'hidden')
        element.style.overflow = 'hidden';
      return element;
    },

    undoClipping: function(element) {
      element = $(element);
      if (!element._overflow) return element;
      element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
      element._overflow = null;
      return element;
    },

    cumulativeOffset: function(element) {
      // TODO: overhaul with a thorough solution for finding the correct
      // offsetLeft and offsetTop values
      element = Element._ensureLayout(element);
      var offsetParent, position, valueT = 0, valueL = 0,
       BODY_OFFSETS_INHERIT_ITS_MARGINS = Bug('BODY_OFFSETS_INHERIT_ITS_MARGINS');
      
      do {
        offsetParent = Element._getRealOffsetParent(element);
        position     = Element.getStyle(element, 'position');

        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;

        // Safari returns margins on body which is incorrect
        // if the child is absolutely positioned.
        if (position === 'fixed' || (BODY_OFFSETS_INHERIT_ITS_MARGINS &&
		    position === 'absolute' && offsetParent &&
		    offsetParent.tagName.toUpperCase() === 'BODY')) {
		  break;
		}
      } while (element = offsetParent);
      return Element._returnOffset(valueL, valueT);
    },

    positionedOffset: function(element) {
      element = Element._ensureLayout(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = Element._getRealOffsetParent(element);
      } while (element && element.tagName.toUpperCase() !== 'BODY' &&
        Element.getStyle(element, 'position') === 'static');

      return Element._returnOffset(valueL, valueT);
    },

    absolutize: function(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'absolute')
        return element;
      // Position.prepare(); // To be done manually by Scripty when it needs it.

      var s = element.style,
       cssWidth = Element._getCssWidth(element),
       cssHeight = Element._getCssHeight(element),
       offsets = Element.positionedOffset(element),
       before = Element.getDimensions(element);

      element._originalLeft       = s.left;
      element._originalTop        = s.top;
      element._originalWidth      = s.width;
      element._originalHeight     = s.height;   
      element._originalMarginTop  = s.marginTop;
      element._originalMarginLeft = s.marginLeft;

      s.position   = 'absolute';
      s.marginTop  = '0px';
      s.marginLeft = '0px';
      s.top        = offsets.top  + 'px';
      s.left       = offsets.left + 'px';
      s.width      = cssWidth  + 'px';
      s.height     = cssHeight + 'px';

      var after = Element.getDimensions(element);
      s.width   = Math.max(0, cssWidth  + (before.width  - after.width))  + 'px';
      s.height  = Math.max(0, cssHeight + (before.height - after.height)) + 'px';

      return element;
    },

    relativize: function(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'relative')
        return element;
      // Position.prepare(); // To be done manually by Scripty when it needs it.

      if (typeof element._originalTop === 'undefined')
        throw new Error("Element#absolutize must be called first.");

      var s = element.style;
      s.position   = 'relative';
      s.marginLeft = element._originalMarginLeft;
      s.marginTop  = element._originalMarginTop;
      s.top        = element._originalTop;
      s.left       = element._originalLeft;
      s.width      = element._originalHeight;
      s.height     = element._originalWidth;

      element.removeAttribute('_originalTop');
      if (typeof element._originalTop !== 'undefined')
        delete element._originalTop;
      return element;
    },

    cumulativeScrollOffset: function(element) {
      element = $(element);
      var valueT = 0, valueL = 0;
      do {
        // Skip body if documentElement has
        // scroll values as well (i.e. Opera 9.2x)
        if (element.tagName.toUpperCase() === 'BODY' &&
          ((element.scrollTop && element.parentNode.scrollTop) ||
          (element.scrollLeft && element.parentNode.scrollLeft))) continue;

        valueT += element.scrollTop  || 0;
        valueL += element.scrollLeft || 0;
      } while (Element.getStyle(element, 'position') !== 'fixed' &&
       (element = element.parentNode) && element.nodeType === 1);

      return Element._returnOffset(valueL, valueT);
    },

    getOffsetParent: function(element) {
      element = $(element);

      // IE throws an error if the element is not in the document.
      if (element.currentStyle === null || !element.offsetParent)
        return Element.extend(getOwnerDoc(element).body);

      while ((element = element.offsetParent) &&
       !/^(html|body)$/i.test(element.tagName)) {
        if (Element.getStyle(element, 'position') !== 'static')
          return Element.extend(element);
      }
      return Element.extend(getOwnerDoc(element).body);
    },

    viewportOffset: (function(forElement) {
      if (Feature('ELEMENT_BOUNDING_CLIENT_RECT')) {
        var backup = docEl.style.cssText;
        docEl.style.cssText += ';margin:0';

        // IE window's upper-left is at 2,2 (pixels) with respect
        // to the true client, so its pad.left and pad.top will be 2.
        var rect = docEl.getBoundingClientRect(), pad = { left: 0, top: 0 };
        if (Feature('ELEMENT_CLIENT_COORDS'))
          pad = { left: docEl.clientLeft, top: docEl.clientTop };
        docEl.style.cssText = backup;

        return function(forElement) {
          forElement = $(forElement);
          var d, valueT = 0, valueL = 0;
          if (forElement.currentStyle !== null) {
            d = forElement.getBoundingClientRect();
            valueT = Math.round(d.top)  - pad.top;
            valueL = Math.round(d.left) - pad.left;
          }
          return Element._returnOffset(valueL, valueT);
        };
      }

      return function(element) {
        element = $(element);
        var scrollOffset = Element.cumulativeScrollOffset(element),
         cumulativeOffset = Element.cumulativeOffset(element),
         valueT = cumulativeOffset.top, valueL = cumulativeOffset.left;

        // Subtract the scrollOffets of forElement from the scrollOffset totals
        // (cumulativeScrollOffset includes them).
        // Then subtract the the scrollOffset totals from the element offset totals.
        valueT -= scrollOffset.top  - (element.scrollTop  || 0);
        valueL -= scrollOffset.left - (element.scrollLeft || 0);
        return Element._returnOffset(valueL, valueT);
      };
    })(),

    clonePosition: function(element, source) {
      element = $(element);
      source = $(source);
      var s = element.style,
       options = Object.extend({
        setLeft:    true,
        setTop:     true,
        setWidth:   true,
        setHeight:  true,
        offsetTop:  0,
        offsetLeft: 0
      }, arguments[2] || { });

      if (options.setHeight)
        s.height = Element._getCssHeight(element) + 'px';
      if (options.setWidth)
        s.width = Element._getCssWidth(element) + 'px';

      // bail if skipping setLeft and setTop
      if (!options.setLeft && !options.setTop)
        return element;

      // clear margins
      if (options.setLeft) s.marginLeft = '0px';
      if (options.setTop)  s.marginTop  = '0px';

      // find page position of source
      var p = Element.cumulativeOffset(source),
       delta = [0, 0],
       position = Element.getStyle(element, 'position');

      if (position === 'relative') {
        // clear element coords before getting
        // the cumulativeOffset because Opera
        // will fumble the calculations if
        // you try to subtract the coords after
        if (options.setLeft) s.left = '0px';
        if (options.setTop)  s.top  = '0px';
        // store element offsets so we can subtract them later
        delta = Element.cumulativeOffset(element);
      }

      // set position
      if (options.setLeft) s.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop)  s.top  = (p[1] - delta[1] + options.offsetTop)  + 'px';
      return element;
    }
  };

  Element.Methods.identify.counter = 1;

  Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,
    childElements: Element.Methods.immediateDescendants
  });

  // Define Element#getWidth and Element#getHeight
  $w('Width Height')._each(function(D) {
    Element.Methods['get' + D] = function(element) {
      element = $(element);
      var result = element['offset' + D],
       display = Element.getStyle(element, 'display');

      // All width and height properties return 0 on elements with display:none,
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

  Element._attributeTranslations = {
    write: {
      names: {
        className: 'class',
        htmlFor:   'for'      
      }, 
      values: { }
    }
  };

  if (P.Browser.Opera) { 
    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
      function(proceed, element, attribute) {
        if (attribute === 'title') return $(element).title;
        return proceed(element, attribute);
      }
    );  
  }

  else if (P.Browser.IE) {
    Element._attributeTranslations = {
      read: {
        names: {
          'class': 'className',
          'for':   'htmlFor'
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: function(element, attribute) {
            attribute = element.getAttribute(attribute);
            if (typeof attribute !== 'function') return "";
            var source = attribute.toString();
            return source.indexOf('function anonymous()\n{\n') === 0 ? source.slice(23, -2) : "";
          },
          _flag: function(element, attribute) {
            return Element.hasAttribute(element, attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    };

    Element._attributeTranslations.write = {
      names: Object.extend({
        cellpadding: 'cellPadding',
        cellspacing: 'cellSpacing'
      }, Element._attributeTranslations.read.names),
      values: {
        _setAttrNode: function(name) {
          return function(element, value) {
            var attr = element.getAttributeNode(name);
            if (!attr) {
              attr = element.ownerDocument.createAttribute(name);
              element.setAttributeNode(attr);
            }
            attr.value = value;
          };
        },

        checked: function(element, value) {
          element.checked = !!value;
        },

        style: function(element, value) {
          element.style.cssText = value ? value : '';
        }
      }
    };

    Element._attributeTranslations.has = {};

    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
        'encType maxLength readOnly longDesc frameBorder')._each(function(attr) {
      Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
      Element._attributeTranslations.has[attr.toLowerCase()] = attr;
    });

    (function(v) {
      Object.extend(v, {
        href:        v._getAttr,
        src:         v._getAttr,
        type:        v._getAttr,
        action:      v._getAttrNode,
        encType:     v._getAttrNode,
        value:       v._getAttrNode,
        disabled:    v._flag,
        checked:     v._flag,
        readonly:    v._flag,
        multiple:    v._flag,
        onload:      v._getEv,
        onunload:    v._getEv,
        onclick:     v._getEv,
        ondblclick:  v._getEv,
        onmousedown: v._getEv,
        onmouseup:   v._getEv,
        onmouseover: v._getEv,
        onmousemove: v._getEv,
        onmouseout:  v._getEv,
        onfocus:     v._getEv,
        onblur:      v._getEv,
        onkeypress:  v._getEv,
        onkeydown:   v._getEv,
        onkeyup:     v._getEv,
        onsubmit:    v._getEv,
        onreset:     v._getEv,
        onselect:    v._getEv,
        onchange:    v._getEv
      });
    })(Element._attributeTranslations.read.values);

    (function(v) {
      Object.extend(v, {
        encType: v._setAttrNode('encType'),
        value:   v._setAttrNode('value')
      });
    })(Element._attributeTranslations.write.values);
  }

  Element._returnOffset = function(l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
  };

  Element._getRealOffsetParent = function(element) {
    return (element.currentStyle === null || !element.offsetParent) ? false :
     (element.offsetParent && element.offsetParent.tagName.toUpperCase() === 'HTML') ?
       element.offsetParent : Element.getOffsetParent(element);
  };

  Element._hasLayout = function(element) {
    var currentStyle = element.currentStyle;
    return (currentStyle && currentStyle.hasLayout) ||
     (!currentStyle && element.style.zoom && element.style.zoom != 'normal')
  };

  Element._ensureLayout = function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'static' &&
      !Element._hasLayout(element)) element.style.zoom = 1;
    return element;
  };

  Element._getCssDimensions = function(element) {
    return { width: this._getCssWidth(element), height: this._getCssHeight(element) };
  };

  // Define Element._getCssWidth() and Element._getCssHeight()
  (function() {
    var Subtract = {
      Width:  $w('borderLeftWidth paddingLeft borderRightWidth paddingRight'),
      Height: $w('borderTopWidth paddingTop borderBottomWidth paddingBottom')
    };
    $w('Width Height')._each(function(D) {
      Element['_getCss' + D] = function(element) {
        return Math.max(0, Subtract[D].inject(Element['get' + D](element), function(value, styleName) {
          return value -= parseFloat(Element.getStyle(element, styleName)) || 0;
        }));
      };
    });
  })();

  Element._getContentFromAnonymousElement = (function() {
    function getCache(ownerDoc) {
      if (ownerDoc === doc)
        return getCache.cache[0];
      var id = ownerDoc.frameID;
      if (!id) {
        id = getCache.id++;
        ownerDoc.frameID = id;
        getCache.cache[id] = {
          node: ownerDoc.createElement('div'),
          fragment: ownerDoc.createDocumentFragment()
        };
      }
      return getCache.cache[id];
    }
    getCache.id = 1;
    getCache.cache = { };
    getCache.cache[0] = { node: dummy, fragment: doc.createDocumentFragment() };

    var getContentAsFragment = (function() {
      if (Feature('ELEMENT_REMOVE_NODE')) {
        return function(cache, container) {
          // removeNode: removes the parent but keeps the children
          cache.fragment.appendChild(container).removeNode();
          return cache.fragment;
        };
      }
      if (Feature('DOCUMENT_RANGE')) {
        return function(cache, container) {
          cache.range = cache.range || cache.node.ownerDocument.createRange();
          cache.range.selectNodeContents(container);
          cache.fragment.appendChild(cache.range.extractContents());
          return cache.fragment;
        };
      }
      return function(cache, container) {
        var length = container.childNodes.length;
        while (length--)
          cache.fragment.insertBefore(container.childNodes[length], cache.fragment.firstChild);
        return cache.fragment;
      };
    })();

    return function(ownerDoc, tagName, html) {
      var cache = getCache(ownerDoc), node = cache.node,
       t = Element._insertionTranslations.tags[tagName];
      if (t) {
        node.innerHTML= t[0] + html + t[1];
        t[2].times(function() { node = node.firstChild });
      } else node.innerHTML = html;

      return getContentAsFragment(cache, node);
    }
  })();

  Element._insertionTranslations = {
    before: function(element, node) {
      element.parentNode.insertBefore(node, element);
    },
    top: function(element, node) {
      element.insertBefore(node, element.firstChild);
    },
    bottom: function(element, node) {
      element.appendChild(node);
    },
    after: function(element, node) {
      element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
      TABLE:  ['<table>',                '</table>',                   1],
      TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
      TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
      TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
      SELECT: ['<select>',               '</select>',                  1]
    }
  };

  (function() {
    Object.extend(this.tags, {
      THEAD: this.tags.TBODY,
      TFOOT: this.tags.TBODY,
      TH:    this.tags.TD
    });
  }).call(Element._insertionTranslations);

  Element.Methods.Simulated = {
    // No use of $ in this function in order to keep things fast.
    // Used by the Selector class.  
    hasAttribute: function(element, attribute) {
      attribute = Element._attributeTranslations.has[attribute] || attribute;
      var node = element.getAttributeNode(attribute);
      return !!(node && node.specified);
    }
  };

  Element.Methods.ByTag = { };
  Object.extend(Element, Element.Methods);

  Element.extend = (function() {
    var Methods, ByTag, revision = 0;

    function extend(element) {
      // Bail on elements that don't need extending, 
      // XML nodes (IE errors on them), document, window objects
      if (!element || (typeof element._extendedByPrototype !== 'undefined' && 
        element._extendedByPrototype() >= revision) ||
        element.nodeType !== 1 || element === global ||
        !('write' in element.ownerDocument)) return element;

      var property,
       tagName = element.tagName.toUpperCase(), 
       methods = ByTag[tagName] || Methods;

      for (property in methods)
        if (!(property in element))
          element[property] = methods[property].methodize();

      // avoid using Prototype.K.curry(revision) for speed
      element._extendedByPrototype = (function(r) {
        return function() { return r };
      })(revision);

      return element;
    }

    function refresh() {
      Methods = Object.clone(Element.Methods); ByTag = { };
      delete Methods.Simulated; delete Methods.ByTag;

      Object.extend(Methods, Element.Methods.Simulated);
      for(var i in Element.Methods.ByTag)
        ByTag[i] = Object.extend(Object.clone(Methods),
          Element.Methods.ByTag[i]);
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

  // No use of $ in this function in order to keep things fast.
  // Used by the Selector class.
  Element.hasAttribute = function(element, attribute) {
    if (element.hasAttribute) return element.hasAttribute(attribute);
    return Element.Methods.Simulated.hasAttribute(element, attribute);
  };

  Element.addMethods = function(methods) {
    var T = Element.Methods.ByTag;

    if (!methods) {
      Object.extend(Form, Form.Methods);
      Object.extend(Form.Element, Form.Element.Methods);
      Object.extend(Element.Methods.ByTag, {
        "BUTTON":   Object.clone(Form.Element.Methods),
        "FORM":     Object.clone(Form.Methods),
        "INPUT":    Object.clone(Form.Element.Methods),
        "SELECT":   Object.clone(Form.Element.Methods),
        "TEXTAREA": Object.clone(Form.Element.Methods)
      });
    }

    if (arguments.length == 2) {
      var tagName = methods;
      methods = arguments[1];
    }

    if (!tagName)
      Object.extend(Element.Methods, methods || { });  
    else {
      Object.isArray(tagName) ?
        tagName._each(extend) : extend(tagName);
    }

    function extend(tagName) {
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
        "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph", 
        "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
        "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
        "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote", 
        "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION": 
        "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD": 
        "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
        "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET": 
        "FrameSet", "IFRAME": "IFrame"
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

    if (Feature('ELEMENT_EXTENSIONS')) {
      copy(Element.Methods, HTMLElement.prototype);
      copy(Element.Methods.Simulated, HTMLElement.prototype, true);
    }

    if (Feature('ELEMENT_SPECIFIC_EXTENSIONS')) {
      var infiniteRevision = function() { return Infinity };
      for (var tag in Element.Methods.ByTag) {
        var klass = findDOMClass(tag);
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

  doc.viewport = {
    getDimensions: function() {
      return { width: this.getWidth(), height: this.getHeight() };
    },

    getScrollOffsets: function() {
      return Element._returnOffset(
        global.pageXOffset || docEl.scrollLeft || body.scrollLeft,
        global.pageYOffset || docEl.scrollTop  || body.scrollTop);
    }
  };

  // Define document.viewport.getWidth() and document.viewport.getHeight()
  (function(v) {
    var element;
    function define(D) {
      element = element || (Bug('BODY_ACTING_AS_ROOT') ? body : // Opera < 9.5, Quirks mode
        ('clientWidth' in doc) ? doc : docEl); // Safari < 3 : Others
      v['get' + D] = function() { return element['client' + D] };
      return v['get' + D]();
    }
    v.getHeight = define.curry('Height');
    v.getWidth  = define.curry('Width');
  })(doc.viewport);
