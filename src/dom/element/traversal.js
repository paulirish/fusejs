  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function(plugin, Selector) {

    // support W3C ElementTraversal interface
    var firstNode = 'firstChild',
     nextNode     = 'nextSibling',
     prevNode     = 'previousSibling',
     firstElement = 'firstElementChild',
     nextElement  = 'nextElementSibling',
     prevElement  = 'previousElementSibling';

    if (isHostObject(Fuse._docEl, nextElement) &&
        isHostObject(Fuse._docEl, prevElement)) {
      firstNode = firstElement;
      nextNode  = nextElement;
      prevNode  = prevElement;
    }

    (function() {
      plugin.childElements = function childElements(selectors) {
        var nextSiblings, element = this.raw || this;
        if (!element[firstNode]) return NodeList();

        while (element && element.nodeType !== 1) element = element[nextNode];
        if (!element) return NodeList();

        nextSiblings = this.nextSiblings;
        return !selectors || !selectors.length ||
            selectors && Selector.match(this, selectors)
          ? prependList(nextSiblings.call(element, selectors), this, NodeList())
          : nextSiblings.call(element, selectors);
      };

      plugin.match = function match(selectors) {
        return isString(selectors)
          ? Selector.match(this, selectors)
          : selectors.match(this);
      };

      plugin.query = function query(selectors) {
        return Selector.select(selectors, this);
      };

      plugin.siblings = function siblings(selectors) {
        var match, element = this.raw || this, i = 0,
         original = element, results = NodeList();

        if (element = element.parentNode && element.parentNode[firstNode]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && element !== original && match(element, selectors))
                results[i++] = decorate(element);
            } while (element = element[nextNode]);
          } else {
            do {
              if (element.nodeType === 1 && element !== original)
                results[i++] = decorate(element);
            } while (element = element[nextNode]);
          }
        }
        return results;
      };

      // prevent JScript bug with named function expressions
      var childElements = nil, match = nil, query = nil, siblings = nil;
    })();

    /*------------------------------------------------------------------------*/

    plugin.descendants = (function() {
      var descendants = function descendants(selectors) {
        var match, node, i = 0, results = NodeList(),
         nodes = (this.raw || this).getElementsByTagName('*');

        if (selectors && selectors.length) {
          match = Selector.match;
          while (node = nodes[i++])
            if (match(node, selectors))
              results.push(decorate(node));
        }
        else while (node = nodes[i]) results[i++] = decorate(node);
        return results;
      };

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        descendants = function descendants(selectors) {
          var match, node, i = 0, results = NodeList(),
           nodes = (this.raw || this).getElementsByTagName('*');

          if (selectors && selectors.length) {
            match = Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === 1 && match(element, selectors))
                results.push(decorate(node));
          } else {
            while (node = nodes[i++])
              if (node.nodeType === 1)
                results.push(decorate(node));
          }
          return results;
        };
      }
      return descendants;
    })();

    plugin.descendantOf = (function() {
      var descendantOf = function descendantOf(ancestor) {
        ancestor = Fuse.get(ancestor).raw;
        var element = this.raw || this;
        while (element = element.parentNode)
          if (element === ancestor) return true;
        return false;
      };

      if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        descendantOf = function descendantOf(ancestor) {
          /* DOCUMENT_POSITION_CONTAINS = 0x08 */
          ancestor = Fuse.get(ancestor).raw;
          var element = this.raw || this;
          return (element.compareDocumentPosition(ancestor) & 8) === 8;
        };
      }
      else if (Feature('ELEMENT_CONTAINS')) {
        var __descendantOf = descendantOf;

        descendantOf = function descendantOf(ancestor) {
          ancestor = Fuse.get(ancestor);
          var element, ancestorElem = ancestor.raw;
          if (ancestorElem.nodeType !== 1) return __descendantOf.call(this, ancestor);
          element = this.raw || this;
          return ancestorElem.contains(element) && ancestorElem !== element;
        };
      }
      return descendantOf;
    })();

    plugin.down = (function() {
      function getNth(nodes, index) {
        var count = 0, i = 0;
        while (node = nodes[i++])
          if (count++ === index) return decorate(node);
        return null;
      }

      function getNthBySelector(nodes, selectors, index) {
        var count = 0, i = 0, match = Selector.match;
        while (node = nodes[i++])
          if (match(node, selectors) && count++ === index)
            return decorate(node);
        return null;
      }

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        getNth = function(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (node.nodeType === 1 && count++ === index)
              return decorate(node);
          return null;
        };

        getNthBySelector = function(nodes, selectors, index) {
          var count = 0, i = 0, match = Selector.match;
          while (node = nodes[i++])
            if (node.nodeType === 1 && match(node, selectors) && count++ === index)
              return decorate(node);
          return null;
        };
      }

      function down(selectors, index) {
        if (selectors == null)
          return this.firstDescendant();

        if (isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        var nodes = (this.raw || this).getElementsByTagName('*');
        return selectors && selectors.length
          ? getNthBySelector(nodes, selectors, index)
          : getNth(nodes, index);
      }
      return down;
    })();

    plugin.firstDescendant = (function() {
      var firstDescendant = function firstDescendant() {
        var element = (this.raw || this).firstChild;
        while (element && element.nodeType !== 1) element = element[nextNode];
        return decorate(element);
      };

      if (firstNode === firstElement)
        firstDescendant = function firstDescendant() {
          return decorate((this.raw || this).firstElementChild);
        };

      return firstDescendant;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function getNth(decorator, property, selectors, index) {
        var match, count = 0,
         element = decorator.raw || decorator;

        if (isNumber(selectors)) {
          index = selectors; selectors = null;
        } else index = index || 0;

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && match(element, selectors) && count++ === index)
                return decorate(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === 1 && count++ === index)
                return decorate(element);
            } while (element = element[property]);
          }
        }
        return null;
      }

      plugin.next = function next(selectors, index) {
        return getNth(this, nextNode, selectors, index);
      };

      plugin.previous = function previous(selectors, index) {
        return getNth(this, prevNode, selectors, index);
      };

      plugin.up = function up(selectors, index) {
        return selectors == null
          ? decorate((this.raw || this).parentNode)
          : getNth(this, 'parentNode', selectors, index);
      };

      // prevent JScript bug with named function expressions
      var next = nil, previous = nil, up = nil;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function collect(decorator, property, selectors) {
        var match, element = this.raw || this,
         i = 0, results = NodeList();

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === 1 && match(element, selectors))
                results[i++] = decorate(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === 1)
                results[i++] = decorate(element);
            } while (element = element[property]);
          }
        }
        return results;
      }

      plugin.ancestors = function ancestors(selectors) {
        return collect(this, 'parentNode', selectors);
      };

      plugin.nextSiblings = function nextSiblings(selectors) {
        return collect(this, nextNode, selectors);
      };

      plugin.previousSiblings = function previousSiblings(selectors) {
        return collect(this, prevNode, selectors);
      };

      // prevent JScript bug with named function expressions
      var ancestors = nil, nextSiblings = nil, previousSiblings = nil;
    })();

  })(Element.plugin, Fuse.Dom.Selector);
