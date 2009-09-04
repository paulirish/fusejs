  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function(methods) {
    var DIMENSION_NAMES = {
      'height': 1,
      'width':  1
    },

    FLOAT_TRANSLATIONS = typeof Fuse._docEl.style.styleFloat !== 'undefined'
      ? { 'float': 'styleFloat', 'cssFloat': 'styleFloat' }
      : { 'float': 'cssFloat' },

    POSITION_NAMES = {
      'bottom': 1,
      'left':   1,
      'right':  1,
      'top':    1
    },

    RELATIVE_CSS_UNITS = {
      'em': 1,
      'ex': 1
    },

    nullHandlers = [];

    function getComputedStyle(element, name) {
      name = FLOAT_TRANSLATIONS[name] || name;
      var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
      if (css) return getResult(name, css[name]);
      return getValue(element, name);
    }

    function getResult(name, value) {
      if (name == 'opacity')
        return Fuse.String(value === '1' ? '1.0' : parseFloat(value) || '0');
      return value === 'auto' || value === '' ? null : Fuse.String(value);
    }

    function getValue(element, name) {
      name = FLOAT_TRANSLATIONS[name] || name;
      return getResult(name, element.style[name]);
    }

    function isNull(element, name) {
      var length = nullHandlers.length;
      while (length--) {
        if (nullHandlers[length](element, name))
          return true;
      }
      return false;
    }

    if (Bug('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO'))
      nullHandlers.push(function(element, name) {
        return POSITION_NAMES[name] &&
          getComputedStyle(element, 'position') === 'static';
      });

    if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN'))
      nullHandlers.push(function(element, name) {
        return DIMENSION_NAMES[name] && element.style.display === 'none';
      });


    methods.setStyle = function setStyle(element, styles) {
      element = $(element);
      var hasOpacity, key, opacity, elemStyle = element.style;

      if (isString(styles)) {
        elemStyle.cssText += ';' + styles;
        return styles.indexOf('opacity') > -1
          ? Element.setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
          : element;
      }

      if (isHash(styles)) styles = styles._object;
      hasOpacity = 'opacity' in styles;

      if (hasOpacity) { 
        opacity = styles.opacity;
        Element.setOpacity(element, opacity);
        delete styles.opacity;
      }

      for (key in styles)
        elemStyle[FLOAT_TRANSLATIONS[key] || key] = styles[key];

      if (hasOpacity) styles.opacity = opacity;
      return element;
    };


    // fallback for browsers without computedStyle or currentStyle
    if (!Feature('ELEMENT_COMPUTED_STYLE') && !Feature('ELEMENT_CURRENT_STYLE'))
      methods.getStyle = function getStyle(element, name) {
        element = $(element);
        name = Fuse.String(name).camelize();
        return getValue(element, name);
      };

    // Opera 9.2x
    else if (Bug('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX'))
      methods.getStyle = function getStyle(element, name) {
        element = $(element);
        var dim, result;

        // returns the border-box dimensions rather than the content-box
        // dimensions, so we subtract padding and borders from the value
        if (DIMENSION_NAMES[name]) {
          dim = name == 'width' ? 'Width' : 'Height';
          result = getComputedStyle(element, name);
          if ((parseFloat(result) || 0) === element['offset' + dim])
            result = Fuse.String(Element['get' + dim](element, 'content') + 'px');
        } else {
          name = Fuse.String(name).camelize();
          if (isNull(element, name)) result = null;
          else result = getComputedStyle(element, name);
        }

        return result;
      };

    // Firefox, Safari, Opera 9.5+
    else if (Feature('ELEMENT_COMPUTED_STYLE'))
      methods.getStyle = function getStyle(element, name) {
        element = $(element);
        name = Fuse.String(name).camelize();
        return isNull(element, name) ? null : getComputedStyle(element, name);
      };

    // IE
    else methods.getStyle = (function() {
      // We need to insert into element a span with the M character in it.
      // The element.offsetHeight will give us the font size in px units.
      // Inspired by Google Doctype:
      // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
      var span = Fuse._doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.innerHTML = 'M';

      function getStyle(element, name) {
        var currStyle, elemStyle, runtimeStyle, runtimePos, stylePos,
         pos, result, size, unit;

        // handle opacity
        if (name == 'opacity') {
          result = String(Element.getOpacity(element));
          if (result.indexOf('.') < 0) result += '.0';
          return Fuse.String(result);
        }

        // handle shorthand
        element = $(element);
        name = Fuse.String(name).camelize();

        // get cascaded style
        name      = FLOAT_TRANSLATIONS[name] || name;
        elemStyle = element.style;
        currStyle = element.currentStyle || elemStyle;
        result    = currStyle[name];

        // handle auto values
        if (result === 'auto') {
          if (DIMENSION_NAMES[name] && currStyle.display !== 'none')
            return Fuse.String(Element['get' +
              (name == 'width' ? 'Width' : 'Height')](element, 'content') + 'px');
          return null;
        }

        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(result)) {
          if (name == 'fontSize') {
            unit = result.match(/\D+$/)[0];
            if (unit === '%') {
              size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return Fuse.String(Math.round(size) + 'px');
            }
            else if (RELATIVE_CSS_UNITS[unit])
              elemStyle = (element = element.parentNode).style;
          }

          runtimeStyle = element.runtimeStyle;

          // backup values
          pos = Fuse.String(name == 'height' ? 'top' : 'left');
          stylePos = elemStyle[pos];
          runtimePos = runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          runtimeStyle[pos] = stylePos;
          elemStyle[pos] = result;
          result = elemStyle['pixel' + pos.capitalize()] + 'px';

          // revert changes
          elemStyle[pos] = stylePos;
          runtimeStyle[pos] = runtimePos;
        }
        return Fuse.String(result);
      }

      return getStyle;
    })();

    // prevent JScript bug with named function expressions
    var getStyle = null, setStyle = null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function(methods) {
    methods.classNames = function classNames(element) {
      var results = Fuse.String($(element).className).split(/\s+/);
      return results[0].length ? results : Fuse.List();
    };

    methods.hasClassName = function hasClassName(element, className) {
      element = $(element);
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName === className ||
        (' ' + elementClassName + ' ').indexOf(' ' + className + ' ') > -1));
    };

    methods.addClassName = function addClassName(element, className) {
      element = $(element);
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    };

    methods.removeClassName = function removeClassName(element, className) {
      element = $(element);
      element.className = Fuse.String(element.className.replace(
        new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ')).trim();
      return element;
    };

    methods.toggleClassName = function toggleClassName(element, className) {
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    };

    methods.getDimensions = function getDimensions(element, options) {
      return {
        'width': Element.getWidth(element, options),
        'height': Element.getHeight(element, options)
      };
    };

    methods.getOpacity = (function() {
      var getOpacity = function getOpacity(element) {
        return Fuse.Number(parseFloat($(element).style.opacity));
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        getOpacity = function getOpacity(element) {
          element = $(element);
          var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return Fuse.Number(
            parseFloat(style ? style.opacity : element.style.opacity));
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        getOpacity = function getOpacity(element) {
          element = $(element);
          var currStyle = element.currentStyle || element.style,
            result = currStyle['filter'].match(/alpha\(opacity=(.*)\)/);
          return Fuse.Number(result && result[1] ? parseFloat(result[1]) / 100 : 1.0);
        };
      }
      return getOpacity;
    })();

    methods.setOpacity = (function() {
      var setOpacity = function setOpacity(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value == '' && isString(value)) ? '' :
          (value < 0.00001) ? '0' : value;
        return element;
      };

      // TODO: Is this really needed or the best approach ?
      if (Fuse.Env.Agent.WebKit && (userAgent.match(/AppleWebKit\/(\d+)/) || [])[1] < 500) {
        var __setOpacity = setOpacity;
        setOpacity = function setOpacity(element, value) {
          element = __setOpacity(element, value);
          if (value == 1) {
            if (getNodeName(element) === 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              element.removeChild(element.appendChild(element
                .ownerDocument.createTextNode(' ')));
            } catch (e) { }
          }
          return element;
        };
      }
      else if (Fuse.Env.Agent.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        setOpacity = function setOpacity(element, value) {
          element = $(element);
          element.style.opacity = (value == 1) ? 0.999999 :
            (value == '' && isString(value)) ? '' :
              (value < 0.00001) ? 0 : value;
          return element;
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function setOpacity(element, value) {
          element = $(element);

          // strip alpha from filter style
          var elemStyle = element.style,
           filter = Element.getStyle(element, 'filter').replace(/alpha\([^)]*\)/i, '');

          if (!Element._hasLayout(element))
            elemStyle.zoom = 1;

          if (value == 1 || value == '' && isString(value)) {
            if (filter) elemStyle.filter = filter;
            else elemStyle.removeAttribute('filter');
          }
          else {
            if (value < 0.00001) value = 0;
            elemStyle.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          }
          return element;
        };
      }
      return setOpacity;
    })();

    methods.isVisible = function isVisible(element) {
      if (!Fuse._body) return false;

      var isVisible = function isVisible(element) {
        // handles IE and the fallback solution
        element = $(element);
        var currStyle = element.currentStyle;
        return currStyle !== null && (currStyle || element.style).display !== 'none' &&
          !!(element.offsetHeight || element.offsetWidth);
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        isVisible = function isVisible(element) {
          element = $(element);
          var compStyle = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return !!(compStyle && (element.offsetHeight || element.offsetWidth));
        };
      }

      if (Bug('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
        var __isVisible = isVisible;
        isVisible = function isVisible(element) {
          element = $(element);
          if (__isVisible(element)) {
            var nodeName = getNodeName(element);
            if ((nodeName === 'THEAD' || nodeName === 'TBODY' || nodeName === 'TR') &&
               (element = element.parentNode))
              return isVisible(element);
            return true;
          }
          return false;
        };
      }

      // redefine method and execute
      return (Element.isVisible = methods.isVisible = isVisible)(element);
    };

    // prevent JScript bug with named function expressions
    var addClassName = null,
     hasClassName =    null,
     removeClassName = null,
     classNames =      null,
     toggleClassName = null,
     getDimensions =   null,
     isVisible =       null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth and Element#getHeight
  (function(methods) {

    var PRESETS = {
      'box':     { 'border':  1, 'margin':  1, 'padding': 1 },
      'visual':  { 'border':  1, 'padding': 1 },
      'client':  { 'padding': 1 },
      'content': {  }
    },

    HEIGHT_WIDTH_STYLE_SUMS = {
      'Height': {
        'border':  ['borderTopWidth', 'borderBottomWidth'],
        'margin':  ['marginTop',      'marginBottom'],
        'padding': ['paddingTop',     'paddingBottom']
      },
      'Width': {
        'border':  ['borderLeftWidth', 'borderRightWidth'], 
        'margin':  ['marginLeft',      'marginRight'],
        'padding': ['paddingLeft',     'paddingRight']
      }
    },

    getStyle = methods.getStyle,

    isVisible = methods.isVisible, 

    i = 0;

    while (i < 2) (function() {
      function getSum(element, name) {
        var styles = STYLE_SUMS[name];
        return (parseFloat(getStyle(element, styles[0])) || 0) +
          (parseFloat(getStyle(element, styles[1])) || 0);  
      }

      function getDimension(element, options) {
        element = $(element);
        var backup, elemStyle, isGettingSum, result;

        // default to `visual` preset
        if (!options) options = PRESETS.visual;
        else if (options && isString(options)) {
          if (STYLE_SUMS[options]) isGettingSum = true;
          else options = PRESETS[options];
        } 

        // First get our offset(Width/Height) (visual)
        // offsetHeight/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!isVisible(element)) {
          elemStyle = element.style;
          backup = elemStyle.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';

          // exit early when returning style sums
          if (isGettingSum) {
            result = getSum(element, options);
            elemStyle.cssText = backup;
            return Fuse.Number(result);
          }
          result = element[property];
          elemStyle.cssText = backup;
        }
        else if (isGettingSum) return Fuse.Number(getSum(element, options));
        else result = element[property];

        // add margins because they're excluded from the offset values
        if (options.margin)
          result += getSum(element, 'margin');

        // subtract border and padding because they're included in the offset values
        if (!options.border)
          result -= getSum(element, 'border');

        if (!options.padding)
          result -= getSum(element, 'padding');

        return Fuse.Number(result);
      }

      var dim = i++ ? 'Width' : 'Height',
       property = 'offset' + dim,
       STYLE_SUMS = HEIGHT_WIDTH_STYLE_SUMS[dim];

      methods['get' + dim] = getDimension;
    })();

    i = undef;
  })(Element.Methods);
