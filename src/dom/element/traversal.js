  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function() {
    this.adjacent = function adjacent(element) {
      element = $(element);
      var args = slice.call(arguments, 1),
       parent = Element.extend(element.parentNode),
       oldId = parent.id, newId = parent.identify();

      // ensure match against siblings and not children of siblings
      args = args.map(function(a) { return '#' + newId + '>' + a });
      var matches = Selector.matchElements(parent.childNodes, args).without(element);
      parent.id = oldId;
      return matches;
    };

    this.ancestors = function ancestors(element) {
      return Element.recursivelyCollect(element, 'parentNode');
    };

    this.descendants = function descendants(element) {
      return Element.select(element, '*');
    };

    this.descendantOf = (function() {
      var descendantOf = function descendantOf(element, ancestor) {
       element = $(element); ancestor = $(ancestor);
        while (element = element.parentNode)
          if (element == ancestor) return true;
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
      var _getNthDescendant = Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES') ?
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
        };

      function down(element, expression, index) {
        if (arguments.length === 1)
          return Element.firstDescendant(element);
        return typeof expression === 'number'
          ? _getNthDescendant($(element), expression)
          : Element.select(element, expression)[index || 0];
      }
      return down;
    })();

    this.firstDescendant = function firstDescendant(element) {
      element = $(element).firstChild;
      while (element && element.nodeType !== 1) element = element.nextSibling;
      return Element.extend(element);
    };

    this.immediateDescendants = function immediateDescendants(element) {
      if (!(element = $(element).firstChild)) return [];
      while (element && element.nodeType !== 1) element = element.nextSibling;
      if (element) return prependList(Element.nextSiblings(element), element);
      return [];
    };

    this.nextSiblings = function nextSiblings(element) {
      return Element.recursivelyCollect(element, 'nextSibling');
    };

    this.previousSiblings = function previousSiblings(element) {
      return Element.recursivelyCollect(element, 'previousSibling');
    };

    this.recursivelyCollect = function recursivelyCollect(element, property) {
      element = $(element);
      var elements = [];
      while (element = element[property])
        if (element.nodeType === 1)
          elements.push(Element.extend(element));
      return elements;
    };

    this.siblings = function siblings(element) {
      return concatList(Element.previousSiblings(element).reverse(), Element.nextSiblings(element));
    };

    this.match = function match(element, selector) {
      if (typeof selector === 'string')
        selector = new Selector(selector);
      return selector.match($(element));
    };

    this.select = function select(element) {
      return Selector.findChildElements($(element),
        slice.call(arguments, 1));
    };

    // aliases
    this.childElements = this.immediateDescendants;
    this.getElementsBySelector = this.select;

    // prevent JScript bug with named function expressions
    var adjacent =           null,
     ancestors =             null,
     descendantOf =          null,
     descendants =           null,
     firstDescendant =       null,
     immediateDescendants =  null,
     match =                 null,
     nextSiblings =          null,
     previousSiblings =      null,
     recursivelyCollect =    null,
     select =                null,
     siblings =              null;
  }).call(Element.Methods);

  (function() {
    function _getNth(element, property, nth) {
      var count = 0;
      while (element = element[property]) {
        if (element.nodeType === 1 && count++ === nth)
          return Element.extend(element);
      }
    }

    this.next = function next(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend(Selector.handlers.nextElementSibling(element));
      return typeof expression === 'number'
        ? _getNth($(element), 'nextSibling', expression)
        : Selector.findElement(Element.nextSiblings(element), expression, index);
    };

    this.previous = function previous(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend(Selector.handlers.previousElementSibling(element));
      return typeof expression === 'number'
        ? _getNth($(element), 'previousSibling', expression)
        : Selector.findElement(Element.previousSiblings(element), expression, index);   
    };

    this.up = function up(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend($(element).parentNode);
      return typeof expression === 'number'
        ? _getNth($(element), 'parentNode', expression)
        : Selector.findElement(Element.ancestors(element), expression, index);
    };

    // prevent JScript bug with named function expressions
    var next = null, previous = null, up = null;
  }).call(Element.Methods);
        