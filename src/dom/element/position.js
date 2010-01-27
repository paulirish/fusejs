  /*---------------------------- ELEMENT: POSITION ---------------------------*/

  (function(plugin) {

    var OFFSET_PARENT_EXIT_BEFORE_NODES = {
      'BODY': 1,
      'HTML': 1
    },

    OFFSET_PARENT_EXIT_ON_NODES = {
      'TABLE': 1,
      'TD':    1,
      'TH':    1
    },

    BODY_OFFSETS_INHERIT_ITS_MARGINS = nil,

    ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH = nil,

    getDimensions = plugin.getDimensions,

    getHeight     = plugin.getHeight,

    getWidth      = plugin.getWidth,

    getStyle      = plugin.getStyle,

    isDetached    = plugin.isDetached,

    isVisible     = plugin.isVisible;

    function ensureLayout(decorator) {
      var element = (decorator.raw || decorator),
       currStyle  = element.currentStyle,
       elemStyle  = element.style,
       zoom       = elemStyle.zoom;

      if (decorator.getStyle('position') == 'static' &&
          !(zoom && zoom !== 'normal' || currStyle && currStyle.hasLayout))
        elemStyle.zoom = 1;
      return element;
    }

    /*------------------------------------------------------------------------*/

    plugin.makeAbsolute = function makeAbsolute() {
      if (getStyle.call(this, 'position') != 'absolute') {
        var after,
         element   = this.raw || this,
         elemStyle = element.style,
         before    = getDimensions.call(this),
         width     = getWidth.call(this,  'content'),
         height    = getHeight.call(this, 'content'),
         offsets   = plugin.getPositionedOffset.call(this),
         backup    = Data[Node.getFuseId(this)].madeAbsolute = {
           'position':   elemStyle.position,
           'left':       elemStyle.left,
           'top':        elemStyle.top,
           'height':     elemStyle.height,
           'width':      elemStyle.width,
           'marginLeft': elemStyle.marginLeft,
           'marginTop':  elemStyle.marginTop
         };

        elemStyle.position  = 'absolute';
        elemStyle.marginTop = elemStyle.marginLeft = '0';
        elemStyle.top       = offsets.top   + 'px';
        elemStyle.left      = offsets.left  + 'px';
        elemStyle.width     = width         + 'px';
        elemStyle.height    = height        + 'px';

        after = getDimensions.call(this);
        elemStyle.width  = Math.max(0, width  + (before.width  - after.width))  + 'px';
        elemStyle.height = Math.max(0, height + (before.height - after.height)) + 'px';
      }
      return this;
    },

    plugin.undoAbsolute = function undoAbsolute() {
      if (getStyle.call(this, 'position') == 'absolute') {
        var element = this.raw || this,
         data = Data[Node.getFuseId(this)],
         backup = data.madeAbsolute,
         elemStyle = element.style;

        if (!backup)
          throw new Error('Element#makeAbsolute must be called first.');

        elemStyle.position   = backup.position;
        elemStyle.left       = backup.left;
        elemStyle.top        = backup.top;
        elemStyle.height     = backup.width;
        elemStyle.width      = backup.height;
        elemStyle.marginLeft = backup.marginLeft;
        elemStyle.marginTop  = backup.marginTop;

        delete data.madeAbsolute;
      }
      return this;
    };

    plugin.makeClipping = function makeClipping() {
      if (getStyle.call(this, 'overflow') != 'hidden') {
        var element = this.raw || this;
        Data[Node.getFuseId(this)].madeClipped = getStyle.call(this, 'overflow') || 'auto';
        element.style.overflow = 'hidden';
      }
      return this;
    };

    plugin.undoClipping = function undoClipping() {
      if (getStyle.call(this, 'overflow') == 'hidden') {
        var element = this.raw || this,
         data = Data[Node.getFuseId(this)],
         overflow = data.madeClipped;

        if (!overflow)
          throw new Error('Element#makeClipping must be called first.');

        element.style.overflow = overflow == 'auto' ? '' : overflow;
        delete data.madeClipped;
      }
      return this;
    };

    plugin.makePositioned = function makePositioned() {
      var element = this.raw || this,
       elemStyle = element.style,
       pos = getStyle.call(this, 'position');

      if (!pos || pos == 'static') {
        Data[Node.getFuseId(this)].madePositioned = {
          'position': elemStyle.position,
          'left':     elemStyle.left,
          'top':      elemStyle.top
        };

        // Opera returns the offset relative to the positioning context, when an
        // element is position relative but top and left have not been defined
        elemStyle.top = elemStyle.left = '0';
        elemStyle.position = 'relative';
      }
      return this;
    };

    plugin.undoPositioned = function undoPositioned() {
      if (getStyle.call(this, 'position') == 'relative') {
        var element = this.raw || this,
        data = Data[Node.getFuseId(this)],
        backup = data.madePositioned,
        elemStyle = element.style;

        if (!backup)
          throw new Error('Element#makePositioned must be called first.');

        elemStyle.position = backup.position;
        elemStyle.top      = backup.top;
        elemStyle.left     = backup.left;

        delete data.madePositioned;
      }
      return this;
    };

    plugin.clonePosition = function clonePosition(source, options) {
      source  = fuse.get(source);
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
       appendCSS           = ';display:block;visibility:hidden;',
       getCumulativeOffset = plugin.getCumulativeOffset,
       elemStyle           = this.style,
       srcStyle            = source.style,
       elemIsHidden        = !isVisible.call(this),
       srcIsHidden         = !isVisible.call(source),
       srcElement          = source.raw || source;

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
        paddingHeight = getHeight.call(source, 'padding');
        borderHeight  = getHeight.call(source, 'border');
        elemStyle.height = Math.max(0,
          (srcElement.offsetHeight - paddingHeight - borderHeight) + // content height
          (paddingHeight - getHeight.call(this, 'padding')) +        // padding diff
          (borderHeight  - getHeight.call(this, 'border'))) + 'px';  // border diff
      }

      if (options.setWidth) {
        paddingWidth = getWidth.call(source, 'padding');
        borderWidth  = getWidth.call(source, 'border');
        elemStyle.width = Math.max(0,
          (srcElement.offsetWidth - paddingWidth - borderWidth)  + // content width
          (paddingWidth - getWidth.call(this, 'padding')) +        // padding diff
          (borderWidth  - getWidth.call(this, 'border'))) + 'px';  // border diff
      }

      if (options.setLeft || options.setTop) {

        elemPos = getStyle.call(this, 'position');

        // clear element coords before getting
        // the getCumulativeOffset because Opera
        // will fumble the calculations if
        // you try to subtract the coords after
        if (options.setLeft) elemStyle.left = elemStyle.marginLeft = '0';
        if (options.setTop)  elemStyle.top  = elemStyle.marginTop  = '0';

        // if an absolute element is a descendant of the source then
        // calculate its offset to the source and inverse it
        if (elemPos == 'absolute' && plugin.contains.call(source, this)) {
          coord = getCumulativeOffset.call(this, source);
          coord.left *= -1;
          coord.top  *= -1;
        }
        else {
          coord = getCumulativeOffset.call(source);
          if (elemPos == 'relative') {
            // subtract the relative element's offset from the source's offsets
            elemOffset  = getCumulativeOffset.call(this);
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

      return this;
    };

    // Follows spec http://www.w3.org/TR/cssom-view/#offset-attributes
    plugin.getOffsetParent = function getOffsetParent() {
      var element = this.raw || this,
       original   = element,
       nodeName   = getNodeName(element);

      if (nodeName === 'AREA')
        return fromElement(element.parentNode);

      // IE throws an error if the element is not in the document.
      // Many browsers report offsetParent as null if the element's
      // style is display:none.
      if (isDetached.call(this) || element.nodeType === DOCUMENT_NODE ||
          OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName] ||
          !element.offsetParent && getStyle.call(this, 'display') != 'none')
        return null;

      while (element = element.parentNode) {
        nodeName = getNodeName(element);
        if (OFFSET_PARENT_EXIT_BEFORE_NODES[nodeName]) break;
        if (OFFSET_PARENT_EXIT_ON_NODES[nodeName] ||
            getStyle.call(element, 'position') != 'static')
          return fromElement(element);
      }
      return fromElement(getDocument(original).body);
    };

    // TODO: overhaul with a thorough solution for finding the correct
    // offsetLeft and offsetTop values
    plugin.getCumulativeOffset = (function() {

      function getCumulativeOffset(ancestor) {
        ancestor = fuse.get(ancestor);
        var backup, elemStyle, result;
        if (!isElement(ancestor)) ancestor = null;

        ensureLayout(this);

        // offsetLeft/offsetTop properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!plugin.isVisible.call(this)) {
          elemStyle  = this.style;
          backup     = this.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';
          result     = getOffset(this, ancestor);
          elemStyle.cssText  = backup;
        }
        else result = getOffset(this, ancestor);

        return result;
      }

      var getOffset = function(element, ancestor) {
        var offsetParent, position, raw, valueT = 0, valueL = 0;
        if (BODY_OFFSETS_INHERIT_ITS_MARGINS === null)
          BODY_OFFSETS_INHERIT_ITS_MARGINS = envTest('BODY_OFFSETS_INHERIT_ITS_MARGINS');

        if (ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH === null)
          ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH =
            envTest('ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH');

        do {
          raw = element.raw || element;
          valueT += raw.offsetTop  || 0;
          valueL += raw.offsetLeft || 0;

          offsetParent = plugin.getOffsetParent.call(element);
          position     = getStyle.call(element, 'position');

          if (offsetParent && ELEMENT_COORD_OFFSETS_DONT_INHERIT_ANCESTOR_BORDER_WIDTH) {
            valueT += parseFloat(getStyle.call(offsetParent, 'borderTopWidth'))  || 0;
            valueL += parseFloat(getStyle.call(offsetParent, 'borderLeftWidth')) || 0;
          }
          if (position == 'fixed' || offsetParent && (offsetParent === ancestor ||
             (BODY_OFFSETS_INHERIT_ITS_MARGINS && position == 'absolute' &&
              getNodeName(offsetParent) === 'BODY'))) {
            break;
          }
        } while (element = offsetParent);

        return returnOffset(valueL, valueT);
      };

      if (envTest('ELEMENT_BOUNDING_CLIENT_RECT'))
        getOffset = (function(__getOffset) {
          return function(element, ancestor) {
            var doc, info, rect, raw, root, scrollEl, valueT, valueL;

            if (ancestor)
              return __getOffset(element, ancestor);

            if (!isDetached.call(element)) {
              raw      = element.raw || element;
              doc      = getDocument(raw);
              info     = fuse._info;
              rect     = raw.getBoundingClientRect();
              root     = doc[info.root.property];
              scrollEl = doc[info.scrollEl.property];

              valueT = Math.round(rect.top)  -
                (root.clientTop  || 0) + (scrollEl.scrollTop  || 0);
              valueL = Math.round(rect.left) -
                (root.clientLeft || 0) + (scrollEl.scrollLeft || 0);
            }
            return returnOffset(valueL, valueT);
          };
        })(getOffset);

      return getCumulativeOffset;
    })();

    plugin.getCumulativeScrollOffset = function getCumulativeScrollOffset(onlyAncestors) {
      var nodeName,
       element  = this.raw || this,
       original = element,
       info     = fuse._info,
       doc      = getDocument(element),
       scrollEl = doc[info.scrollEl.property],
       skipEl   = doc[info[info.scrollEl.nodeName === 'HTML' ? 'body' : 'docEl'].property],
       valueT   = 0,
       valueL   = 0;

       do {
        if (element !== skipEl) {
          valueT += element.scrollTop  || 0;
          valueL += element.scrollLeft || 0;

          if (element === scrollEl || getStyle.call(element, 'position') == 'fixed')
            break;
        }
        element = element.parentNode;
      } while (element && element.nodeType === ELEMENT_NODE);

      if (onlyAncestors || ((nodeName = getNodeName(original)) &&
          nodeName === 'TEXTAREA' || nodeName === 'INPUT')) {
        valueT -= original.scrollTop  || 0;
        valueL -= original.scrollLeft || 0;
      }

      return returnOffset(valueL, valueT);
    };

    plugin.getPositionedOffset = function getPositionedOffset() {
      var element = ensureLayout(this),
       valueT = 0, valueL = 0;

      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = fromElement(element).getOffsetParent();
      } while (element && getNodeName(element.raw) !== 'BODY' &&
          element.getStyle('position') == 'static');

      return returnOffset(valueL, valueT);
    },

    plugin.getViewportOffset = (function() {
      var getViewportOffset = function getViewportOffset() {
        var offset = plugin.getCumulativeOffset.call(this),
         scrollOffset = plugin.getCumulativeScrollOffset.call(this, /*onlyAncestors*/ true),
         valueT = offset.top,
         valueL = offset.left;

        // subtract the the scrollOffset totals from the element offset totals.
        valueT -= scrollOffset.top;
        valueL -= scrollOffset.left;
        return returnOffset(valueL, valueT);
      };

      if (envTest('ELEMENT_BOUNDING_CLIENT_RECT')) {
        getViewportOffset = function getViewportOffset() {
          var valueT = 0, valueL = 0;

          if (!isDetached.call(this)) {
            // IE window's upper-left is at 2,2 (pixels) with respect
            // to the true client when not in quirks mode.
            var element = this.raw || this,
             doc  = getDocument(element),
             rect = element.getBoundingClientRect(),
             root = doc[fuse._info.root.property];

            valueT = Math.round(rect.top)  - (root.clientTop  || 0);
            valueL = Math.round(rect.left) - (root.clientLeft || 0);
          }
          return returnOffset(valueL, valueT);
        };
      }

      return getViewportOffset;
    })();

    plugin.scrollTo = function scrollTo() {
      var pos = plugin.getCumulativeOffset.call(this);
      global.scrollTo(pos[0], pos[1]);
      return this;
    };

    // prevent JScript bug with named function expressions
    var makeAbsolute =           nil,
     clonePosition =             nil,
     getCumulativeScrollOffset = nil,
     getOffsetParent =           nil,
     getPositionedOffset =       nil,
     makeClipping =              nil,
     makePositioned =            nil,
     scrollTo =                  nil,
     undoAbsolute =              nil,
     undoClipping =              nil,
     undoPositioned =            nil;
  })(Element.plugin);
