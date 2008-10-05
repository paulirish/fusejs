function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!window.Node) var Node = { };

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
  var original = this.Element, canCreateWithHTML = true;
  try { document.createElement('<div>') } catch(e) {
    canCreateWithHTML = false;
  }
  
  function createElement(tagName, attributes) {
    tagName = tagName.toLowerCase();
    if (!Element.cache[tagName]) Element.cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(Element.cache[tagName].cloneNode(false), attributes || { });
  }
  
  this.Element = createElement;
  if (canCreateWithHTML) {
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
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    (element = $(element)).style.display = 'none';
    return element;
  },
  
  show: function(element) {
    (element = $(element)).style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function() {
    var setInnerHTML = function(element, content) {
      element.innerHTML = content;
    };
    
    try {
      var tests = {
        table:  '<tbody><tr><td>test</td></tr></tbody>',
        select: '<option>test<option>'
      };
      for (var tagName in tests) {
        var el = document.createElement(tagName);
        if ((el.innerHTML = tests[tagName]) &&
          el.innerHTML.toLowerCase() !== tests[tagName]) throw 'error';
      }
    } catch(e) {
      setInnerHTML = function(element, content) {
        var tagName = element.tagName.toUpperCase();
        if (tagName in Element._insertionTranslations.tags) {
          var children = element.childNodes, length = children.length;
          while (length--) element.removeChild(children[length]);
          element.appendChild(Element._getContentFromAnonymousElement(tagName, content));
        } else element.innerHTML = content;
      };
    }
    return function(element, content) {
      element = $(element);
      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) return element.update().insert(content);
      content = Object.toHTML(content);
      setInnerHTML(element, content.stripScripts());
      content.evalScripts.bind(content).defer();
      return element;
    };
  })(),
  
  replace: (function() {
    var createFragment = ('createRange' in document) ?
      function(element, content) {
        var range = element.ownerDocument.createRange();
        range.selectNode(element);
        return range.createContextualFragment(content);
      } :
      function(element, content) {
        return Element._getContentFromAnonymousElement(element.parentNode.tagName.toUpperCase(), content);
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
    
    if (Object.isString(insertions) || Object.isNumber(insertions) ||
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
      
      fragment = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      insert(element, fragment);
      content.evalScripts.bind(content).defer();
    }
    
    return element;
  },
  
  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(), attribute = pair.last();
      var value = (element[property] || '').toString();
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
    return $(element).recursivelyCollect('parentNode');
  },
  
  descendants: function(element) {
    return $(element).select("*");
  },
  
  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },
  
  immediateDescendants: function(element) {
    if (!(element = $(element).firstChild)) return [];
    while (element && element.nodeType != 1) element = element.nextSibling;
    if (element) return [element].concat($(element).nextSiblings());
    return [];
  },

  previousSiblings: function(element) {
    return $(element).recursivelyCollect('previousSibling');
  },
  
  nextSiblings: function(element) {
    return $(element).recursivelyCollect('nextSibling');
  },
  
  siblings: function(element) {
    element = $(element);
    return element.previousSiblings().reverse().concat(element.nextSiblings());
  },
  
  match: function(element, selector) {
    if (Object.isString(selector))
      selector = new Selector(selector);
    return selector.match($(element));
  },
  
  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = element.ancestors();
    return Object.isNumber(expression) ? ancestors[expression] :
      Selector.findElement(ancestors, expression, index);
  },
  
  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return element.firstDescendant();
    return Object.isNumber(expression) ? element.descendants()[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.previousElementSibling(element));
    var previousSiblings = element.previousSiblings();
    return Object.isNumber(expression) ? previousSiblings[expression] :
      Selector.findElement(previousSiblings, expression, index);   
  },
  
  next: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(Selector.handlers.nextElementSibling(element));
    var nextSiblings = element.nextSiblings();
    return Object.isNumber(expression) ? nextSiblings[expression] :
      Selector.findElement(nextSiblings, expression, index);
  },
  
  select: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element, args);
  },
  
  adjacent: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element.parentNode, args).without(element);
  },
  
  identify: function(element) {
    element = $(element);
    var id = element.readAttribute('id'), self = arguments.callee;
    if (id) return id;
    do { id = 'anonymous_element_' + self.counter++ } while ($(id));
    element.writeAttribute('id', id);
    return id;
  },
  
  readAttribute: function(element, name) {
    element = $(element);
    var result;
    if (Prototype.Browser.IE) {
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
    if (Object.isUndefined(result))
      result = element.getAttribute(name);
    return result !== null ? result : '';
  },
  
  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;
    
    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;
    
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
  
  getHeight: function(element) {
    return $(element).getDimensions().height; 
  },
  
  getWidth: function(element) {
    return $(element).getDimensions().width; 
  },
  
  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className || 
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!element.hasClassName(className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },
  
  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return element[element.hasClassName(className) ?
      'removeClassName' : 'addClassName'](className);
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
    var pos = element.cumulativeOffset();
    window.scrollTo(pos[0], pos[1]);
    return element;
  },
  
  getStyle: (function() {
    var RELATIVE_CSS_UNITS = {
      'em' : true,
      'ex' : true
    };
    
    var span = document.createElement('span'),
     hasComputedStyle = !!(document.defaultView && document.defaultView.getComputedStyle);
    
    // setup the span for testing font-size
    span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
    span.innerHTML = 'M';
    
    var getComputedStyle = function(element, styleName) {
      styleName = getStyleName(styleName);
      var css = document.defaultView.getComputedStyle(element, null);
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
          var dim = parseFloat(getComputedStyle(element, styleName)) || 0;
          if (dim !== element['offset' + styleName.capitalize()])
            return dim + 'px';
          
          var subtract = {
            width:  ['borderLeftWidth', 'paddingLeft', 'borderRightWidth',  'paddingRight'],
            height: ['borderTopWidth',  'paddingTop',  'borderBottomWidth', 'paddingBottom']
          };
          return Math.max(0, subtract[styleName]
           .inject(dim, function(value, s) {
             return value -= parseFloat(getComputedStyle(element, s)) || 0;
          })) + 'px';
        
        default: return getComputedStyle(element, styleName);
      }
    }
    // IE
    if ('currentStyle' in span && !hasComputedStyle) {
      getComputedStyle = function(element, styleName) {
        styleName = (styleName === 'float' || styleName === 'cssFloat') ? 'styleFloat' : styleName;
        var currentStyle = element.currentStyle;
        return element[element.currentStyle ? 'currentStyle' : 'style'][styleName];
      };
      return getStyleIE;
    }
    
    if (hasComputedStyle) {
      // Opera
      span.style.display = 'none';
      if (!document.defaultView.getComputedStyle(span, null).height) return getStyleOpera;
      
      // Firefox, Safari, etc...
      return function(element, styleName) {
        return getComputedStyle($(element), styleName);
      };
    }
    
    return getStyle;
  })(),
  
  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },
  
  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else 
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') : 
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
    
    if ('filters' in document.documentElement &&
        'filter' in document.documentElement.style) {
      return function(element, value) {
        element = $(element);
        var currentStyle = element.currentStyle;
        if ((currentStyle && !currentStyle.hasLayout) ||
          (!currentStyle && element.style.zoom == 'normal'))
            element.style.zoom = 1;
        
        var filter = element.getStyle('filter'), style = element.style;
        if (value == 1 || value === '') {
          (filter = stripAlpha(filter)) ?
            style.filter = filter : style.removeAttribute('filter');
          return element;
        } else if (value < 0.00001) value = 0;
        style.filter = stripAlpha(filter) +
          'alpha(opacity=' + (value * 100) + ')';
        return element;   
      };
    }
    if (Prototype.Browser.WebKit &&
       (navigator.userAgent.match(/AppleWebKit\/(\d)/) || [])[1] < 5) {
      return function(element, value) {
        element = setOpacity(element, value);
        if (value == 1)
          if (element.tagName.toUpperCase() == 'IMG' && element.width) {
            element.width++; element.width--;
          } else try {
            var n = document.createTextNode(' ');
            element.removeChild(element.appendChild(n));
          } catch (e) { }
        
        return element;
      };
    }
    if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
      return function(element, value) {
        element = $(element);
        element.style.opacity = (value == 1) ? 0.999999 : 
          (value === '') ? '' : (value < 0.00001) ? 0 : value;
        return element;
      };
    }
    
    return setOpacity;
  })(),
  
  getDimensions: function(element) {
    element = $(element);
    var display = element.getStyle('display'),
     dimensions = { width: element.offsetWidth, height: element.offsetHeight };
    
    // All width and height properties return 0 on elements with display:none,
    // so show the element temporarily
    if (display === "none" || display === null ||
        dimensions.width === 0 || dimensions.height === 0) {
      var els = element.style,
       originalVisibility = els.visibility,
       originalPosition   = els.position,
       originalDisplay    = els.display;

      els.visibility = 'hidden';
      els.position = 'absolute';
      els.display = 'block';
      
      dimensions = { width: element.offsetWidth, height: element.offsetHeight };

      els.display = originalDisplay;
      els.position = originalPosition;
      els.visibility = originalVisibility;
    }
    return dimensions;
  },
  
  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (Prototype.Browser.Opera) {
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
    element = $(element);
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
    } while (element = Element._getRealOffsetParent(element));
    return Element._returnOffset(valueL, valueT);
  },

  positionedOffset: function(element) {
    element = $(element);
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = Element._getRealOffsetParent(element);
    } while (element && element !== document.body &&
      Element.getStyle(element, 'position') === 'static');
    
    return Element._returnOffset(valueL, valueT);
  },

  absolutize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'absolute')
      return element;
    // Position.prepare(); // To be done manually by Scripty when it needs it.

    var s = element.style,
     offsets = Element.positionedOffset(element),
     before = Element.getDimensions(element);

    var styles = {
      width:  ['borderLeftWidth', 'paddingLeft', 'borderRightWidth',  'paddingRight'],
      height: ['borderTopWidth',  'paddingTop',  'borderBottomWidth', 'paddingBottom']
    };
    // calculate css dimensions of the element
    var cssDimensions = { };
    for (var i in before) {
      cssDimensions[i] = Math.max(0, styles[i].inject(before[i], function(value, styleName) {
        return value -= parseFloat(Element.getStyle(element, styleName)) || 0;
      }));
    }

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
    s.width      = cssDimensions.width  + 'px';
    s.height     = cssDimensions.height + 'px';

    var after = Element.getDimensions(element);
    s.width   = Math.max(0, cssDimensions.width  + (before.width  - after.width))  + 'px';
    s.height  = Math.max(0, cssDimensions.height + (before.height - after.height)) + 'px';

    return element;
  },

  relativize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'relative')
      return element;
    // Position.prepare(); // To be done manually by Scripty when it needs it.

    if (Object.isUndefined(element._originalTop))
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
    if (!Object.isUndefined(element._originalTop))
      delete element._originalTop;
    return element;
  },

  cumulativeScrollOffset: function(element) {
    element = $(element);
    var valueT = 0, valueL = 0;
    do {
      // Skip body if documentElement has
      // scroll values as well (i.e. Opera 9.2x)
      if (element === document.body && ((element.scrollTop && 
       element.parentNode.scrollTop) || (element.scrollLeft && 
        element.parentNode.scrollLeft))) continue;

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
      return $(document.body);

    while ((element = element.offsetParent) &&
     !/^(html|body)$/i.test(element.tagName)) {
      if (Element.getStyle(element, 'position') !== 'static')
        return $(element);
    }
    return $(document.body);
  },

  viewportOffset: function(forElement) {
    forElement = $(forElement);
    var offsetParent, element = forElement, valueT = 0, valueL = 0,
     scrollOffset = Element.cumulativeScrollOffset(element);

    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      offsetParent = Element._getRealOffsetParent(element);
      if (offsetParent === document.body && Element.getStyle(element,
       'position') === 'absolute') break;
    } while (element = offsetParent);

    // Subtract the scrollOffets of forElement from the scrollOffset totals
    // (cumulativeScrollOffset includes them).
    // Then subtract the the scrollOffset totals from the element offset totals.
    valueT -= scrollOffset.top  - (forElement.scrollTop  || 0);
    valueL -= scrollOffset.left - (forElement.scrollLeft || 0);

    return Element._returnOffset(valueL, valueT);
  },

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

    if (options.setHeight || options.setWidth) {
      var subtract = { },
       dims = Element.getDimensions(source);
      if (options.setHeight)
        subtract.height = ['paddingTop',  'paddingBottom', 'borderTopWidth',  'borderBottomWidth'];
      if (options.setWidth)
        subtract.width  = ['paddingLeft', 'paddingRight',  'borderLeftWidth', 'borderRightWidth'];
      for (var i in subtract) {
        s[i] = Math.max(0, subtract[i].inject(dims[i], function(value, styleName) {
          return value -= parseFloat(Element.getStyle(element, styleName)) || 0;
        })) + 'px';
      }
    }
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

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'      
    }, 
    values: { }
  }
};

if (Prototype.Browser.Opera) { 
  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return $(element).title;
      return proceed(element, attribute);
    }
  );  
}

else if (Prototype.Browser.IE) {
  // IE doesn't report offsets correctly for static elements, so we change them
  // to "relative" to get the values, then change them back.
  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        // Trigger hasLayout on the offset parent so that IE6 reports
        // accurate offsetTop and offsetLeft values for position: fixed.
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

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
          if (!Object.isFunction(attribute)) return "";
          var source = attribute.toString();
          return source.indexOf('function anonymous()\n{\n') === 0 ? source.slice(23, -2) : "";
        },
        _flag: function(element, attribute) {
          return $(element).hasAttribute(attribute) ? attribute : null;
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
          if (!attr) element.setAttributeNode(attr = document.createAttribute(name));
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
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
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

else if (Prototype.Browser.WebKit) {
  // Safari returns margins on body which is incorrect if the child is absolutely
  // positioned.  For performance reasons, redefine Element#cumulativeOffset for
  // KHTML/WebKit only.
  Element.Methods.cumulativeOffset = function(element) {
    element = $(element);
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;
        
      element = element.offsetParent;
    } while (element);
    
    return Element._returnOffset(valueL, valueT);
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getRealOffsetParent = function(element) {
  return (element.currentStyle === null || !element.offsetParent) ? false :
   element.offsetParent === document.documentElement ?
     element.offsetParent : Element.getOffsetParent(element);
};

Element._getContentFromAnonymousElement = (function() {
  var div = document.createElement('div'),
   fragment = document.createDocumentFragment();
  
  var getContentAsFragment = (function() {
    if ('removeNode' in div) {
      return function(container) {
        // shortcut for IE: removes the parent but keeping the children
        fragment.appendChild(container).removeNode();
        return fragment;
      };
    } else if ('createRange' in document) {
      var range = document.createRange();
      return function(container) {
        range.selectNodeContents(container);
        fragment.appendChild(range.extractContents());
        return fragment;
      };
    } else {
      return function(container) {
        var length = container.childNodes.length;
        while (length--) fragment.insertBefore(container.childNodes[length], fragment.firstChild);
        return fragment;
      };
    }
  })();
  
  return function(tagName, html) {
    var node = div, t = Element._insertionTranslations.tags[tagName];
    if (t) {
      node.innerHTML= t[0] + html + t[1];
      t[2].times(function() { node = node.firstChild });
    } else node.innerHTML = html;
    
    return getContentAsFragment(node);
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

if (!Prototype.BrowserFeatures.ElementExtensions && 
    document.createElement('div').__proto__) {
  window.HTMLElement = { };
  window.HTMLElement.prototype = document.createElement('div').__proto__;
  Prototype.BrowserFeatures.ElementExtensions = true;
}

Element.extend = (function() {
  if (Prototype.BrowserFeatures.SpecificElementExtensions)
    return Prototype.K;

  var Methods = { }, ByTag = Element.Methods.ByTag;
  
  var extend = Object.extend(function(element) {
    if (!element || element._extendedByPrototype || 
        element.nodeType != 1 || element === window) return element;

    // Filter out XML nodes because IE errors on them.
    if (!('write' in element.ownerDocument)) return element;

    var methods = Object.clone(Methods),
      tagName = element.tagName.toUpperCase(), property, value;
    
    // extend methods for specific tags
    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);
    
    for (property in methods) {
      value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
    
    element._extendedByPrototype = Prototype.emptyFunction;
    return element;
    
  }, { 
    refresh: function() {
      // extend methods for all tags (Safari doesn't need this)
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });
  
  extend.refresh();
  return extend;
})();

// No use of $ in this function in order to keep things fast.
// Used by the Selector class.
Element.hasAttribute = function(element, attribute) {
  if (element.hasAttribute) return element.hasAttribute(attribute);
  return Element.Methods.Simulated.hasAttribute(element, attribute);
};

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;
  
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
  
  if (!tagName) Object.extend(Element.Methods, methods || { });  
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
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
      if (!Object.isFunction(value)) continue;
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
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];
    
    window[klass] = { };
    window[klass].prototype = document.createElement(tagName).__proto__;
    return window[klass];
  }
  
  if (F.ElementExtensions) {
    copy(Element.Methods, HTMLElement.prototype);
    copy(Element.Methods.Simulated, HTMLElement.prototype, true);
  }
  
  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }  

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;
  
  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};

document.viewport = {
  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },
  
  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
  }
};

// Define document.viewport.getWidth() and document.viewport.getHeight()
(function(v) {
  var element, backup = { }, doc = document,
   docEl = doc.documentElement;

  function isBodyActingAsRoot() {
    if (docEl.clientWidth === 0) return true;
    ['body', 'documentElement']._each(function(name) {
       backup[name] = doc[name].style.cssText;
       doc[name].style.cssText += ';margin:0;height:auto;';
    });
    Element.insert(doc.body, { top: '<div style="display:block;height:8500px;"></div>' });
    var result = docEl.clientHeight >= 8500;
    doc.body.down().remove();

    for (name in backup) doc[name].style.cssText = backup[name];
    return result;
  }

  function define(D) {
    element = element || (isBodyActingAsRoot() ? doc.body : // Opera < 9.5, Quirks mode
      ('clientWidth' in doc) ? doc : docEl); // Safari < 3 : Others
    v['get' + D] = function() { return element['client' + D] };
    return v['get' + D]();
  }
  v.getHeight = define.curry('Height');
  v.getWidth  = define.curry('Width');
})(document.viewport);
