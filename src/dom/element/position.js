  /*---------------------------- ELEMENT: POSITION ---------------------------*/

  (function(methods) {

    var OFFSET_PARENT_EXIT_BEFORE_NODES = {
      'BODY': 1,
      'HTML': 1
    },

    OFFSET_PARENT_EXIT_ON_NODES = {
      'TABLE': 1,
      'TD':    1,
      'TH':    1
    },

    BODY_OFFSETS_INHERIT_ITS_MARGINS = null,

    ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH = null,

    getHeight = methods.getHeight,

    getWidth  = methods.getWidth,

    getStyle  = methods.getStyle,

    isVisible = methods.isVisible,

    removeExpando = (function() {
      Fuse._div._x = 1;
      Fuse._div.removeAttribute('_x');
      return typeof Fuse._div._x === 'undefined'
        ? function(element, expandoName) { element.removeAttribute(expandoName); }
        : function(element, expandoName) { delete element[expandoName]; };
    })();


    methods.makeAbsolute = function makeAbsolute(element) {
      element = $(element);
      if (getStyle(element, 'position') != 'absolute') {
        var after, s = element.style,
         backup  = element._madeAbsolute = { }, 
         width   = getWidth(element, 'content'),
         height  = getHeight(element, 'content'),
         offsets = Element.positionedOffset(element),
         before  = Element.getDimensions(element);

        backup.left       = s.left;
        backup.top        = s.top;
        backup.width      = s.width;
        backup.height     = s.height;
        backup.marginTop  = s.marginTop;
        backup.marginLeft = s.marginLeft;

        s.position  = 'absolute';
        s.marginTop = s.marginLeft = '0';
        s.top       = offsets.top   + 'px';
        s.left      = offsets.left  + 'px';
        s.width     = width         + 'px';
        s.height    = height        + 'px';

        after    = Element.getDimensions(element);
        s.width  = Math.max(0, width  + (before.width  - after.width))  + 'px';
        s.height = Math.max(0, height + (before.height - after.height)) + 'px';
      }
      return element;
    },

    methods.undoAbsolute = function undoAbsolute(element) {
      element = $(element);
      if (getStyle(element, 'position') == 'absolute') {
        if (!element._madeAbsolute)
          throw new Error('Element#makeAbsolute must be called first.');

        var backup = element._madeAbsolute, s = element.style;
        s.position   = 'relative';
        s.marginLeft = backup.marginLeft;
        s.marginTop  = backup.marginTop;
        s.top        = backup.top;
        s.left       = backup.left;
        s.width      = backup.height;
        s.height     = backup.width;

        removeExpando(element, '_madeAbsolute');
      }
      return element;
    };

    methods.makeClipping = function makeClipping(element) {
      element = $(element);
      if (getStyle(element, 'overflow') != 'hidden') {
        element._madeClipped = getStyle(element, 'overflow') || 'auto';
        element.style.overflow = 'hidden';
      }
      return element;
    };

    methods.undoClipping = function undoClipping(element) {
      element = $(element);
      if (getStyle(element, 'overflow') == 'hidden') {
        if (!element._madeClipped)
          throw new Error('Element#makeClipping must be called first.');

        var overflow = element._madeClipped;
        element.style.overflow = overflow == 'auto' ? '' : overflow;
        removeExpando(element, '_madeClipped');
      }
      return element;
    };

    methods.makePositioned = function makePositioned(element) {
      element = $(element);
      var elemStyle = element.style, pos = getStyle(element, 'position');
      if (!pos || pos == 'static') {
        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        elemStyle.top = elemStyle.left = '0';
        elemStyle.position = 'relative';
        element._madePositioned = true;
      }
      return element;
    };

    methods.undoPositioned = function undoPositioned(element) {
      element = $(element);
      if (getStyle(element, 'position') == 'relative') {
        if (!element._madePositioned)
          throw new Error('Element#makePositioned must be called first.');

        var elemStyle = element.style;
        elemStyle.position = elemStyle.top   = elemStyle.left =
        elemStyle.bottom   = elemStyle.right = '';
        removeExpando(element, '_madePositioned');
      }
      return element;
    };

    methods.clonePosition = function clonePosition(element, source, options) {
      element = $(element);
      source  = $(source);
      options = _extend({
        'offsetLeft': 0,
        'offsetTop':  0,
        'setLeft':    1,
        'setTop':     1,
        'setWidth':   1,
        'setHeight':  1
      }, options);

      var coord, borderHeight, borderWidth, paddingHeight, paddingWidth,
       elemDisplay, elemOffset, elemPos, elemVis, srcBackup,
       appendCSS    = ';display:block;visibility:hidden;',
       elemIsHidden = !isVisible(element),
       elemStyle    = element.style,
       srcIsHidden  = !isVisible(source),
       srcStyle     = source.style;

      // attempt to unhide elements to get their styles
      if (srcIsHidden) {
        srcBackup = srcStyle.cssText;
        srcStyle.cssText += appendCSS;
      }
      if (elemIsHidden) {
        // backup individual style properties because we are changing several
        // others and don't want to pave them when the backup is restored
        elemDisplay = elemStyle.display;
        elemVis = elemStyle.visibility;
        elemStyle.cssText += appendCSS;
      }

      // Get element size without border or padding then add
      // the difference between the source and element padding/border
      // to the height and width in an attempt to keep the same dimensions.
      if (options.setHeight) {
        paddingHeight = getHeight(source, 'padding');
        borderHeight  = getHeight(source, 'border');
        elemStyle.height = Math.max(0,
          (source.offsetHeight - paddingHeight - borderHeight) +  // content height
          (paddingHeight - getHeight(element, 'padding')) +       // padding diff
          (borderHeight  - getHeight(element, 'border'))) + 'px'; // border diff
      }
      if (options.setWidth) {
        paddingWidth = getWidth(source, 'padding');
        borderWidth  = getWidth(source, 'border');
        elemStyle.width = Math.max(0,
          (source.offsetWidth - paddingWidth - borderWidth)  +  // content width
          (paddingWidth - getWidth(element, 'padding')) +       // padding diff
          (borderWidth  - getWidth(element, 'border'))) + 'px'; // border diff
      }

      if (options.setLeft || options.setTop) {

        elemPos = getStyle(element, 'position');

        // clear element coords before getting
        // the cumulativeOffset because Opera
        // will fumble the calculations if
        // you try to subtract the coords after
        if (options.setLeft) elemStyle.left = elemStyle.marginLeft = '0';
        if (options.setTop)  elemStyle.top  = elemStyle.marginTop  = '0';

        // if an absolute element is a descendant of the source then
        // calculate its offset to the source and inverse it
        if (elemPos == 'absolute' && Element.descendantOf(element, source)) {
          coord = Element.cumulativeOffset(element, source);
          coord.left *= -1;
          coord.top  *= -1;
        }
        else {
          coord = Element.cumulativeOffset(source);
          if (elemPos == 'relative') {
            // subtract the relative element's offset from the source's offsets
            elemOffset  = Element.cumulativeOffset(element);
            coord.left -= elemOffset.left;
            coord.top  -= elemOffset.top;
          }
        }

        // set position
        if (options.setLeft) elemStyle.left = (coord.left + options.offsetLeft) + 'px';
        if (options.setTop)  elemStyle.top  = (coord.top  + options.offsetTop)  + 'px';

        // restore styles
        if (elemIsHidden) {
          elemStyle.display = elemDisplay;
          elemStyle.visibility = elemVis;
        }
        if (srcIsHidden)
          srcStyle.cssText = srcBackup;
      }

      return element;
    };

    // Follows spec http://www.w3.org/TR/cssom-view/#offset-attributes
    methods.getOffsetParent = function getOffsetParent(element) {
      element = $(element);
      var original = element, nodeName = getNodeName(element);
      if (nodeName === 'AREA') return Element.extend(element.parentNode);

      // IE throws an error if the element is not in the document.
      // Many browsers report offsetParent as null if the element's
      // style is display:none.
      if (Element.isFragment(element) || element.nodeType === 9 ||
          OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName] || !element.offsetParent &&
          getStyle(element, 'display') != 'none') return null;

      while (element = element.parentNode) {
        nodeName = getNodeName(element);
        if (OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName]) break;
        if (OFFSET_PARENT_EXIT_ON_NODES[nodeName] ||
            getStyle(element, 'position') != 'static')
          return Element.extend(element);
      }
      return Element.extend(getDocument(original).body);
    };

    // TODO: overhaul with a thorough solution for finding the correct
    // offsetLeft and offsetTop values
    methods.cumulativeOffset = (function() {
      function getOffset(element, ancestor) {
        var offsetParent, position, valueT = 0, valueL = 0;

        if (BODY_OFFSETS_INHERIT_ITS_MARGINS === null)
          BODY_OFFSETS_INHERIT_ITS_MARGINS = Bug('BODY_OFFSETS_INHERIT_ITS_MARGINS');

        if (ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH === null)
          ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH =
            Bug('ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH');

        do {
          valueT += element.offsetTop  || 0;
          valueL += element.offsetLeft || 0;

          offsetParent = Element.getOffsetParent(element);
          position     = getStyle(element, 'position');

          if (offsetParent && ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH) {
            valueT += parseFloat(getStyle(offsetParent, 'borderTopWidth'))  || 0;
            valueL += parseFloat(getStyle(offsetParent, 'borderLeftWidth')) || 0;
          }
          if (position == 'fixed' || offsetParent && (offsetParent === ancestor ||
             (BODY_OFFSETS_INHERIT_ITS_MARGINS && position == 'absolute' &&
              getNodeName(offsetParent) === 'BODY'))) {
            break;
          }
        } while (element = offsetParent);
        return Element._returnOffset(valueL, valueT);
      }

      function cumulativeOffset(element, ancestor) {
        element = Element._ensureLayout(element);
        ancestor = $(ancestor);
        if (!isElement(ancestor)) ancestor = null;

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
               scrollEl = doc[info.scrollEl.property];

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

    methods.cumulativeScrollOffset = function cumulativeScrollOffset(element, onlyAncestors) {
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

          if (element === scrollEl || getStyle(element, 'position') == 'fixed')
            break;
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

    methods.positionedOffset = function positionedOffset(element) {
      element = Element._ensureLayout(element);
      var valueT = 0, valueL = 0;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = Element.getOffsetParent(element);
      } while (element && getNodeName(element) !== 'BODY' &&
          getStyle(element, 'position') == 'static');

      return Element._returnOffset(valueL, valueT);
    },

    methods.viewportOffset = (function() {
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
     getOffsetParent =        null,
     makeClipping =           null,
     makePositioned =         null,
     positionedOffset =       null,
     undoAbsolute =           null,
     undoClipping =           null,
     undoPositioned =         null;
  })(Element.Methods);
