  /*---------------------------- ELEMENT: HELPERS ----------------------------*/

  (function() {
    Element._returnOffset = function _returnOffset(left, top) {
      var result  = Fuse.List(Fuse.Number(left), Fuse.Number(top));
      result.left = result[0];
      result.top  = result[1];
      return result;
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
      var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
        Bug('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY'),

      cache = {
        '0': { 'node': Fuse._div, 'fragment': Fuse._doc.createDocumentFragment() }
      },

      getContentAsFragment = (function() {
        if (Feature('ELEMENT_REMOVE_NODE'))
          return function(cache, container) {
            // removeNode: removes the parent but keeps the children
            cache.fragment.appendChild(container).removeNode();
            return cache.fragment;
          };

        if (Feature('DOCUMENT_RANGE'))
          return function(cache, container) {
            cache.range = cache.range || cache.node.ownerDocument.createRange();
            cache.range.selectNodeContents(container);
            var extracted = cache.range.extractContents();
            return extracted || cache.fragment;
          };

        return function(cache, container) {
          var length = container.childNodes.length;
          while (length--)
            cache.fragment.insertBefore(container.childNodes[length], cache.fragment.firstChild);
          return cache.fragment;
        };
      })();

      function getCache(ownerDoc) {
        if (ownerDoc === Fuse._doc) return cache['0'];

        // TODO: This is a perfect example of when Element#getUniqueID could be used
        var id = Event.getEventID(getWindow(ownerDoc).frameElement);
        cache[id] = cache[id] || {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment()
        };
        return cache[id];
      }

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
    var _ensureLayout = null, _hasLayout = null, _returnOffset = null;
  })();
