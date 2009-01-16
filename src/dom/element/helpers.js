  /*---------------------------- ELEMENT: HELPERS ----------------------------*/

  Object.extend(Element, (function() {
    function returnOffset(left, top) {
      var result  = [left, top];
      result.left = left;
      result.top  = top;
      return result;
    }

    function getCssDimensions(element) {
      return { 'width': Element._getCssWidth(element), 'height': Element._getCssHeight(element) };
    }

    function getRealOffsetParent(element) {
      return (typeof element.offsetParent !== 'object' || !element.offsetParent) ? null :
       element.offsetParent.tagName.toUpperCase() === 'HTML' ?
         element.offsetParent : Element.getOffsetParent(element);
    }

    function hasLayout(element) {
      var currentStyle = element.currentStyle;
      return (currentStyle && currentStyle.hasLayout) ||
       (!currentStyle && element.style.zoom && element.style.zoom !== 'normal')
    }

    function ensureLayout(element) {
      element = $(element);
      if (Element.getStyle(element, 'position') === 'static' &&
        !Element._hasLayout(element)) element.style.zoom = 1;
      return element;
    }

    var getContentFromAnonymousElement = (function() {
      var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY = Bug('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY');

      function getCache(ownerDoc) {
        if (ownerDoc === doc)
          return getCache.cache[0];
        var id = ownerDoc.frameID;
        if (!id) {
          id = getCache.id++;
          ownerDoc.frameID = id;
          getCache.cache[id] = {
            node: ownerDoc.createElement('div'),
            fragment: ownerDoc.createDocumentFragment()
          };
        }
        return getCache.cache[id];
      }
      getCache.id = 1;
      getCache.cache = { };
      getCache.cache[0] = { node: dummy, fragment: doc.createDocumentFragment() };

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

      return function(ownerDoc, tagName, html) {
        var cache = getCache(ownerDoc), node = cache.node,
         t = Element._insertionTranslations.tags[tagName];
        if (t) {
          node.innerHTML= t[0] + html + t[1];
          t[2].times(function() { node = node.firstChild });
        } else node.innerHTML = html;

        // skip auto-inserted tbody
        if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
            tagName === 'TABLE' && /[^<]*<tr/i.test(html)) {
          node = node.firstChild;
        }
        return getContentAsFragment(cache, node);
      }
    })();

    return {
      '_ensureLayout':                   ensureLayout,
      '_getContentFromAnonymousElement': getContentFromAnonymousElement,
      '_getCssDimensions':               getCssDimensions,
      '_getRealOffsetParent':            getRealOffsetParent,
      '_hasLayout':                      hasLayout,
      '_returnOffset':                   returnOffset
    };
  })());

  // define Element._getCssWidth() and Element._getCssHeight()
  (function() {
    var Subtract = {
      Width:  $w('borderLeftWidth paddingLeft borderRightWidth paddingRight'),
      Height: $w('borderTopWidth paddingTop borderBottomWidth paddingBottom')
    };

    $w('Width Height')._each(function(D) {
      Element['_getCss' + D] = function(element) {
        return Math.max(0, Subtract[D].inject(Element['get' + D](element), function(value, styleName) {
          return value -= parseFloat(Element.getStyle(element, styleName)) || 0;
        }));
      };
    });
  })();

  /*--------------------------------------------------------------------------*/

  Object.extend(Element._insertionTranslations = { }, (function() {
    function before(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element);
    }

    function top(element, node) {
      element.insertBefore(node, element.firstChild);
    }

    function bottom(element, node) {
      element.appendChild(node);
    }

    function after(element, node) {
      element.parentNode &&
        element.parentNode.insertBefore(node, element.nextSibling);
    }

    return {
      'after':  after,
      'before': before,
      'bottom': bottom,
      'top':    top,
      'tags': {
        'COLGROUP': ['<table><colgroup>',      '</colgroup><tbody></tbody></table>', 2],
        'SELECT':   ['<select>',               '</select>',                          1],
        'TABLE':    ['<table>',                '</table>',                           1],
        'TBODY':    ['<table><tbody>',         '</tbody></table>',                   2],
        'TR':       ['<table><tbody><tr>',     '</tr></tbody></table>',              3],
        'TD':       ['<table><tbody><tr><td>', '</td></tr></tbody></table>',         4]
      }
    };
  })());

  (function() {
    Object.extend(this.tags, {
      // TODO: Opera fails to render optgroups when set with innerHTML
      'OPTGROUP': this.tags.SELECT,
      'TFOOT':    this.tags.TBODY,
      'TH':       this.tags.TD,
      'THEAD':    this.tags.TBODY
    });
  }).call(Element._insertionTranslations);
