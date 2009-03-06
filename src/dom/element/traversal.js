  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  Object._extend(Element.Methods, (function() {
    function adjacent(element) {
      element = $(element);
      var args = slice.call(arguments, 1),
       parent = Element.extend(element.parentNode),
       oldId = parent.id, newId = parent.identify();

      // ensure match against siblings and not children of siblings
      args = args.map(function(a) { return '#' + newId + '>' + a });
      var matches = Selector.matchElements(parent.childNodes, args).without(element);
      parent.id = oldId;
      return matches;
    }

    function ancestors(element) {
      return Element.recursivelyCollect(element, 'parentNode');
    }

    function descendants(element) {
      return Element.select(element, '*');
    }

    function firstDescendant(element) {
      element = $(element).firstChild;
      while (element && element.nodeType !== 1) element = element.nextSibling;
      return Element.extend(element);
    }

    function getNth(element, property, nth) {
      var count = 0;
      while (element = element[property]) {
        if (element.nodeType === 1 && count++ === nth)
          return Element.extend(element);
      }
    }
    
    function immediateDescendants(element) {
      if (!(element = $(element).firstChild)) return [];
      while (element && element.nodeType !== 1) element = element.nextSibling;
      if (element) return prependList(Element.nextSiblings(element), element);
      return [];
    }

    function next(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend(Selector.handlers.nextElementSibling(element));
      return typeof expression === 'number'
        ? getNth($(element), 'nextSibling', expression)
        : Selector.findElement(Element.nextSiblings(element), expression, index);
    }

    function previous(element, expression, index) {
      if (arguments.length == 1)
        return Element.extend(Selector.handlers.previousElementSibling(element));
      return typeof expression === 'number'
        ? getNth($(element), 'previousSibling', expression)
        : Selector.findElement(Element.previousSiblings(element), expression, index);   
    }

    function nextSiblings(element) {
      return Element.recursivelyCollect(element, 'nextSibling');
    }

    function previousSiblings(element) {
      return Element.recursivelyCollect(element, 'previousSibling');
    }

    function recursivelyCollect(element, property) {
      element = $(element);
      var elements = [];
      while (element = element[property])
        if (element.nodeType === 1)
          elements.push(Element.extend(element));
      return elements;
    }

    function siblings(element) {
      return concatList(Element.previousSiblings(element).reverse(), Element.nextSiblings(element));
    }

    function down(element, expression, index) {
      if (arguments.length == 1)
        return Element.firstDescendant(element);
      return typeof expression === 'number'
        ? getNthDescendant($(element), expression)
        : Element.select(element, expression)[index || 0];
    }

    function up(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend($(element).parentNode);
      return typeof expression === 'number'
        ? getNth($(element), 'parentNode', expression)
        : Selector.findElement(Element.ancestors(element), expression, index);
    }

    function match(element, selector) {
      if (typeof selector === 'string')
        selector = new Selector(selector);
      return selector.match($(element));
    }

    function select(element) {
      return Selector.findChildElements($(element),
        slice.call(arguments, 1));
    }

    var getNthDescendant =
      Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES') ?
        function(element, nth) {
          var node, i = 0, count = 0, nodes = element.getElementsByTagName('*');
          while (node = nodes[i++]) {
            if (node.nodeType === 1 && count++ === nth)
              return Element.extend(node);
          }
        } :
        function(element, nth) {
          var node = element.getElementsByTagName('*')[nth];
          if (node) return Element.extend(node);
        },

    descendantOf = (function() {
      function basic(element, ancestor) {
       element = $(element); ancestor = $(ancestor);
        while (element = element.parentNode)
          if (element == ancestor) return true;
        return false;
      }

      if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        return function(element, ancestor) {
          element = $(element); ancestor = $(ancestor);
          return (element.compareDocumentPosition(ancestor) & 8) === 8;
        };
      }
      if (Feature('ELEMENT_CONTAINS')) {
        return function(element, ancestor) {
          if (ancestor.nodeType !== 1) return basic(element, ancestor);
          element = $(element); ancestor = $(ancestor);
          return ancestor.contains(element) && ancestor !== element;
        };
      }
      return basic;
    })();

    return {
      'adjacent':              adjacent,
      'ancestors':             ancestors,
      'childElements':         immediateDescendants,
      'descendantOf':          descendantOf,
      'descendants':           descendants,
      'down':                  down,
      'firstDescendant':       firstDescendant,
      'getElementsBySelector': select,
      'immediateDescendants':  immediateDescendants,
      'match':                 match,
      'next':                  next,
      'nextSiblings':          nextSiblings,
      'previous':              previous,
      'previousSiblings':      previousSiblings,
      'recursivelyCollect':    recursivelyCollect,
      'select':                select,
      'siblings':              siblings,
      'up':                    up
    };
  })());
