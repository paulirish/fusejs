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
      plugin.getChildren = function getChildren(selectors) {
        var nextSiblings, element = (this.raw || this)[firstNode];
        while (element && element.nodeType !== ELEMENT_NODE)
          element = element[nextNode];
        if (!element) return NodeList();

        element = fromElement(element);
        return !selectors || !selectors.length ||
            selectors && Selector.match(element, selectors)
          ? prependList(plugin.getNextSiblings.call(element, selectors), element, NodeList())
          : plugin.getNextSiblings.call(element, selectors);
      };

      plugin.match = function match(selectors) {
        return isString(selectors)
          ? Selector.match(this, selectors)
          : selectors.match(this);
      };

      plugin.query = function query(selectors, callback) {
        return Selector.select(selectors, this.raw || this, callback);
      };

      plugin.rawQuery = function rawQuery(selectors, callback) {
        return Selector.rawSelect(selectors, this.raw || this, callback);
      };

      plugin.getSiblings = function getSiblings(selectors) {
        var match, element = this.raw || this, i = 0,
         original = element, results = NodeList();

        if (element = element.parentNode && element.parentNode[firstNode]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === ELEMENT_NODE &&
                  element !== original && match(element, selectors))
                results[i++] = fromElement(element);
            } while (element = element[nextNode]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE && element !== original)
                results[i++] = fromElement(element);
            } while (element = element[nextNode]);
          }
        }
        return results;
      };

      // prevent JScript bug with named function expressions
      var getChildren = nil, match = nil, query = nil, rawQuery = nil, getSiblings = nil;
    })();

    /*------------------------------------------------------------------------*/

    plugin.getDescendants = (function() {
      var getDescendants = function getDescendants(selectors) {
        var match, node, i = 0, results = NodeList(),
         nodes = (this.raw || this).getElementsByTagName('*');

        if (selectors && selectors.length) {
          match = Selector.match;
          while (node = nodes[i++])
            if (match(node, selectors))
              results.push(fromElement(node));
        }
        else while (node = nodes[i]) results[i++] = fromElement(node);
        return results;
      };

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        getDescendants = function getDescendants(selectors) {
          var match, node, i = 0, results = NodeList(),
           nodes = (this.raw || this).getElementsByTagName('*');

          if (selectors && selectors.length) {
            match = Selector.match;
            while (node = nodes[i++])
              if (node.nodeType === ELEMENT_NODE && match(element, selectors))
                results.push(fromElement(node));
          } else {
            while (node = nodes[i++])
              if (node.nodeType === ELEMENT_NODE)
                results.push(fromElement(node));
          }
          return results;
        };
      }
      return getDescendants;
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
          if (ancestorElem.nodeType !== ELEMENT_NODE)
            return __descendantOf.call(this, ancestor);
          element = this.raw || this;
          return ancestorElem !== element && ancestorElem.contains(element);
        };
      }
      return descendantOf;
    })();

    plugin.down = (function() {
      function getNth(nodes, index) {
        var count = 0, i = 0;
        while (node = nodes[i++])
          if (count++ === index) return fromElement(node);
        return null;
      }

      function getNthBySelector(nodes, selectors, index) {
        var count = 0, i = 0, match = Selector.match;
        while (node = nodes[i++])
          if (match(node, selectors) && count++ === index)
            return fromElement(node);
        return null;
      }

      if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
        getNth = function(nodes, index) {
          var count = 0, i = 0;
          while (node = nodes[i++])
            if (node.nodeType === ELEMENT_NODE && count++ === index)
              return fromElement(node);
          return null;
        };

        getNthBySelector = function(nodes, selectors, index) {
          var count = 0, i = 0, match = Selector.match;
          while (node = nodes[i++])
            if (node.nodeType === ELEMENT_NODE &&
                match(node, selectors) && count++ === index)
              return fromElement(node);
          return null;
        };
      }

      function down(selectors, index) {
        if (selectors == null)
          return plugin.firstDescendant.call(this);

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
        while (element && element.nodeType !== ELEMENT_NODE)
          element = element[nextNode];
        return element && fromElement(element);
      };

      if (firstNode === firstElement)
        firstDescendant = function firstDescendant() {
          var element = (this.raw || this).firstElementChild;
          return element && fromElement(element);
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
              if (element.nodeType === ELEMENT_NODE &&
                  match(element, selectors) && count++ === index)
                return fromElement(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE && count++ === index)
                return fromElement(element);
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
          ? fromElement((this.raw || this).parentNode)
          : getNth(this, 'parentNode', selectors, index);
      };

      // prevent JScript bug with named function expressions
      var next = nil, previous = nil, up = nil;
    })();

    /*------------------------------------------------------------------------*/

    (function() {
      function collect(decorator, property, selectors) {
        var match, element = decorator.raw || decorator,
         i = 0, results = NodeList();

        if (element = element[property]) {
          if (selectors && selectors.length) {
            match = Selector.match;
            do {
              if (element.nodeType === ELEMENT_NODE && match(element, selectors))
                results[i++] = fromElement(element);
            } while (element = element[property]);
          } else {
            do {
              if (element.nodeType === ELEMENT_NODE)
                results[i++] = fromElement(element);
            } while (element = element[property]);
          }
        }
        return results;
      }

      plugin.getAncestors = function getAncestors(selectors) {
        return collect(this, 'parentNode', selectors);
      };

      plugin.getNextSiblings = function getNextSiblings(selectors) {
        return collect(this, nextNode, selectors);
      };

      plugin.getPreviousSiblings = function getPreviousSiblings(selectors) {
        return collect(this, prevNode, selectors);
      };

      // prevent JScript bug with named function expressions
      var getAncestors = nil, getNextSiblings = nil, getPreviousSiblings = nil;
    })();

  })(Element.plugin, Fuse.Dom.Selector);
