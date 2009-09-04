  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function(methods, Selector) {

    (function() {
      methods.childElements = function childElements(element, selectors) {
        if (!(element = $(element).firstChild)) return Fuse.List();
        while (element && element.nodeType !== 1) element = element.nextSibling;
        if (!element) return Fuse.List();

        selectors = selectors && selectors.length && selectors;
        return !selectors || selectors && Selector.match(element, selectors)
          ? prependList(Element.nextSiblings(element, selectors), element, Fuse.List())
          : Element.nextSiblings(element, selectors);
      };

      methods.match = function match(element, selectors) {
        return isString(selectors)
          ? Selector.match($(element), selectors)
          : selectors.match($(element));
      };

      methods.query = function query(element, selectors) {
        return Selector.select(selectors, $(element));
      };

      methods.siblings = function siblings(element, selectors) {
        var match, i = 0, original = element = $(element), results = Fuse.List();
        if (element = element.parentNode && element.parentNode.firstChild) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && element !== original && match(element, selectors))
                results[i++] = Element.extend(element);
            } while (element = element.nextSibling);
          } else {
            do {
              if (element.nodeType === 1 && element !== original)
                results[i++] = Element.extend(element);
            } while (element = element.nextSibling);
          }
        }
        return results;
      };

      // prevent JScript bug with named function expressions
      var childElements = null, match = null, query = null, siblings = null;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      methods.descendants = (function() {
        var descendants = function descendants(element, selectors) {
          var match, node, i = 0, results = Fuse.List(),
           nodes = $(element).getElementsByTagName('*');

          if (selectors && selectors.length) {
            match = Selector.match;
            while (node = nodes[i++])
              if (match(element, selectors))
                results.push(Element.extend(element));
          }
          else while (node = nodes[i]) results[i++] = Element.extend(node);
          return results;
        };

        if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
          descendants = function descendants(element, selectors) {
            var match, node, i = 0, results = Fuse.List(),
             nodes = $(element).getElementsByTagName('*');

            if (selectors && selectors.length) {
              match = Selector.match;
              while (node = nodes[i++])
                if (node.nodeType === 1 && match(element, selectors))
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

      methods.descendantOf = (function() {
        var descendantOf = function descendantOf(element, ancestor) {
         element = $(element); ancestor = $(ancestor);
          while (element = element.parentNode)
            if (element === ancestor) return true;
          return false;
        };

        if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
          descendantOf = function descendantOf(element, ancestor) {
            /* DOCUMENT_POSITION_CONTAINS = 0x08 */
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

      methods.down = (function() {
        function getNth(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (count++ === index) return Element.extend(node);
        }

        function getNthBySelector(nodes, selectors, index) {
          var count = 0, i = 0, match = Selector.match;
          while (node = nodes[i++])
            if (match(node, selectors) && count++ === index)
              return Element.extend(node);
        }

        if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
          getNth = function(nodes, index) {
            var count = 0, i = 0;
            while (node = nodes[i++])
              if (node.nodeType === 1 && count++ === index)
                return Element.extend(node);
          };

          getNthBySelector = function(nodes, selectors, index) {
            var count = 0, i = 0, match = Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === 1 && match(node, selectors) && count++ === index)
                return Element.extend(node);
          };
        }

        function down(element, selectors, index) {
          if (arguments.length === 1) return Element.firstDescendant(element);
          if (isNumber(selectors)) {
            index = selectors; selectors = null;
          } else index = index || 0;

          var nodes = $(element).getElementsByTagName('*');
          return selectors && selectors.length
            ? getNthBySelector(nodes, selectors, index)
            : getNth(nodes, index);
        }
        return down;
      })();

      methods.firstDescendant = function firstDescendant(element) {
        element = $(element).firstChild;
        while (element && element.nodeType !== 1) element = element.nextSibling;
        return Element.extend(element);
      };

      // prevent JScript bug with named function expressions
      var firstDescendant = null;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function getNth(element, property, selectors, index) {
        element = $(element);
        var match, count = 0;

        if (isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && match(element, selectors) && count++ === index)
                return Element.extend(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === 1 && count++ === index)
                return Element.extend(element);
            } while (element = element[property]);
          }
        }
      }

      methods.next = function next(element, selectors, index) {
        return getNth(element, 'nextSibling', selectors, index);
      };

      methods.previous = function previous(element, selectors, index) {
        return getNth(element, 'previousSibling', selectors, index);
      };

      methods.up = function up(element, selectors, index) {
        return arguments.length === 1
          ? Element.extend($(element).parentNode)
          : getNth(element, 'parentNode', selectors, index);
      };

      // prevent JScript bug with named function expressions
      var next = null, previous = null, up = null;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function collect(element, property, selectors) {
        element = $(element);
        var match, i = 0, results = Fuse.List();
        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && match(element, selectors))
                results[i++] = Element.extend(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === 1)
                results[i++] = Element.extend(element);
            } while (element = element[property]);
          }
        }
        return results;
      }

      methods.ancestors = function ancestors(element, selectors) {
        return collect(element, 'parentNode', selectors);
      };

      methods.nextSiblings = function nextSiblings(element, selectors) {
        return collect(element, 'nextSibling', selectors);
      };

      methods.previousSiblings = function previousSiblings(element, selectors) {
        return collect(element, 'previousSibling', selectors);
      };

      // prevent JScript bug with named function expressions
      var ancestors = null, nextSiblings = null, previousSiblings = null;
    })();

  })(Element.Methods, Fuse.Dom.Selector);
