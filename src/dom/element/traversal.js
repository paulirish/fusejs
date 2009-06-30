  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  Fuse.addNS('Util');

  Fuse.addNS('Dom.Selector');

  (function(Selector) {
    Fuse.Util.$$ = Fuse.query = (function() {
      function query(selectors, context) {
        return Selector.select(selectors, $(context));
      }
      return query;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      this.childElements = function childElements(element, selectors) {
        if (!(element = $(element).firstChild)) return Fuse.List();
        while (element && element.nodeType !== 1) element = element.nextSibling;
        if (!element) return Fuse.List();

        selectors = selectors && selectors.length && selectors;
        return !selectors || selectors && Selector.match(element, selectors)
          ? prependList(Element.nextSiblings(element, selectors), element, Fuse.List())
          : Element.nextSiblings(element, selectors);
      };

      this.match = function match(element, selectors) {
        return Fuse.Object.isString(selectors)
          ? Selector.match($(element), selectors)
          : selectors.match($(element));
      };

      this.query = function query(element, selectors) {
        return Selector.select(selectors, $(element));
      };

      this.siblings = function siblings(element, selectors) {
        var results = Fuse.List(), original = element = $(element);
        element = element.parentNode && element.parentNode.firstChild;

        if (selectors && selectors.length) {
          var match = Selector.match;
          while (element) {
            if (element !== original && element.nodeType === 1 && match(element, selectors))
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

    /*------------------------------------------------------------------------*/

    (function() {
      this.descendants = (function() {
        var descendants = function descendants(element, selectors) {
          var node, i = 0, results = Fuse.List(), nodes = $(element).getElementsByTagName('*');
          if (selectors && selectors.length) {
            var match = Selector.match;
            while (node = nodes[i++])
              if (match(element, selectors))
                results.push(Element.extend(element));
          }
          else while (node = nodes[i]) results[i++] = Element.extend(node);
          return results;
        };

        if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
          descendants = function descendants(element, selectors) {
            var node, i = 0, results = Fuse.List(), nodes = $(element).getElementsByTagName('*');
            if (selectors && selectors.length) {
              var match = Selector.match;
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

      this.descendantOf = (function() {
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

      this.down = (function() {
        function _getNth(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (count++ === index) return Element.extend(node);
        }

        function _getNthBySelector(nodes, selectors, index) {
          var count = 0, i = 0, match = Selector.match;
          while (node = nodes[i++])
            if (match(node, selectors) && count++ === index)
              return Element.extend(node);
        }

        if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
          _getNth = function(nodes, index) {
            var count = 0, i = 0;
            while (node = nodes[i++])
              if (node.nodeType === 1 && count++ === index)
                return Element.extend(node);
          }

          _getNthBySelector = function(nodes, selectors, index) {
            var count = 0, i = 0, match = Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === 1 && match(node, selectors) && count++ === index)
                return Element.extend(node);
          }
        }

        function down(element, selectors, index) {
          if (arguments.length === 1) return Element.firstDescendant(element);
          if (Fuse.Object.isNumber(selectors)) {
            index = selectors; selectors = null;
          } else index = index || 0;

          var nodes = $(element).getElementsByTagName('*');
          return selectors && selectors.length
            ? _getNthBySelector(nodes, selectors, index)
            : _getNth(nodes, index);
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

    /*------------------------------------------------------------------------*/

    (function() {
      function _getNth(element, property, selectors, index) {
        element = $(element);
        var count = 0;

        if (Fuse.Object.isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        if (selectors && selectors.length) {
          var match = Selector.match;
          while (element = element[property])
            if (element.nodeType === 1 && match(element, selectors) && count++ === index)
              return Element.extend(element);
        } else {
          while (element = element[property])
            if (element.nodeType === 1 && count++ === index)
              return Element.extend(element);
        }
      }

      this.next = function next(element, selectors, index) {
        return _getNth(element, 'nextSibling', selectors, index);
      };

      this.previous = function previous(element, selectors, index) {
        return _getNth(element, 'previousSibling', selectors, index);
      };

      this.up = function up(element, selectors, index) {
        return arguments.length === 1
          ? Element.extend($(element).parentNode)
          : _getNth(element, 'parentNode', selectors, index);
      };

      // prevent JScript bug with named function expressions
      var next = null, previous = null, up = null;
    }).call(Element.Methods);

    /*------------------------------------------------------------------------*/

    (function() {
      function _collect(element, property, selectors) {
        element = $(element);
        var results = Fuse.List();
        if (selectors && selectors.length) {
          var match = Selector.match;
          while (element = element[property])
            if (element.nodeType === 1 && match(element, selectors))
              results.push(Element.extend(element));
        } else {
          while (element = element[property])
            if (element.nodeType === 1)
              results.push(Element.extend(element));
        }
        return results;
      }

      this.ancestors = function ancestors(element, selectors) {
        return _collect(element, 'parentNode', selectors);
      };

      this.nextSiblings = function nextSiblings(element, selectors) {
        return _collect(element, 'nextSibling', selectors);
      };

      this.previousSiblings = function previousSiblings(element, selectors) {
        return _collect(element, 'previousSibling', selectors);
      };

      // prevent JScript bug with named function expressions
      var ancestors = null, nextSiblings = null, previousSiblings = null;
    }).call(Element.Methods);

  })(Fuse.Dom.Selector);
