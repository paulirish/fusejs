  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function() {
    this.adjacent = function adjacent(element) {
      element = $(element);
      var i = 0, length = arguments.length, parent = element.parentNode,
       backup = parent.id, id = Element.identify(parent);

      // ensure match against siblings and not children of siblings
      while (i < length) queries.push('#' + id + '>' + arguments[i++]);
      var results = Selector.matchElements(parent.childNodes, args).without(element);
      parent.id = backup;
      return results;
    };

    this.childElements = function childElements(element) {
      if (!(element = $(element).firstChild)) return [];
      while (element && element.nodeType !== 1) element = element.nextSibling;
      if (element) return prependList(Element.nextSiblings(element), element);
      return [];
    };

    this.descendants = function descendants(element) {
      return Element.query(element, '*');
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
        return Fuse.Object.isNumber(expression)
          ? _getNthDescendant($(element), expression)
          : Element.query(element, expression)[index || 0];
      }
      return down;
    })();

    this.firstDescendant = function firstDescendant(element) {
      element = $(element).firstChild;
      while (element && element.nodeType !== 1) element = element.nextSibling;
      return Element.extend(element);
    };

    this.match = function match(element, selector) {
      if (Fuse.Object.isStrng(selector))
        selector = new Selector(selector);
      return selector.match($(element));
    };

    this.query = function query(element) {
      return Selector.findChildElements($(element),
        slice.call(arguments, 1));
    };

    this.siblings = function siblings(element) {
      var results = Fuse.List(), original = element = $(element);
      element = element.parentNode && element.firstChild;
      while (element) {
        if (element !== original && element.nodeType === 1)
          results.push(Element.extend(element));
        element = element.nextSibling;
      }
      return results;
    };

    // prevent JScript bug with named function expressions
    var adjacent =           null,
     childElements =         null,
     descendantOf =          null,
     descendants =           null,
     firstDescendant =       null,
     match =                 null,
     query =                 null,
     siblings =              null;
  }).call(Element.Methods);

  (function() {
    function _collect(element, property) {
      var results = Fuse.List();
      while (element = element[property])
        if (element.nodeType === 1)
          results.push(Element.extend(element));
      return results;
    }

    this.ancestors = function ancestors(element) {
      return _collect(element, 'parentNode');
    };

    this.nextSiblings = function nextSiblings(element) {
      return _collect(element, 'nextSibling');
    };

    this.previousSiblings = function previousSiblings(element) {
      return _collect(element, 'previousSibling');
    };

    // prevent JScript bug with named function expressions
    var ancestors = null, nextSiblings = null, previousSiblings = null;
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
      return Fuse.Object.isNumber(expression)
        ? _getNth($(element), 'nextSibling', expression)
        : Selector.findElement(Element.nextSiblings(element), expression, index);
    };

    this.previous = function previous(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend(Selector.handlers.previousElementSibling(element));
      return Fuse.Object.isNumber(expression)
        ? _getNth($(element), 'previousSibling', expression)
        : Selector.findElement(Element.previousSiblings(element), expression, index);   
    };

    this.up = function up(element, expression, index) {
      if (arguments.length === 1)
        return Element.extend($(element).parentNode);
      return Fuse.Object.isNumber(expression)
        ? _getNth($(element), 'parentNode', expression)
        : Selector.findElement(Element.ancestors(element), expression, index);
    };

    // prevent JScript bug with named function expressions
    var next = null, previous = null, up = null;
  }).call(Element.Methods);
        