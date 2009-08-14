  /*---------------------------- ELEMENT: HELPERS ----------------------------*/

  (function() {
    Element._returnOffset = function _returnOffset(left, top) {
      var result  = Fuse.List(Fuse.Number(left), Fuse.Number(top));
      result.left = result[0];
      result.top  = result[1];
      return result;
    };

    Element._getCssDimensions = function _getCssDimensions(element) {
      return { 'width': Element._getCssWidth(element), 'height': Element._getCssHeight(element) };
    };

    Element._hasLayout = function _hasLayout(element) {
      var currentStyle = element.currentStyle;
      return element.style.zoom && element.style.zoom !== 'normal' ||
        currentStyle && currentStyle.hasLayout;
    };

    Element._ensureLayout = function _ensureLayout(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') == 'static' &&
        !Element._hasLayout(element)) element.style.zoom = 1;
      return element;
    };

    Element._getFragmentFromString = (function() {
      function getCache(ownerDoc) {
        if (ownerDoc === Fuse._doc)
          return getCache.cache[0];
        // TODO: This is a perfect example of when Element#getUniqueID could be used
        var id = Event.getEventID(getWindow(ownerDoc).frameElement);
        getCache.cache[id] = getCache.cache[id] || {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment()
        };
        return getCache.cache[id];
      }
      getCache.cache = { };
      getCache.cache[0] = { 'node': Fuse._div, 'fragment': Fuse._doc.createDocumentFragment() };

      var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
        Bug('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY');

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
            var extracted = cache.range.extractContents();
            return extracted || cache.fragment;
          };
        }
        return function(cache, container) {
          var length = container.childNodes.length;
          while (length--)
            cache.fragment.insertBefore(container.childNodes[length], cache.fragment.firstChild);
          return cache.fragment;
        };
      })();

      function _getFragmentFromString(ownerDoc, nodeName, html) {
        var cache = getCache(ownerDoc), node = cache.node,
         t = Element._insertionTranslations.tags[nodeName];
        if (t) {
          var times = t[2];
          node.innerHTML= t[0] + html + t[1];
          while (times--) node = node.firstChild;
        } else node.innerHTML = html;

        // skip auto-inserted tbody
        if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
            nodeName === 'TABLE' && /[^<]*<tr/i.test(html)) {
          node = node.firstChild;
        }
        return getContentAsFragment(cache, node);
      }

      return _getFragmentFromString;
    })();

    // prevent JScript bug with named function expressions
    var _ensureLayout =  null,
     _getCssDimensions = null,
     _hasLayout =        null,
     _returnOffset =     null;
  })();

  // define Element._getCssHeight(), Element._getCssWidth(),
  // Element._getBorderHeight(), Element._getBorderWidth(),
  // Element._getPaddingHeight(), Element._getPaddingWidth()
  (function() {
    function getAsNumber(element, style) {
      return parseFloat(Element.getStyle(element, style)) || 0;
    }

    Fuse.Util.$w('width height')._each(function(d) {
      var D = Fuse.String(d).capitalize(),
       pos = d == 'width' ? ['Left', 'Right'] : ['Top', 'Bottom'];

      Element['_getBorder' + D] = (function() {
        var a = 'border' + pos[0] + 'Width', b = 'border' + pos[1] + 'Width';
        return function(element) {
          return getAsNumber(element, a) + getAsNumber(element, b);
        };
      })();

      Element['_getPadding' + D] = (function() {
        var a = 'padding' + pos[0], b = 'padding' + pos[1];
        return function(element) {
          return getAsNumber(element, a) + getAsNumber(element, b);
        };
      })();

      Element['_getCss' + D] = (function() {
        var a = 'get' + D, b = '_getBorder' + D, c = '_getPadding' + D;
        return function(element) {
          return Math.max(0, Element[a](element) -
            Element[b](element) - Element[c](element));
        };
      })();
    });
  })();
