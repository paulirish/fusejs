  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  Object._extend(Element.Methods, (function() {
    function classNames(element) {
      return new Element.ClassNames(element);
    }

    function hasClassName(element, className) {
      element = $(element);
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName == className || 
        new RegExp('(^|\\s)' + className + '(\\s|$)').test(elementClassName)));
    }

    function addClassName(element, className) {
      element = $(element);
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    }

    function removeClassName(element, className) {
      element = $(element);
      element.className = element.className.replace(
        new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ').strip();
      return element;
    }

    function toggleClassName(element, className) {
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    }

    function setStyle(element, styles) {
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
    }

    /* GET OPACITY */
    var getOpacity = (function() {
      if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        return function(element) {
          var value = (Element.getStyle(element, 'filter') || '').match(/alpha\(opacity=(.*)\)/);
          if (value && value[1]) return parseFloat(value[1]) / 100;
          return 1.0;
        };
      }
      return function (element) {
        return Element.getStyle(element, 'opacity');
      };
    })(),

    /* SET OPACITY */
    setOpacity = (function() {
      function _stripAlpha(filter) {
        return filter.replace(/alpha\([^\)]*\)/gi,'');
      }

      function _setStyleOpacity(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : 
        (value < 0.00001) ? 0 : value;
        return element;
      }

      if (Fuse.Browser.Agent.WebKit && (userAgent.match(/AppleWebKit\/(\d)/) || [])[1] < 5) {
        return function(element, value) {
          element = _setStyleOpacity(element, value);
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

          var style = element.style,
           filter = Element.getStyle(element, 'filter');

          if (value == 1 || value === '') {
            (filter = _stripAlpha(filter)) ?
              style.filter = filter : style.removeAttribute('filter');
            return element;
          } else if (value < 0.00001) value = 0;

          style.filter = _stripAlpha(filter) + 'alpha(opacity=' + (value * 100) + ')';
          return element;   
        };
      }
      // else default
      return _setStyleOpacity;
    })(),

    /* GET STYLE */
    getStyle = (function() {
      function _getStyleValue(element, styleName) {
        return _getResult(_getStyleName(styleName), element.style[styleName]);
      }

      function _getCascadedStyle(element, styleName) {
        styleName = (styleName === 'float' || styleName === 'cssFloat') ? 'styleFloat' : styleName;
        var currentStyle = element.currentStyle;
        return element[element.currentStyle !== null ? 'currentStyle' : 'style'][styleName];
      }

      function _getComputedStyle(element, styleName) {
        styleName = _getStyleName(styleName);
        var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
        if (css) return _getResult(styleName, css[styleName]);
        return _getStyleValue(element, styleName);
      }

      function _getStyleName(styleName) {
        return styleName === 'float' ? 'cssFloat' : styleName;
      }

      function _getResult(styleName, value) {
        if (styleName === 'opacity')
		      return value ? parseFloat(value) : 1.0;
        return value === 'auto' || value === '' ? null : value;
      }

      function _resolveAsNull(element, styleName) {
        var handlers = _resolveAsNull.handlers,
         length = handlers.length;
        if (!length) return false;

        while (length--) {
          if (handlers[length](element, styleName))
            return true;
        }
        return false;
      };
      _resolveAsNull.handlers = [];

      // Opera
      if (Bug('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO')) {
        _resolveAsNull.handlers.push(function(element, styleName) {
          switch (styleName) {
            case 'left': case 'top': case 'right': case 'bottom':
              if (_getComputedStyle(element, 'position') === 'static') return true;
          }
        });
      }
      if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN')) {
        _resolveAsNull.handlers.push(function(element, styleName) {
         return ((styleName === 'height' || styleName === 'width') &&
           element.style.display === 'none');
        });
      }

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        // Firefox, Safari, Opera 9.5+
        if (!Bug('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX')) {
          return function(element, styleName) {
            element = $(element);
            styleName = styleName.camelize();
            return _resolveAsNull(element, styleName) ? null :
              _getComputedStyle(element, styleName);
          };
        }

        // Opera 9.2x
        return function(element, styleName) {
          element = $(element);
          styleName = styleName.camelize();
          if (_resolveAsNull(element, styleName)) return null;

          if (styleName === 'height' || styleName === 'width') {
            // returns the border-box dimensions rather than the content-box
            // dimensions, so we subtract padding and borders from the value
            var D = styleName.capitalize(),
             dim = parseFloat(_getComputedStyle(element, styleName)) || 0;
            if (dim !== element['offset' + D]) return dim + 'px';
            return Element['_getCss' + D](element) + 'px';
          }
          return _getComputedStyle(element, styleName);
        };
      }

      // IE
      if (Feature('ELEMENT_CURRENT_STYLE')) {

        // We need to insert, into element, a span with the M character in it.
        // The element.offsetHeight will give us the font size in px units.
        // Inspired by Google Doctype:
        // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
        var span = Fuse._doc.createElement('span');
        span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
        span.innerHTML = 'M';

        var RELATIVE_CSS_UNITS = { 'em': true, 'ex': true };

        return function (element, styleName) {
          if (styleName === 'opacity')
            return Element.getOpacity(element);

          styleName = styleName.camelize();
          element = $(element);

          var value = _getCascadedStyle(element, styleName);
          if (value === 'auto') {
            if ((styleName === 'width' || styleName === 'height') && element.style.display !== 'none')
              return element['offset' + styleName.capitalize()] + 'px';
            return null;
          }

          // If the unit is something other than a pixel (em, pt, %),
          // set it on something we can grab a pixel value from.
          // Inspired by Dean Edwards' comment
          // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
          if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(value)) {
            if (styleName === 'fontSize') {
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
            var value = element.style['pixel' + pos.capitalize()] + 'px';

            // revert changes
            element.style[pos] = stylePos;
            element.runtimeStyle[pos] = runtimePos;
            return value;
          }
          return value;
        };
      }

      // else default
      return function(element, styleName) {
        return _getStyleValue($(element), styleName.camelize());
      };
    })();

    return {
      'addClassName':    addClassName,
      'hasClassName':    hasClassName,
      'removeClassName': removeClassName,
      'classNames':      classNames,
      'toggleClassName': toggleClassName,
      'getStyle':        getStyle,
      'setStyle':        setStyle,
      'getOpacity':      getOpacity,
      'setOpacity':      setOpacity
    };
  })());
