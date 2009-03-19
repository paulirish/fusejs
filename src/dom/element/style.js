  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function() {
    this.classNames = function classNames(element) {
      return new Element.ClassNames(element);
    };

    this.hasClassName = function hasClassName(element, className) {
      element = $(element);
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName === className || 
        (' ' + elementClassName + ' ').indexOf(' ' + className + ' ') > -1));
    };

    this.addClassName = function addClassName(element, className) {
      element = $(element);
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    };

    this.removeClassName = function removeClassName(element, className) {
      element = $(element);
      element.className = element.className.replace(
        new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ').strip();
      return element;
    };

    this.toggleClassName = function toggleClassName(element, className) {
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    };

    this.setStyle = function setStyle(element, styles) {
      element = $(element);
      var elementStyle = element.style;
      if (typeof styles === 'string') {
        element.style.cssText += ';' + styles;
        return styles.include('opacity')
          ? Element.setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
          : element;
      }
      for (var property in styles) {
        if (property === 'opacity')
          Element.setOpacity(element, styles[property]);
        else 
          elementStyle[(property === 'float' || property === 'cssFloat') ?
            (typeof elementStyle.styleFloat === 'undefined' ? 'cssFloat' : 'styleFloat') : 
              property] = styles[property];
      }
      return element;
    };

    this.getOpacity = (function() {
      var getOpacity = function getOpacity(element) {
        return Element.getStyle(element, 'opacity');
      };

      if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        getOpacity = function getOpacity(element) {
          var value = (Element.getStyle(element, 'filter') || '').match(/alpha\(opacity=(.*)\)/);
          if (value && value[1]) return parseFloat(value[1]) / 100;
          return 1.0;
        };
      }
      return getOpacity;
    })();

    this.setOpacity = (function() {
      function setOpacity(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : 
        (value < 0.00001) ? 0 : value;
        return element;
      }

      if (Fuse.Browser.Agent.WebKit && (userAgent.match(/AppleWebKit\/(\d)/) || [])[1] < 5) {
        var _setOpacity = setOpacity;
        setOpacity = function setOpacity(element, value) {
          element = _setOpacity(element, value);
          if (value == 1) {
            if (getNodeName(element) == 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              var n = element.ownerDocument.createTextNode(' ');
              element.removeChild(element.appendChild(n));
            } catch (e) { }
          }
          return element;
        };
      }
      else if (Fuse.Browser.Agent.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        setOpacity = function setOpacity(element, value) {
          element = $(element);
          element.style.opacity = (value == 1) ? 0.999999 : 
            (value === '') ? '' : (value < 0.00001) ? 0 : value;
          return element;
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function(element, value) {
          element = $(element);
          if (!Element._hasLayout(element))
            element.style.zoom = 1;

          var style = element.style,
           filter = Element.getStyle(element, 'filter');

          // strip alpha
          filter = filter.replace(/alpha\([^)]*\)/gi, '');

          if (value == 1 || value === '') {
            if (filter) style.filter = filter;
            else style.removeAttribute('filter');
            return element;
          }
          else if (value < 0.00001) value = 0;

          style.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          return element;   
        };
      }

      return setOpacity;
    })();

    // prevent JScript bug with named function expressions
    var addClassName = null,
     hasClassName =    null,
     removeClassName = null,
     classNames =      null,
     toggleClassName = null,
     setStyle =        null,
     getOpacity =      null,
     setOpacity =      null;
  }).call(Element.Methods);

  if (Feature('ELEMENT_COMPUTED_STYLE') || !Feature('ELEMENT_CURRENT_STYLE')) {
    Element.Methods.getStyle = (function() {

      var DIMENSION_NAMES = { 'height': true, 'width': true },
       FLOAT_TRANSLATIONS = { 'float': 'cssFloat' },
       POSITION_NAMES     = { 'bottom': true, 'left': true, 'right': true, 'top': true };

      function _getResult(name, value) {
        if (name === 'opacity')
		      return value ? parseFloat(value) : 1.0;
        return value === 'auto' || value === '' ? null : value;
      }

      function getStyle(element, name) {
        return _getResult(FLOAT_TRANSLATIONS[name] || name,
          element.style[name]);
      }

      // Other
      if (!Feature('ELEMENT_COMPUTED_STYLE'))
        return getStyle;

      var _getComputedStyle = (function() {
        var _getStyle = getStyle;
        return function (element, name) {
          name = FLOAT_TRANSLATIONS[name] || name;
          var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
          if (css) return _getResult(name, css[name]);
          return _getStyle(element, name);
        };
      })();

      var _resolveAsNull = function(element, name) {
        var length = _resolveAsNull.handlers.length;
        while (length--) {
          if (_resolveAsNull.handlers[length](element, name))
            return true;
        }
        return false;
      };
      _resolveAsNull.handlers = [];

      // Opera
      if (Bug('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO')) {
        _resolveAsNull.handlers.push(function(element, name) {
          return POSITION_NAMES[name] && 
            _getComputedStyle(element, 'position') === 'static';
        });
      }
      if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN')) {
        _resolveAsNull.handlers.push(function(element, name) {
          return DIMENSION_NAMES[name] && element.style.display === 'none';
        });
      }

      // Opera 9.2x
      if (Bug('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX')) {
        getStyle = function getStyle(element, name) {
          element = $(element);
          name = name.camelize();
          if (_resolveAsNull(element, name)) return null;

          if (DIMENSION_NAMES[name]) {
            // returns the border-box dimensions rather than the content-box
            // dimensions, so we subtract padding and borders from the value
            var D = name.capitalize(),
             dim = parseFloat(_getComputedStyle(element, name)) || 0;
            if (dim !== element['offset' + D]) return dim + 'px';
            return Element['_getCss' + D](element) + 'px';
          }
          return _getComputedStyle(element, name);
        };
      }
      // Firefox, Safari, Opera 9.5+
      else getStyle = function getStyle(element, name) {
        element = $(element);
        name = name.camelize();
        return _resolveAsNull(element, name) ? null :
          _getComputedStyle(element, name);
      };

      return getStyle;
    })();
  }
  else if (Feature('ELEMENT_CURRENT_STYLE')) {
    Element.Methods.getStyle = (function() {

      var DIMENSION_NAMES = { 'height': true, 'width': true },
       FLOAT_TRANSLATIONS = { 'float': 'styleFloat', 'cssFloat': 'styleFloat' },
       RELATIVE_CSS_UNITS = { 'em': true, 'ex': true };

      // We need to insert into element a span with the M character in it.
      // The element.offsetHeight will give us the font size in px units.
      // Inspired by Google Doctype:
      // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
      var span = Fuse._doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.innerHTML = 'M';

      var getStyle = function getStyle(element, name) {
        if (name === 'opacity')
          return Element.getOpacity(element);

        element = $(element);
        name = name.camelize();

        // get cascaded style
        var value = element[element.currentStyle !== null ? 'currentStyle' : 'style']
         [FLOAT_TRANSLATIONS[name] || name];

        if (value === 'auto') {
          if (DIMENSION_NAMES[name] && element.style.display !== 'none')
            return element['offset' + name.capitalize()] + 'px';
          return null;
        }

        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(value)) {
          if (name === 'fontSize') {
            var unit = value.match(/\D+$/)[0];
            if (unit === '%') {
              var size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return Math.round(size) + 'px';
            } 
            else if (unit in RELATIVE_CSS_UNITS)
              element = element.parentNode;
          }

          // backup values
          var pos = (name === 'height') ? 'top' : 'left',
           stylePos = element.style[pos], runtimePos = element.runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          element.runtimeStyle[pos] = element.currentStyle[pos];
          element.style[pos] = value;
          value = element.style['pixel' + pos.capitalize()] + 'px';

          // revert changes
          element.style[pos] = stylePos;
          element.runtimeStyle[pos] = runtimePos;
          return value;
        }
        return value;
      };

      return getStyle;
    })();
  }
