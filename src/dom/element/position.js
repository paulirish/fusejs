  /*---------------------------- ELEMENT: POSITION ---------------------------*/

  (function() {
    this.makeAbsolute = function makeAbsolute(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'absolute')
        return element;

      var s = element.style,
       cssWidth  = Element._getCssWidth(element),
       cssHeight = Element._getCssHeight(element),
       offsets   = Element.positionedOffset(element),
       before    = Element.getDimensions(element);

      element._originalLeft       = s.left;
      element._originalTop        = s.top;
      element._originalWidth      = s.width;
      element._originalHeight     = s.height;   
      element._originalMarginTop  = s.marginTop;
      element._originalMarginLeft = s.marginLeft;

      s.position   = 'absolute';
      s.marginTop  = '0';
      s.marginLeft = '0';
      s.top        = offsets.top  + 'px';
      s.left       = offsets.left + 'px';
      s.width      = cssWidth     + 'px';
      s.height     = cssHeight    + 'px';

      var after = Element.getDimensions(element);
      s.width   = Math.max(0, cssWidth  + (before.width  - after.width))  + 'px';
      s.height  = Math.max(0, cssHeight + (before.height - after.height)) + 'px';

      return element;
    },

    this.undoAbsolute = function undoAbsolute(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'relative')
        return element;
      if (typeof element._originalTop === 'undefined')
        throw new Error('Element#makeAbsolute must be called first.');

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
    };

    this.makeClipping = function makeClipping(element) {
      element = $(element);
      if (element._overflow) return element;
      element._overflow = Element.getStyle(element, 'overflow') || 'auto';
      if (element._overflow !== 'hidden')
        element.style.overflow = 'hidden';
      return element;
    };

    this.undoClipping = function undoClipping(element) {
      element = $(element);
      if (!element._overflow) return element;
      element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
      element._overflow = null;
      return element;
    };

    this.makePositioned = function makePositioned(element) {
      element = $(element);
      var pos = Element.getStyle(element, 'position');
      if (!pos || pos === 'static') {
        element._madePositioned = true;
        element.style.position  = 'relative';
        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        element.style.top = element.style.left = '0';
      }
      return element;
    };

    this.undoPositioned = function undoPositioned(element) {
      element = $(element);
      if (element._madePositioned) {
        element._madePositioned = undefined;
        element.style.position  =
         element.style.top      =
         element.style.left     =
         element.style.bottom   =
         element.style.right    = '';   
      }
      return element;
    };

   this.clonePosition = function clonePosition(element, source, options) {
      element = $(element);
      source  = $(source);
      options = Fuse.Object._extend({
        'offsetLeft': 0,
        'offsetTop':  0,
        'setLeft':    true,
        'setTop':     true,
        'setWidth':   true,
        'setHeight':  true
      }, options);

      var s = element.style;

      // Get element size without border or padding then add
      // the difference between the source and element padding/border
      // to the height and width in an attempt to keep the same dimensions.
      if (options.setHeight)
        s.height = Math.max(0, Element._getCssHeight(source) +
          (Element._getPaddingHeight(source) - Element._getPaddingHeight(element)) +
          (Element._getBorderHeight(source)  - Element._getBorderHeight(element))) + 'px';

      if (options.setWidth)
        s.width = Math.max(0, Element._getCssWidth(source) +
          (Element._getPaddingWidth(source) - Element._getPaddingWidth(element)) +
          (Element._getBorderWidth(source)  - Element._getBorderWidth(element))) + 'px';

      // bail if skipping setLeft and setTop
      if (!options.setLeft && !options.setTop)
        return element;

      // clear element coords before getting
      // the cumulativeOffset because Opera
      // will fumble the calculations if
      // you try to subtract the coords after
      if (options.setLeft) s.left = s.marginLeft = '0';
      if (options.setTop)  s.top  = s.marginTop  = '0';

      var p, position = Element.getStyle(element, 'position');

      var delta = position === 'relative'
        ? Element.cumulativeOffset(element)
        : [0, 0];

      if (position === 'absolute' && Element.descendantOf(element, source)) {
        p = Element.cumulativeOffset(element, source);
        p[0] *= -1; p[1] *= -1;
      } else p = Element.cumulativeOffset(source);

      // set position
      if (options.setLeft) s.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop)  s.top  = (p[1] - delta[1] + options.offsetTop)  + 'px';
      return element;
    };

    this.cumulativeOffset = (function() {
      function getOffset(element, ancestor) {
        // TODO: overhaul with a thorough solution for finding the correct
        // offsetLeft and offsetTop values
        var offsetParent, position, valueT = 0, valueL = 0,
         BODY_OFFSETS_INHERIT_ITS_MARGINS = Bug('BODY_OFFSETS_INHERIT_ITS_MARGINS'),
         ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH =
           Bug('ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH');
        do {
          valueT += element.offsetTop  || 0;
          valueL += element.offsetLeft || 0;

          offsetParent = Element.getOffsetParent(element);
          position     = Element.getStyle(element, 'position');

          if (offsetParent && ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH) {
            valueT += parseFloat(Element.getStyle(offsetParent, 'borderTopWidth'))  || 0;
            valueL += parseFloat(Element.getStyle(offsetParent, 'borderLeftWidth')) || 0;
          }
          if (position === 'fixed' || offsetParent && (offsetParent === ancestor ||
             (BODY_OFFSETS_INHERIT_ITS_MARGINS && position === 'absolute' && 
              getNodeName(offsetParent) === 'BODY'))) {
            break;
          }
        } while (element = offsetParent);
        return Element._returnOffset(valueL, valueT);
      }

      function cumulativeOffset(element, ancestor) {
        element = Element._ensureLayout(element);
        ancestor = $(ancestor);
        if (!Fuse.Object.isElement(ancestor)) ancestor = null;

        // offsetLeft/offsetTop properties return 0 on elements
        // with display:none, so show the element temporarily
        var result;
        if (!Element.isVisible(element)) {
          var s = element.style, backup = s.cssText;
          s.cssText += ';display:block;visibility:hidden;';
          result = getOffset(element, ancestor);
          s.cssText = backup;
        }
        else result = getOffset(element, ancestor);
        return result;
      }

      if (Feature('ELEMENT_BOUNDING_CLIENT_RECT')) {
        getOffset = (function() {
          var _getOffset = getOffset;
          return function(element, ancestor) {
            if (ancestor) return _getOffset(element, ancestor);
            var valueT = 0, valueL = 0;
            if (!Element.isFragment(element)) {
              var doc = getDocument(element),
               info = Fuse._info,
               rect = element.getBoundingClientRect(),
               root = doc[info.root.property],
               scrollEl = doc[info.scrollEl.property],

              valueT = Math.round(rect.top)  -
                (root.clientTop  || 0) + (scrollEl.scrollTop  || 0);
              valueL = Math.round(rect.left) -
                (root.clientLeft || 0) + (scrollEl.scrollLeft || 0);
            }
            return Element._returnOffset(valueL, valueT);
          };
        })();
      }
      return cumulativeOffset;
    })();

    this.cumulativeScrollOffset = function cumulativeScrollOffset(element, onlyAncestors) {
      element = $(element);
      var nodeName, original = element, valueT = 0, valueL = 0,
       doc = getDocument(element), info = Fuse._info,
       scrollEl = doc[info.scrollEl.property],
       skipEl = info.scrollEl.nodeName === 'HTML'
         ? doc[info.body.property]
         : doc[info.docEl.property];

      do {
        if (element !== skipEl) {
          valueT += element.scrollTop  || 0;
          valueL += element.scrollLeft || 0;

          if (element === scrollEl ||
              Element.getStyle(element, 'position') === 'fixed') {
            break;
          }
        }
        element = element.parentNode;
      } while (element && element.nodeType === 1);

      if (onlyAncestors || ((nodeName = getNodeName(original)) && 
          nodeName === 'TEXTAREA' || nodeName === 'INPUT')) {
        valueT -= original.scrollTop  || 0;
        valueL -= original.scrollLeft || 0;
      }

      return Element._returnOffset(valueL, valueT);
    };

    this.positionedOffset = function positionedOffset(element) {
      element = Element._ensureLayout(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = Element.getOffsetParent(element);
      } while (element && getNodeName(element) !== 'BODY' &&
          Element.getStyle(element, 'position') === 'static');

      return Element._returnOffset(valueL, valueT);
    },

    this.viewportOffset = (function() {
      var viewportOffset = function viewportOffset(element) {
        element = $(element);
        var scrollOffset = Element.cumulativeScrollOffset(element, /*onlyAncestors*/ true),
         cumulativeOffset = Element.cumulativeOffset(element),
         valueT = cumulativeOffset.top, valueL = cumulativeOffset.left;

        // subtract the the scrollOffset totals from the element offset totals.
        valueT -= scrollOffset.top;
        valueL -= scrollOffset.left;
        return Element._returnOffset(valueL, valueT);
      };

      if (Feature('ELEMENT_BOUNDING_CLIENT_RECT')) {
        viewportOffset = function viewportOffset(element) {
          element = $(element);
          var valueT = 0, valueL = 0;
          if (!Element.isFragment(element)) {
            // IE window's upper-left is at 2,2 (pixels) with respect
            // to the true client when not in quirks mode.
            var doc = getDocument(element),
             rect   = element.getBoundingClientRect(),
             root   = doc[Fuse._info.root.property];

            valueT = Math.round(rect.top)  - (root.clientTop  || 0);
            valueL = Math.round(rect.left) - (root.clientLeft || 0);
          }
          return Element._returnOffset(valueL, valueT);
        };
      }
      return viewportOffset;
    })();

    // prevent JScript bug with named function expressions
    var makeAbsolute =        null,
     clonePosition =          null,
     cumulativeScrollOffset = null,
     makeClipping =           null,
     makePositioned =         null,
     positionedOffset =       null,
     undoAbsolute =           null,
     undoClipping =           null,
     undoPositioned =         null;
  }).call(Element.Methods);
