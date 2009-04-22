  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  Fuse.query = (function() {
    function query(selector, context) {
      return Fuse.Dom.Selector.select(selector, $(context));
    }
    return query;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    this.childElements = function childElements(element, selector) {
      if (!(element = $(element).firstChild)) return Fuse.List();
      while (element && element.nodeType !== 1) element = element.nextSibling;
      if (!element) return Fuse.List();
      return !selector || selector && Fuse.Dom.Selector.match(element, selector)
        ? prependList(Element.nextSiblings(element, selector), element)
        : Element.nextSiblings(element, selector);
    };

    this.match = function match(element, selector) {
      return Fuse.Dom.Selector.match($(element), selector);
    };

    this.query = function query(element, selector) {
      return Fuse.Dom.Selector.select(selector, $(element));
    };

    this.siblings = function siblings(element, selector) {
      var results = Fuse.List(), original = element = $(element);
      element = element.parentNode && element.firstChild;
      if (selector) {
        var match = Fuse.Dom.Selector.match;
        while (element) {
          if (element !== original && element.nodeType === 1 && match(element, selector))
            results.push(Element.extend(element));
          element = element.nextSibling;
        }
      } else {
        while (element) {
          if (element !== original && element.nodeType === 1)
            results.push(Element.extend(element));
          element = element.nextSibling;
        }
      }
      return results;
    };

    // prevent JScript bug with named function expressions
    var childElements = null, match = null, query = null, siblings = null;
  }).call(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function() {
    this.descendants = (function() {
      var descendants = function descendants(element, selector) {
        var node, i = 0, results = Fuse.List(), nodes = $(element).getElementsByTagName('*');
        if (selector) {
          var match = Fuse.Dom.Selector.match;
          while (node = nodes[i++])
            if (match(element, selector))
              results.push(Element.extend(element));
        }
        else while (node = nodes[i]) results[i++] = Element.extend(node);
        return results;
      };

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        descendants = function descendants(element, selector) {
          var node, i = 0, results = Fuse.List(), nodes = $(element).getElementsByTagName('*');
          if (selector) {
            var match = Fuse.Dom.Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === 1 && match(element, selector))
                results.push(Element.extend(node));
          } else {
            while (node = nodes[i++])
              if (node.nodeType === 1)
                results.push(Element.extend(node));
          }
          return results;
        };
      }
      return descendants;
    })();

    this.descendantOf = (function() {
      var descendantOf = function descendantOf(element, ancestor) {
       element = $(element); ancestor = $(ancestor);
        while (element = element.parentNode)
          if (element === ancestor) return true;
        return false;
      };

      if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        descendantOf = function descendantOf(element, ancestor) {
          element = $(element); ancestor = $(ancestor);
          return (element.compareDocumentPosition(ancestor) & 8) === 8;
        };
      }
      else if (Feature('ELEMENT_CONTAINS')) {
        var _descendantOf = descendantOf;
        descendantOf = function descendantOf(element, ancestor) {
          if (ancestor.nodeType !== 1) return _descendantOf(element, ancestor);
          element = $(element); ancestor = $(ancestor);
          return ancestor.contains(element) && ancestor !== element;
        };
      }
      return descendantOf;
    })();

    this.down = (function() {
      function _getNth(nodes, index) {
        var count = 0, i = 0;
        while (node = nodes[i++])
          if (count++ === index) return Element.extend(node);
      }

      function _getNthBySelector(nodes, selector, index) {
        var count = 0, i = 0, match = Fuse.Dom.Selector.match;
        while (node = nodes[i++])
          if (match(node, selector) && count++ === index)
            return Element.extend(node);
      }

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        _getNth = function(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (node.nodeType === 1 && count++ === index)
              return Element.extend(node);
        }

        _getNthBySelector = function(nodes, selector, index) {
          var count = 0, i = 0, match = Fuse.Dom.Selector.match;
          while (node = nodes[i++])
            if (node.nodeType === 1 && match(node, selector) && count++ === index)
              return Element.extend(node);
        }
      }

      function down(element, selector, index) {
        if (arguments.length === 1) return Element.firstDescendant(element);
        if (Fuse.Object.isNumber(selector)) {
          index = selector; selector = null;
        } else index = index || 0;

        var nodes = $(element).getElementsByTagName('*');
        return selector ? _getNthBySelector(nodes, selector, index) : _getNth(nodes, index);
      }
      return down;
    })();

    this.firstDescendant = function firstDescendant(element) {
      element = $(element).firstChild;
      while (element && element.nodeType !== 1) element = element.nextSibling;
      return Element.extend(element);
    };

    // prevent JScript bug with named function expressions
    var firstDescendant = null;
  }).call(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _getNth(element, property, selector, index) {
      element = $(element);
      var count = 0;

      if (Fuse.Object.isNumber(selector)) {
        index = selector; selector = null;
      } else index = index || 0;

      if (selector) {
        var match = Fuse.Dom.Selector.match;
        while (element = element[property])
          if (element.nodeType === 1 && match(element, selector) && count++ === index)
            return Element.extend(element);
      } else {
        while (element = element[property])
          if (element.nodeType === 1 && count++ === index)
            return Element.extend(element);
      }
    }

    this.next = function next(element, selector, index) {
      return _getNth(element, 'nextSibling', selector, index);
    };

    this.previous = function previous(element, selector, index) {
      return _getNth(element, 'previousSibling', selector, index);   
    };

    this.up = function up(element, selector, index) {
      return arguments.length === 1
        ? Element.extend($(element).parentNode)
        : _getNth(element, 'parentNode', selector, index);
    };

    // prevent JScript bug with named function expressions
    var next = null, previous = null, up = null;
  }).call(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function() {
    function _collect(element, property, selector) {
      element = $(element);
      var results = Fuse.List();
      if (selector) {
        var match = Fuse.Dom.Selector.match;
        while (element = element[property])
          if (element.nodeType === 1 && match(element, selector))
            results.push(Element.extend(element));
      } else {
        while (element = element[property])
          if (element.nodeType === 1)
            results.push(Element.extend(element));
      }
      return results;
    }

    this.ancestors = function ancestors(element, selector) {
      return _collect(element, 'parentNode', selector);
    };

    this.nextSiblings = function nextSiblings(element, selector) {
      return _collect(element, 'nextSibling', selector);
    };

    this.previousSiblings = function previousSiblings(element, selector) {
      return _collect(element, 'previousSibling', selector);
    };

    // prevent JScript bug with named function expressions
    var ancestors = null, nextSiblings = null, previousSiblings = null;
  }).call(Element.Methods);
