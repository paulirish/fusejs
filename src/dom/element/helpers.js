  /*---------------------------- ELEMENT: HELPERS ----------------------------*/

  (function() {
    this._returnOffset = function _returnOffset(left, top) {
      var result  = [left, top];
      result.left = left;
      result.top  = top;
      return result;
    };

    this._getCssDimensions = function _getCssDimensions(element) {
      return { 'width': Element._getCssWidth(element), 'height': Element._getCssHeight(element) };
    };

    this._getRealOffsetParent = function _getRealOffsetParent(element) {
      return (typeof element.offsetParent !== 'object' || !element.offsetParent) ? null :
       getNodeName(element.offsetParent) === 'HTML' ?
         element.offsetParent : Element.getOffsetParent(element);
    };

    this._hasLayout = function _hasLayout(element) {
      var currentStyle = element.currentStyle;
      return element.style.zoom && element.style.zoom !== 'normal' ||
        currentStyle && currentStyle.hasLayout;
    };

    this._ensureLayout = function _ensureLayout(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'static' &&
        !Element._hasLayout(element)) element.style.zoom = 1;
      return element;
    };

    this._getContentFromAnonymousElement = (function() {
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
            extracted && cache.fragment.appendChild(extracted);
            return cache.fragment;
          };
        }
        return function(cache, container) {
          var length = container.childNodes.length;
          while (length--)
            cache.fragment.insertBefore(container.childNodes[length], cache.fragment.firstChild);
          return cache.fragment;
        };
      })();

      function _getContentFromAnonymousElement(ownerDoc, nodeName, html) {
        var cache = getCache(ownerDoc), node = cache.node,
         t = Element._insertionTranslations.tags[nodeName];
        if (t) {
          node.innerHTML= t[0] + html + t[1];
          t[2].times(function() { node = node.firstChild });
        } else node.innerHTML = html;

        // skip auto-inserted tbody
        if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
            nodeName === 'TABLE' && /[^<]*<tr/i.test(html)) {
          node = node.firstChild;
        }
        return getContentAsFragment(cache, node);
      }
      
      return _getContentFromAnonymousElement;
    })();

    // prevent JScript bug with named function expressions
    var _ensureLayout =     null,
     _getCssDimensions =    null,
     _getRealOffsetParent = null,
     _hasLayout =           null, 
     _returnOffset =        null;
  }).call(Element);

  // define Element._getCssWidth() and Element._getCssHeight()
  (function() {
    var Subtract = {
      'Width':  $w('borderLeftWidth paddingLeft borderRightWidth paddingRight'),
      'Height': $w('borderTopWidth paddingTop borderBottomWidth paddingBottom')
    };

    $w('Width Height')._each(function(D) {
      Element['_getCss' + D] = function(element) {
        return Math.max(0, Subtract[D].inject(Element['get' + D](element), function(value, styleName) {
          return value -= parseFloat(Element.getStyle(element, styleName)) || 0;
        }));
      };
    });
  })();
