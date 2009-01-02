  /*-------------------------------- SELECTOR --------------------------------*/

  /* Portions of the Selector class are derived from Jack Slocum's DomQuery,
   * part of YUI-Ext version 0.40, distributed under the terms of an MIT-style
   * license.  Please see http://www.yui-ext.com/ for more information. */

  $$ = function() {
    return Selector.findChildElements(doc, slice.call(arguments, 0));
  };

  if (Feature('XPATH')) {
    doc._getElementsByXPath = function(expression, parentElement) {
      parentElement = $(parentElement);
      var results = [], ownerDoc = getOwnerDoc(parentElement);
      var query = ownerDoc.evaluate(expression, parentElement || ownerDoc,
        null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (var i = 0, length = query.snapshotLength; i < length; i++)
        results.push(Element.extend(query.snapshotItem(i)));
      return results;
    };
  }

  Selector = Class.create((function() {
    function initialize(expression) {
      this.expression = expression.strip();

      if (this.shouldUseSelectorsAPI()) {
        this.mode = 'selectorsAPI';
      } else if (this.shouldUseXPath()) {
        this.mode = 'xpath';
        this.compileXPathMatcher();
      } else {
        this.mode = 'normal';
        this.compileMatcher();
      }
    }

    function shouldUseSelectorsAPI() {
      if (!Feature('SELECTORS_API') ||
          Bug('SELECTORS_API_CASE_INSENSITIVE_CLASSNAME')) {
        return false;
      }

      // Make sure the browser treats the selector as valid. Test on an 
      // isolated element to minimize cost of this check.    
      try {
        dummy.querySelector(this.expression);
      } catch(e) {
        return false;
      }

      return true;    
    }

    function shouldUseXPath() {
      if (!Feature('XPATH')) return false;
      var e = this.expression;

      // Opera's XPath engine breaks down when selectors are too complex
      // (a regression in version 9.5)
      if (P.Browser.Opera &&
       parseFloat(global.opera.version()) === 9.5)
        return false;

      // Safari 3 chokes on :*-of-type and :empty
      if (P.Browser.WebKit && 
       (e.include('-of-type') || e.include(':empty')))
        return false;

      // XPath can't do namespaced attributes, nor can it read
      // the "checked" property from DOM nodes
      if ((/(\[[\w-]*?:|:checked)/).test(e))
        return false;

      return true;
    }

    function compileMatcher() {
      var e = this.expression, ps = Selector.patterns, h = Selector.handlers, 
          c = Selector.criteria, le;

      if (Selector._cache[e]) {
        this.matcher = Selector._cache[e]; 
        return;
      }

      this.matcher = ['this.matcher = function(root) {', 
                      'var r = root, h = Selector.handlers, c = false, n;'];

      while (e && le != e && (/\S/).test(e)) {
        le = e;
        for (var i = 0, m, p; p = ps[i++]; ) {
          if (m = e.match(p.regexp)) {
            this.matcher.push(typeof c[p.name] === 'function' ? c[p.name](m) :
              new Template(c[p.name]).evaluate(m));
            e = e.replace(m[0], '');
            break;
          }
        }
      }

      this.matcher.push('return h.unique(n);\n}');
      eval(this.matcher.join('\n'));
      Selector._cache[this.expression] = this.matcher;
    }

    function compileXPathMatcher() {
      var e = this.expression, ps = Selector.patterns,
          x = Selector.xpath, le;

      if (Selector._cache[e]) {
        this.xpath = Selector._cache[e]; return;
      }

      this.matcher = ['.//*'];
      while (e && le != e && (/\S/).test(e)) {
        le = e;
        for (var i = 0, m, p; p = ps[i++]; ) {
          if (m = e.match(p.regexp)) {
            this.matcher.push(typeof x[p.name] === 'function' ? x[p.name](m) : 
              new Template(x[p.name]).evaluate(m));
            e = e.replace(m[0], '');
            break;
          }
        }
      }

      this.xpath = this.matcher.join('');
      Selector._cache[this.expression] = this.xpath;
    }

    function findElements(root) {
      root = root || doc;
      var results, e = this.expression;

      switch (this.mode) {
        case 'selectorsAPI':
          // querySelectorAll queries document-wide, then filters to descendants
          // of the context element. That's not what we want.
          // Add an explicit context to the selector if necessary.
          if (root.nodeType !== 9) {
            var oldId = root.id, id = Element.identify(root);
            e = '#' + id + ' ' + e;
          }

          results = nodeListSlice.call(root.querySelectorAll(e), 0).map(Element.extend);
          root.id = oldId;

          return results;
        case 'xpath':
          return doc._getElementsByXPath(this.xpath, root);
        default:
         return this.matcher(root);
      }
    }

    function inspect() {
      return '#<Selector:' + this.expression.inspect() + '>';
    }

    function match(element) {
      var le, e = this.expression, ps = Selector.patterns,
       as = Selector.assertions;

      if (e.include(',')) {
        // If the expression includes a comma, it might be a union of several
        // selectors. Split and check each one.
        var expressions = Selector.split(e);
        if (expressions.length > 1) {
          for (var i = 0, expression; expression = expressions[i++]; ) {
            if (new Selector(expression).match(element)) return true;
          }
          return false;
        }
      }

      this.tokens = [];
      while (e && le !== e && (/\S/).test(e)) {
        le = e;
        for (var i = 0, m, p; p = ps[i++]; ) {
          if (m = e.match(p.regexp)) {
            // use the Selector.assertions methods unless the selector
            // is too complex.
            if (as[p.name]) {
              this.tokens.push([p.name, Object.clone(m)]);
              e = e.replace(m[0], '');
            } else {
              // reluctantly do a document-wide search
              // and look for a match in the array
              return this.findElements(element.ownerDocument).include(element);
            }
          }
        }
      }

      var match = true, name, matches;
      for (var i = 0, token; token = this.tokens[i++]; ) {
        name = token[0], matches = token[1];
        if (!Selector.assertions[name](element, matches)) {
          match = false; break;
        }
      }

      return match;
    }

    function toString() {
      return this.expression;
    }

    return {
      'initialize':            initialize,
      'compileMatcher':        compileMatcher,
      'compileXPathMatcher':   compileXPathMatcher,
      'findElements':          findElements,
      'inspect':               inspect,
      'match':                 match,
      'shouldUseSelectorsAPI': shouldUseSelectorsAPI,
      'shouldUseXPath':        shouldUseXPath,
      'toString':              toString
    };
  })());
  
  Object.extend(Selector, (function() {
    function findChildElements(element, expressions) {
      expressions = Selector.split(expressions.join(','));
      var results = [], h = Selector.handlers;    
      for (var i = 0, exp; exp = expressions[i++]; )
        h.concat(results, new Selector(exp.strip()).findElements(element));
      return (expressions.length > 1) ? h.unique(results) : results;
    }

    function findElement(elements, expression, index) {
      if (typeof expression === 'number') { 
        index = expression; expression = false;
      }
      return Selector.matchElements(elements, expression || '*')[index || 0];
    }

    function matchElements(elements, expression) {
      var results = [], matches = $$(expression), h = Selector.handlers;
      h.mark(matches);
      for (var i = 0, element; element = elements[i++]; )
        if (typeof element._countedByPrototype !== 'undefined')
          results.push(element);
      h.unmark(matches);
      return results;
    }

    function split(expression) {
      var expressions = [];
      expression.scan(/(([\w#:.~>+()\s-]|\*|\[.*?\])+)\s*(,|$)/, function(m) {
        expressions.push(m[1].strip());
      });
      return expressions;
    }
    
    return {
      'findChildElements': findChildElements,
      'findElement':       findElement,
      'matchElements':     matchElements,
      'split':             split
    };
  })());

  Object.extend(Selector, {
    _cache: { },

    xpath: (function() {
      function attr(m) {
        m[1] = m[1].toLowerCase();
        m[3] = m[5] || m[6];
        return new Template(Selector.xpath.operators[m[2]]).evaluate(m);
      }

      function attrPresence(m) {
        m[1] = m[1].toLowerCase();
        return new Template('[@#{1}]').evaluate(m);
      }

      function pseudo(m) {
        var h = Selector.xpath.pseudos[m[1]];
        if (!h) return '';
        if (typeof h === 'function') return h(m);
        return new Template(Selector.xpath.pseudos[m[1]]).evaluate(m);
      }

      function tagName(m) { 
        if (m[1] == '*') return '';
        return '[local-name()="' + m[1].toLowerCase() + 
               '" or local-name()="' + m[1].toUpperCase() + '"]';
      }

      return {
        'descendant':   '//*',
        'child':        '/*',
        'adjacent':     '/following-sibling::*[1]',
        'laterSibling': '/following-sibling::*',
        'className':    '[contains(concat(" ", @class, " "), " #{1} ")]',
        'id':           '[@id="#{1}"]',
        'attr':         attr,
        'attrPresence': attrPresence,
        'pseudo':       pseudo,
        'tagName':      tagName,

        operators: {
          '=':  '[@#{1}="#{3}"]',
          '!=': '[@#{1}!="#{3}"]',
          '^=': '[starts-with(@#{1}, "#{3}")]',
          '$=': '[substring(@#{1}, (string-length(@#{1}) - string-length("#{3}") + 1))="#{3}"]',
          '*=': '[contains(@#{1}, "#{3}")]',
          '~=': '[contains(concat(" ", @#{1}, " "), " #{3} ")]',
          '|=': '[contains(concat("-", @#{1}, "-"), "-#{3}-")]'
        },

        pseudos: (function() {
          function firstOfType(m) { 
            m[6] = '1';
            return Selector.xpath.pseudos['nth-of-type'](m);
          }

          function lastOfType(m) {
            m[6] = '1';
            return Selector.xpath.pseudos['nth-last-of-type'](m);
          }

          function not(m) {
            var le, exclusions = [], e = m[6],
             ps = Selector.patterns, x = Selector.xpath;

            while (e && le != e && (/\S/).test(e)) {
              le = e;
              for (var i = 0, p, v; p = ps[i++]; ) {
                if (m = e.match(p.regexp)) {
                  v = typeof x[p.name] === 'function' ? x[p.name](m) : new Template(x[p.name]).evaluate(m);
                  exclusions.push('(' + v.substring(1, v.length - 1) + ')');
                  e = e.replace(m[0], '');
                  break;
                }
              }
            }        
            return '[not(' + exclusions.join(' and ') + ')]';
          }

          function nth(fragment, m) {
            var mm, formula = m[6], predicate;
            if (formula == 'even') formula = '2n+0';
            if (formula == 'odd')  formula = '2n+1';
            if (mm = formula.match(/^(\d+)$/)) // digit only
              return '[' + fragment + '= ' + mm[1] + ']';

            if (mm = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
              if (mm[1] == '-') mm[1] = -1;
              var a = mm[1] ? Number(mm[1]) : 1;
              var b = mm[2] ? Number(mm[2]) : 0;
 
              predicate = '[((#{fragment} - #{b}) mod #{a} = 0) and ((#{fragment} - #{b}) div #{a} >= 0)]';
              return new Template(predicate).evaluate({
                fragment: fragment, a: a, b: b });
            }
          }

          function nthChild(m) { 
            return Selector.xpath.pseudos.nth('(count(./preceding-sibling::*) + 1) ', m);
          }

          function nthLastChild(m) {
            return Selector.xpath.pseudos.nth('(count(./following-sibling::*) + 1) ', m);
          }

          function nthLastOfType(m) {
            return Selector.xpath.pseudos.nth('(last() + 1 - position()) ', m);
          }

          function nthOfType(m) {
            return Selector.xpath.pseudos.nth('position() ', m);
          }

          function onlyOfType(m) {
            var p = Selector.xpath.pseudos;
            return p['first-of-type'](m) + p['last-of-type'](m);
          }

          return {
            'first-child':     '[not(preceding-sibling::*)]',
            'last-child':      '[not(following-sibling::*)]',
            'checked':         '[@checked]',
            'disabled':        '[(@disabled) and (@type!="hidden")]',
            'empty':           '[count(*) = 0 and (count(text()) = 0)]',
            'enabled':         '[not(@disabled) and (@type!="hidden")]',
            'only-child':      '[not(preceding-sibling::* or following-sibling::*)]',
            'first-of-type':    firstOfType,
            'last-of-type':     lastOfType,
            'not':              not,
            'nth':              nth,
            'nth-child':        nthChild,
            'nth-last-child':   nthLastChild,
            'nth-last-of-type': nthLastOfType,
            'nth-of-type':      nthOfType,
            'only-of-type':     onlyOfType
          };
        })() // end pseudos closure
      };     // end xpath object
    })(),    // end xpath closure

    criteria: (function() {
      function attr(m) {
        m[3] = (m[5] || m[6]);
        return new Template('n = h.attr(n, r, "#{1}", "#{3}", "#{2}", c); c = false;').evaluate(m);
      }

      function pseudo(m) {
        if (m[6]) m[6] = m[6].replace(/"/g, '\\"');
        return new Template('n = h.pseudo(n, "#{1}", "#{6}", r, c); c = false;').evaluate(m); 
      }

      return {
        'adjacent':     'c = "adjacent";',
        'child':        'c = "child";',
        'descendant':   'c = "descendant";',
        'laterSibling': 'c = "laterSibling";',
        'attrPresence': 'n = h.attrPresence(n, r, "#{1}", c); c = false;',
        'className':    'n = h.className(n, r, "#{1}", c);    c = false;',
        'id':           'n = h.id(n, r, "#{1}", c);           c = false;',
        'tagName':      'n = h.tagName(n, r, "#{1}", c);      c = false;',
        'attr':          attr,
        'pseudo':        pseudo
      };
    })(),

    patterns: [
      // combinators must be listed first
      // (and descendant needs to be last combinator)
      { name: 'laterSibling', regexp: /^\s*~\s*/  },
      { name: 'child',        regexp: /^\s*>\s*/  },
      { name: 'adjacent',     regexp: /^\s*\+\s*/ },
      { name: 'descendant',   regexp: /^\s/ },

      // selectors follow
      { name: 'tagName',      regexp: /^\s*(\*|[\w\-]+)(\b|$)?/ },
      { name: 'id',           regexp: /^#([\w\-\*]+)(\b|$)/ },
      { name: 'className',    regexp: /^\.([\w\-\*]+)(\b|$)/ },
      { name: 'pseudo',       regexp: /^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|(?=\s|[:+~>]))/ },
      { name: 'attrPresence', regexp: /^\[((?:[\w-]+:)?[\w-]+)\]/ },
      { name: 'attr',         regexp: /\[((?:[\w-]+:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\4]*?)\4|([^'"][^\]]*?)))?\]/ }
    ],

    // for Selector.match and Element#match
    assertions: (function() {
      function attr(element, matches) {
        var nodeValue = Element.readAttribute(element, matches[1]);
        return nodeValue && Selector.operators[matches[2]](nodeValue, matches[5] || matches[6]);
      }

      function attrPresence(element, matches) {
        return Element.hasAttribute(element, matches[1]);
      }

      function className(element, matches) {
        return Element.hasClassName(element, matches[1]);
      }

      function id(element, matches) {
        return element.id === matches[1];
      }

      function tagName(element, matches) {
        return matches[1].toUpperCase() == element.tagName.toUpperCase();
      }

      return {
        attr:         attr,
        attrPresence: attrPresence,
        className:    className,
        id:           id,
        tagName:      tagName
      };
    })(),

    handlers: (function() {
      /* UTILITY FUNCTIONS */

      var concat = (function() {
        // IE returns comment nodes on getElementsByTagName("*").
        // Filter them out.
        if (Bug('GET_ELEMENTS_BY_TAG_NAME_RETURNS_COMMENT_NODES')) {
          return function(a, b) {
            for (var i = 0, node; node = b[i]; i++)
              if (node.nodeType === 1) a.push(node);
            return a;
          };
        }
        return function(a, b) {
          var pad = a.length, length = b.length;
          while (length--) a[pad + length] = b[length];
          return a;
        };
      })();

      var unmark = (function() {
        // IE improperly serializes _countedByPrototype in (inner|outer)HTML.
        if (Bug('ELEMENT_PROPERTIES_ARE_ATTRIBUTES')) {
          return function(nodes) {
            for (var i = 0, node; node = nodes[i++]; )
              node.removeAttribute('_countedByPrototype');
            return nodes;
          };
        }
        return function(nodes) {
          for (var i = 0, node; node = nodes[i++]; )
            node._countedByPrototype = undefined;
          return nodes;
        };
      })();

      // marks an array of nodes for counting
      function mark(nodes) {
        var _true = P.emptyFunction;
        for (var i = 0, node; node = nodes[i++]; )
          node._countedByPrototype = _true;
        return nodes;
      }

      // mark each child node with its position (for nth calls)
      // "ofType" flag indicates whether we're indexing for nth-of-type
      // rather than nth-child
      function index(parentNode, reverse, ofType) {
        parentNode._countedByPrototype = P.emptyFunction;
        var node, nodes = parentNode.childNodes, index = 1;
        if (reverse) {
          var length = nodes.length;
          while (length--) {
            node = nodes[length];
            if (node.nodeType == 1 && (!ofType || typeof node._countedByPrototype !== 'undefined'))
              node.nodeIndex = index++;
          }
        } else {
          for (var i = 0; node = nodes[i++]; )
            if (node.nodeType == 1 && (!ofType || typeof node._countedByPrototype !== 'undefined'))
              node.nodeIndex = index++;
        }
      }

      // filters out duplicates and extends all nodes
      function unique(nodes) {
        if (nodes.length == 0) return nodes;
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (typeof node._countedByPrototype === 'undefined') {
            node._countedByPrototype = P.emptyFunction;
            results.push(Element.extend(node));
          }
        return Selector.handlers.unmark(results);
      }

      /* COMBINATOR FUNCTIONS */

      var child = (function() {
        // if comments are NOT returned in nodeLists and has children collection
        if (Feature('ELEMENT_CHILDREN_NODELIST') && !Bug('COMMENT_NODES_IN_CHILDREN_NODELIST')) {
          return function(nodes) {
            for (var i = 0, results = [], node; node = nodes[i++]; ) {
              for (var j = 0, child; child = node.children[j++]; )
                results.push(child);
            }
            return results;
          };
        }
        return function(nodes) {
          for (var i = 0, results = [], node; node = nodes[i++]; ) {
            for (var j = 0, child; child = node.childNodes[j++]; )
              if (child.nodeType === 1) results.push(child);
          }
          return results;
        };
      })();

      function adjacent(nodes) {
        for (var i = 0, results = [], next, node; node = nodes[i++]; ) {
          next = this.nextElementSibling(node);
          if (next) results.push(next);
        }
        return results;
      }

      function descendant(nodes) {
        var results = [], h = Selector.handlers;
        for (var i = 0, node; node = nodes[i++]; )
          h.concat(results, node.getElementsByTagName('*'));
        return results;
      }

      function laterSibling(nodes) {
        var results = [], h = Selector.handlers;
        for (var i = 0, node; node = nodes[i++]; )
          h.concat(results, Element.nextSiblings(node));
        return results;
      }

      function nextElementSibling(node) {
        while (node = node.nextSibling)
          if (node.nodeType == 1) return node;
        return null;
      }

      function previousElementSibling(node) {
        while (node = node.previousSibling)
          if (node.nodeType == 1) return node;
        return null;
      }

      /* TOKEN FUNCTIONS */

      function attr(nodes, root, attr, value, operator, combinator) {
        if (!nodes) nodes = root.getElementsByTagName('*');
        if (nodes && combinator) nodes = this[combinator](nodes);
        var handler = Selector.operators[operator], results = [];
        for (var i = 0, node; node = nodes[i++]; ) {
          if (handler(Element.readAttribute(node, attr), value))
            results.push(node);
        }
        return results;
      }

      function attrPresence(nodes, root, attr, combinator) {
        if (!nodes) nodes = root.getElementsByTagName('*');
        if (nodes && combinator) nodes = this[combinator](nodes);
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (Element.hasAttribute(node, attr)) results.push(node);
        return results;      
      }

      function byClassName(nodes, root, className) {
        if (!nodes) nodes = Selector.handlers.descendant([root]);
        var results = [], needle = ' ' + className + ' ';
        for (var i = 0, node, nodeClassName; node = nodes[i++]; ) {
          nodeClassName = node.className;
          if (nodeClassName.length == 0) continue;
          if (nodeClassName == className || (' ' + nodeClassName + ' ').include(needle))
            results.push(node);
        }
        return results;
      }

      function className(nodes, root, className, combinator) {
        if (nodes && combinator) nodes = this[combinator](nodes);
        return Selector.handlers.byClassName(nodes, root, className);
      }

      function id(nodes, root, id, combinator) {
        var targetNode, h = Selector.handlers;

        // check if the root is detached from the document
        // (works with detached clones of attached elements too)
        if (Element.isFragment(root)) {
          var els = root.getElementsByTagName('*');
          for (var i = 0, el; el = els[i++]; ) {
            if (el.id === id) {
              targetNode = $(el); break;
            }
          }
        } else targetNode = getOwnerDoc(root).getElementById(id);

        if (!targetNode) return [];
        if (!nodes && root.nodeType === 9) return [targetNode];
        if (nodes) {
          if (combinator) {
            if (combinator == 'child') {
              for (var i = 0, node; node = nodes[i++]; )
                if (targetNode.parentNode == node) return [targetNode];
            } else if (combinator == 'descendant') {
              for (var i = 0, node; node = nodes[i++]; )
                if (Element.descendantOf(targetNode, node)) return [targetNode];
            } else if (combinator == 'adjacent') {
              for (var i = 0, node; node = nodes[i++]; )
                if (Selector.handlers.previousElementSibling(targetNode) == node)
                  return [targetNode];
            } else nodes = h[combinator](nodes);
          } 
          for (var i = 0, node; node = nodes[i++]; )
            if (node == targetNode) return [targetNode];
          return [];
        }
        return (targetNode && Element.descendantOf(targetNode, root)) ? [targetNode] : [];
      }

      function pseudo(nodes, name, value, root, combinator) {
        if (nodes && combinator) nodes = this[combinator](nodes);
        if (!nodes) nodes = root.getElementsByTagName('*');
        return Selector.pseudos[name](nodes, value, root);
      }

      function tagName(nodes, root, tagName, combinator) {
        var uTagName = tagName.toUpperCase();
        var results = [], h = Selector.handlers;
        if (nodes) {
          if (combinator) {
            // fastlane for ordinary descendant combinators
            if (combinator == 'descendant') {
              for (var i = 0, node; node = nodes[i++]; )
                h.concat(results, node.getElementsByTagName(tagName));
              return results;
            } else nodes = this[combinator](nodes);
            if (tagName == '*') return nodes;
          }
          for (var i = 0, node; node = nodes[i++]; )
            if (node.tagName.toUpperCase() === uTagName) results.push(node);
          return results;
        } else return root.getElementsByTagName(tagName);
      }

      return {
        'adjacent':               adjacent,
        'attr':                   attr,
        'attrPresence':           attrPresence,
        'byClassName':            byClassName,
        'child':                  child,
        'className':              className,
        'concat':                 concat,
        'descendant':             descendant,
        'id':                     id,
        'index':                  index,
        'laterSibling':           laterSibling,
        'mark':                   mark,
        'nextElementSibling':     nextElementSibling,
        'previousElementSibling': previousElementSibling,
        'pseudo':                 pseudo,
        'tagName':                tagName,
        'unique':                 unique,
        'unmark':                 unmark
      };
    })(),

    operators: (function() {
      function equal(nv, v) {
        return nv == v;
      }

      function notEqual(nv, v) {
        return nv != v;
      }

      function startsWith(nv, v) {
        return nv == v || nv && nv.startsWith(v);
      }

      function endsWith(nv, v) {
        return nv == v || nv && nv.endsWith(v);
      }

      function include(nv, v) {
        return nv == v || nv && nv.include(v);
      }

      function dashSeparated(nv, v) {
        return ('-' + (nv || '').toUpperCase() + '-')
          .include('-' + (v || '').toUpperCase() + '-');
      }

      function spaceSeparated(nv, v) {
        return (' ' + nv + ' ').include(' ' + v + ' ');
      }

      return {
        '=':  equal,
        '!=': notEqual,
        '^=': startsWith,
        '$=': endsWith,
        '*=': include,
        '|=': dashSeparated,
        '~=': spaceSeparated
      };
    })(),

    pseudos: (function() {
      function checked(nodes, value, root) {
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (node.checked) results.push(node);
        return results;
      }

      function disabled(nodes, value, root) {
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (node.disabled) results.push(node);
        return results;
      }

      function empty(nodes, value, root) {
        for (var i = 0, results = [], node; node = nodes[i++]; ) {
          // IE treats comments as element nodes
          if (node.tagName == '!' || node.firstChild) continue;
          results.push(node);
        }
        return results;
      }

      function enabled(nodes, value, root) {
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (!node.disabled && (!node.type || node.type !== 'hidden'))
            results.push(node);
        return results;
      }

      // handles the an+b logic
      function getIndices(a, b, total) {
        if (a == 0) return b > 0 ? [b] : [];
        return $R(1, total).inject([], function(memo, i) {
          if (0 == (i - b) % a && (i - b) / a >= 0) memo.push(i);
          return memo;
        });
      }

      function firstChild(nodes, value, root) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i++]; ) {
          if (h.previousElementSibling(node)) continue;
            results.push(node);
        }
        return results;
      }

      function firstOfType(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, '1', root, false, true);
      }

      function lastChild(nodes, value, root) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i++]; ) {
          if (h.nextElementSibling(node)) continue;
            results.push(node);
        }
        return results;
      }

      function lastOfType(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, '1', root, true, true);
      }

      function not(nodes, selector, root) {
        var results = [], h = Selector.handlers,
         exclusions = new Selector(selector).findElements(root);
        h.mark(exclusions);
        for (var i = 0, node; node = nodes[i++]; )
          if (typeof node._countedByPrototype === 'undefined')
            results.push(node);
        h.unmark(exclusions);
        return results;
      }

      // handles nth(-last)-child, nth(-last)-of-type, and (first|last)-of-type
      function nth(nodes, formula, root, reverse, ofType) {
        if (nodes.length == 0) return [];
        if (formula == 'even') formula = '2n+0';
        if (formula == 'odd')  formula = '2n+1';

        var m, results = [], indexed = [], h = Selector.handlers;
        h.mark(nodes);

        for (var i = 0, node; node = nodes[i++]; ) {
          if (typeof node.parentNode._countedByPrototype === 'undefined') {
            h.index(node.parentNode, reverse, ofType);
            indexed.push(node.parentNode);
          }
        }
        if (formula.match(/^\d+$/)) { // just a number
          formula = Number(formula);
          for (var i = 0, node; node = nodes[i++]; )
            if (node.nodeIndex == formula) results.push(node);
        } else if (m = formula.match(/^(-?\d*)?n(([+-])(\d+))?/)) { // an+b
          if (m[1] === '-') m[1] = -1;
          var a = m[1] ? Number(m[1]) : 1;
          var b = m[2] ? Number(m[2]) : 0;
          var indices = Selector.pseudos.getIndices(a, b, nodes.length);
          for (var i = 0, node, l = indices.length; node = nodes[i]; i++) {
            for (var j = 0; j < l; j++)
              if (node.nodeIndex == indices[j]) results.push(node);
          }
        }
        h.unmark(nodes);
        h.unmark(indexed);    
        return results;  
      }

      function nthChild(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, formula, root);
      }

      function nthLastChild(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, formula, root, true);
      }

      function nthLastOfType(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, formula, root, true, true);
      }

      function nthOfType(nodes, formula, root) { 
        return Selector.pseudos.nth(nodes, formula, root, false, true);
      }

      function onlyChild(nodes, value, root) {
        var h = Selector.handlers;
        for (var i = 0, results = [], node; node = nodes[i++]; )
          if (!h.previousElementSibling(node) && !h.nextElementSibling(node))
            results.push(node);  
        return results;
      }

      function onlyOfType(nodes, formula, root) {
        var p = Selector.pseudos;
        return p['last-of-type'](p['first-of-type'](nodes, formula, root), formula, root);
      }

      return {
        'checked':          checked,
        'disabled':         disabled,
        'empty':            empty,
        'enabled':          enabled,
        'first-child':      firstChild,
        'first-of-type':    firstOfType,
        'getIndices':       getIndices,
        'last-child':       lastChild,
        'last-of-type':     lastOfType,
        'not':              not,
        'nth':              nth,
        'nth-child':        nthChild,
        'nth-last-child':   nthLastChild,
        'nth-of-type':      nthOfType,
        'nth-last-of-type': nthLastOfType,
        'only-child':       onlyChild,
        'only-of-type':     onlyOfType
      };
    })() // end of pseudos closure
  });    // end of extending Selector 
