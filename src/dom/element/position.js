  /*---------------------------- ELEMENT: POSITION ---------------------------*/

  Object._extend(Element.Methods, (function() {
    // TODO: rename to "makeAbsolute"
    function absolutize(element) {
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
    }

    // TODO: rename to "undoAbsolute"
    function relativize(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'relative')
        return element;
      if (typeof element._originalTop === 'undefined')
        throw new Error('Element#absolutize must be called first.');

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
    }

    function makeClipping(element) {
      element = $(element);
      if (element._overflow) return element;
      element._overflow = Element.getStyle(element, 'overflow') || 'auto';
      if (element._overflow !== 'hidden')
        element.style.overflow = 'hidden';
      return element;
    }

    function undoClipping(element) {
      element = $(element);
      if (!element._overflow) return element;
      element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
      element._overflow = null;
      return element;
    }

    function makePositioned(element) {
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
    }

    function undoPositioned(element) {
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
    }

   function clonePosition(element, source, options) {
      element = $(element);
      source  = $(source);
      options = Object._extend({
        'offsetLeft': 0,
        'offsetTop':  0,
        'setLeft':    true,
        'setTop':     true,
        'setWidth':   true,
        'setHeight':  true
      }, options);

      var s = element.style;
      if (options.setHeight)
        s.height = Element._getCssHeight(element) + 'px';
      if (options.setWidth)
        s.width = Element._getCssWidth(element) + 'px';

      // bail if skipping setLeft and setTop
      if (!options.setLeft && !options.setTop)
        return element;

      // clear margins
      if (options.setLeft) s.marginLeft = '0';
      if (options.setTop)  s.marginTop  = '0';

      var delta = [0, 0],
       p = Element.cumulativeOffset(source),
       position = Element.getStyle(element, 'position');

      if (position === 'relative') {
        // clear element coords before getting
        // the cumulativeOffset because Opera
        // will fumble the calculations if
        // you try to subtract the coords after
        if (options.setLeft) s.left = '0';
        if (options.setTop)  s.top  = '0';

        // store element offsets so we can subtract them later
        delta = Element.cumulativeOffset(element);
      }

      // set position
      if (options.setLeft) s.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
      if (options.setTop)  s.top  = (p[1] - delta[1] + options.offsetTop)  + 'px';
      return element;
    }

    function cumulativeOffset(element) {
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

		if (position === 'fixed' || (BODY_OFFSETS_INHERIT_ITS_MARGINS &&
		    position === 'absolute' && offsetParent &&
		    getNodeName(offsetParent) === 'BODY')) {
		  break;
		}
      } while (element = offsetParent);
      return Element._returnOffset(valueL, valueT);
    }

    function cumulativeScrollOffset(element, onlyAncestors) {
      element = $(element);
      var original = element, valueT = 0, valueL = 0,
       nodeName = getNodeName(element);
       rootNodeName = getNodeName(Fuse._root);

      do {
        valueT += element.scrollTop  || 0;
        valueL += element.scrollLeft || 0;

		    if (getNodeName(element) === rootNodeName ||
		      Element.getStyle(element, 'position') === 'fixed') {
	        break;
		    }
		    element = element.parentNode;
      } while (element && element.nodeType === 1);

      if (onlyAncestors || (nodeName === 'TEXTAREA' || nodeName === 'INPUT')) {
        valueT -= original.scrollTop  || 0;
        valueL -= original.scrollLeft || 0;
      }

      return Element._returnOffset(valueL, valueT);
    }

    function positionedOffset(element) {
      element = Element._ensureLayout(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = Element._getRealOffsetParent(element);
      } while (element && getNodeName(element) !== 'BODY' &&
          Element.getStyle(element, 'position') === 'static');

      return Element._returnOffset(valueL, valueT);
    }

    var viewportOffset = (function(forElement) {
      if (Feature('ELEMENT_BOUNDING_CLIENT_RECT')) {
        var backup = Fuse._docEl.style.cssText;
        Fuse._docEl.style.cssText += ';margin:0';

        // IE window's upper-left is at 2,2 (pixels) with respect
        // to the true client, so its pad.left and pad.top will be 2.
        var rect = Fuse._docEl.getBoundingClientRect(), pad = { 'left': 0, 'top': 0 };
        if (Feature('ELEMENT_CLIENT_COORDS'))
          pad = { 'left': Fuse._docEl.clientLeft, 'top': Fuse._docEl.clientTop };
        Fuse._docEl.style.cssText = backup;

        return function(element) {
          element = $(element);
          var r, valueT = 0, valueL = 0;
          if (!Element.isFragment(element)) {
            r = element.getBoundingClientRect();
            valueT = Math.round(r.top)  - pad.top;
            valueL = Math.round(r.left) - pad.left;
         }
          return Element._returnOffset(valueL, valueT);
        };
      }

      return function(element) {
        element = $(element);
        var scrollOffset = Element.cumulativeScrollOffset(element, /*onlyAncestors*/ true),
         cumulativeOffset = Element.cumulativeOffset(element),
         valueT = cumulativeOffset.top, valueL = cumulativeOffset.left;

        // Subtract the the scrollOffset totals from the element offset totals.
        valueT -= scrollOffset.top;
        valueL -= scrollOffset.left;
        return Element._returnOffset(valueL, valueT);
      };
    })();

    return {
      'absolutize':             absolutize,
      'clonePosition':          clonePosition,
      'cumulativeOffset':       cumulativeOffset,
      'cumulativeScrollOffset': cumulativeScrollOffset,
      'makeClipping':           makeClipping,
      'makePositioned':         makePositioned,
      'positionedOffset':       positionedOffset,
      'relativize':             relativize,
      'undoClipping':           undoClipping,
      'undoPositioned':         undoPositioned,
      'viewportOffset':         viewportOffset
    };
  })());
