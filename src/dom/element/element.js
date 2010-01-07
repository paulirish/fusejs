  /*-------------------------------- ELEMENT ---------------------------------*/

  Element =
  Fuse.Dom.Element = Class(Node, {
    'constructor': (function() {
      function Element(tagName, attributes, context) {
        return isString(tagName)
          ? Element.create(tagName, attributes, context)
          : fromElement(tagName);
      }
      return Element;
    })()
  });

  Element.updateGenerics = Node.updateGenerics;

  /*--------------------------------------------------------------------------*/

  (function() {

    var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
      Bug('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY'),

    FROM_STRING_PARENT_WRAPPERS = (function() {
      var T = {
        'COLGROUP': ['<table><colgroup>',      '<\/colgroup><tbody><\/tbody><\/table>', 2],
        'SELECT':   ['<select>',               '<\/select>',                            1],
        'TABLE':    ['<table>',                '<\/table>',                             1],
        'TBODY':    ['<table><tbody>',         '<\/tbody><\/table>',                    2],
        'TR':       ['<table><tbody><tr>',     '<\/tr><\/tbody><\/table>',              3],
        'TD':       ['<table><tbody><tr><td>', '<\/td><\/tr><\/tbody><\/table>',        4]
      };

      // TODO: Opera fails to render optgroups when set with innerHTML
      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      T['OPTGROUP'] = T['SELECT'];
      T['TH'] = T['TD'];

      return T;
    })(),

    FROM_STRING_CHILDRENS_PARENT_KEYS = (function() {
      var T = {
        'TD':     'TR',
        'TR':     'TBODY',
        'TBODY':  'TABLE',
        'OPTION': 'SELECT',
        'COL':    'COLGROUP'
      };

      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      T['TH'] = T['TD'];

      return T;
    })(),

    TAG_NAME_CLASSES = (function() {
      var T = {
        'A':        'AnchorElement',
        'CAPTION':  'TableCaptionElement',
        'COL':      'TableColElement',
        'DEL':      'ModElement',
        'DIR':      'DirectoryElement',
        'DL':       'DListElement',
        'H1':       'HeadingElement',
        'IFRAME':   'IFrameElement',
        'IMG':      'ImageElement',
        'INS':      'ModElement',
        'FIELDSET': 'FieldSetElement',
        'FRAMESET': 'FrameSetElement',
        'OL':       'OListElement',
        'OPTGROUP': 'OptGroupElement',
        'P':        'ParagraphElement',
        'Q':        'QuoteElement',
        'TBODY':    'TableSectionElement',
        'TD':       'TableCellElement',
        'TEXTAREA': 'TextAreaElement',
        'TR':       'TableRowElement',
        'UL':       'UListElement'
      };

      T['H2'] =
      T['H3'] =
      T['H4'] =
      T['H5'] =
      T['H6'] = T['H1'];

      T['TFOOT'] =
      T['THEAD'] =  T['TBODY'];

      T['TH'] = T['TD']; 
      T['COLGROUP'] = T['COL'];

      return T;
    })(),

    doc = Fuse._doc,

    getFuseId = Node.getFuseId,

    matchComplexTag = /^<([A-Za-z]+)>$/,

    matchStartsWithTableRow = /^<[tT][rR]/,

    matchTagName= /^<([^> ]+)/,

    Dom = Fuse.Dom;


    // For speed we don't normalize tagName case.
    // There is the potential for cache.div, cache.DIV, cache['<div name="x">']
    // Please stick to either all uppercase or lowercase tagNames.
    //
    // IE7 and below need to use the sTag of createElement to set the `name` attribute
    // http://msdn.microsoft.com/en-us/library/ms536389.aspx
    //
    // IE fails to set the BUTTON element's `type` attribute without using the sTag
    // http://dev.rubyonrails.org/ticket/10548

    function create(tagName, attributes, context) {
      var complexTag, data, element, fragment, id, length,
       result = null;

      // caching html strings is not supported at the moment
      if (tagName.charAt(0) == '<') {
        context = attributes;

        // support `<div>x</div>` format tags
        if (!(complexTag = tagName.match(matchComplexTag))) {
          fragment = Dom.getFragmentFromString(tagName, context);
          length = fragment.childNodes.length;

          // multiple elements return a NodeList
          if (length > 1) {
            result = NodeList();
            while (length--) {
              element = fragment.removeChild(fragment.lastChild);
              Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
              result[length] = new Decorator(element);
            }
          // single element return decorated element
          } else {
            element = fragment.removeChild(fragment.firstChild);
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            result = new Decorator(element);
          }
          return result;
        }

        // support `<div>` format tags
        tagName = complexTag[1];
      }

      context || (context = doc);
      id   = context === doc ? '2' : getFuseId(getWindow(context).frameElement);
      data = Data[id].nodes;
      element = data[tagName] || (data[tagName] = context.createElement(tagName));

      // avoid adding the new element to the data cache
      Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
      element = new Decorator(element.cloneNode(false));

      return attributes
        ? element.setAttribute(attributes)
        : element;
    }

    function extendByTag(tagName, statics, plugins, mixins) {
      if (isArray(tagName)) {
        var i = 0;
        while (tagName[i])
          extendByTag(tagName[i++], statics, plugins, mixins);
      }
      else getOrCreateTagClass(tagName)
        .extend(statics, plugins, mixins);
    }

    function Decorator(element) {
      this.raw = element;
      this.style = element.style;
      this.tagName = element.tagName;
      this.nodeName = element.nodeName;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.initialize && this.initialize();
    }

    function fromElement(element) {
      // return if already a decorator
      if (element.raw) return element;

      // return cached if available
      var id = getFuseId(element), data = Data[id];
      if (data.decorator) return data.decorator;

      data.node = element;
      Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
      return (data.decorator = new Decorator(element));
    }

    function getOrCreateTagClass(tagName) {
      var upperCased, tagClass, tagClassName = TAG_NAME_CLASSES[tagName];

      if (!tagClassName) {
        upperCased = tagName.toUpperCase();
        tagClassName = TAG_NAME_CLASSES[upperCased];

        if (!tagClassName) {
          TAG_NAME_CLASSES[upperCased] =
          tagClassName = capitalize.call(tagName) + 'Element';
        }
        TAG_NAME_CLASSES[tagName] = tagClassName;
      }

      if (!(tagClass = Dom[tagClassName])) {
        (tagClass =
        Dom[tagClassName] = Class(Element, {
          'constructor': function(element) {
            return element && (element.raw ?
              element : fromElement(element));
          }
        })).updateGenerics = Node.updateGenerics;
      }
      return tagClass;
    }

    function getFragmentCache(ownerDoc) {
      var id = ownerDoc === doc ? '1' : getFuseId(getWindow(ownerDoc).frameElement),
       data = Data[id];
      return (data.fragmentCache = data.fragmentCache || {
        'node':     ownerDoc.createElement('div'),
        'fragment': ownerDoc.createDocumentFragment()
      });
    }

    function getFragmentFromChildNodes(parentNode, cache) {
      var fragment = cache.fragment,
       nodes = parentNode.childNodes,
       length = node.length;

      while (length--)
        fragment.insertBefore(nodes[length], fragment.firstChild);
      return fragment;
    }

    function getFromContextualFragment(html, context) {
      // 1) Konqueror throws when trying to create a fragment from
      //    incompatible markup such as table rows. Similar to IE's issue
      //    with setting table's innerHTML.
      //
      // 2) WebKit and KHTML throw when creating contextual fragments from
      //    orphaned elements.
      try {
        context = context || Fuse._doc;
        var cache = getFragmentCache(context.ownerDocument || context),
         range = cache.range;
        range.selectNode(context.body || context.firstChild);
        return range.createContextualFragment(html);
      } catch (e) {
        return getFromDocumentFragment(html, context, cache);
      }
    }

    function getFromDocumentFragment(html, context, cache) {
       context = context || Fuse._doc;
       cache = cache || getFragmentCache(context.ownerDocument || context);
       var node = cache.node,
        nodeName = context.nodeType === DOCUMENT_NODE
          ? FROM_STRING_CHILDRENS_PARENT_KEYS[html.match(matchTagName)[1].toUpperCase()]
          : getNodeName(context),

        wrapping = FROM_STRING_PARENT_WRAPPERS[nodeName];

      if (wrapping) {
        var times = wrapping[2];
        node.innerHTML= wrapping[0] + html + wrapping[1];
        while (times--) node = node.firstChild;
      } else node.innerHTML = html;

      // skip auto-inserted tbody
      if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
          nodeName === 'TABLE' && matchStartsWithTableRow.test(html))
        node = node.firstChild;

      return getFragmentFromChildNodes(node, cache);
    }

    if (Feature('CREATE_ELEMENT_WITH_HTML')) 
      var create = (function(__create) {
        function create(tagName, attributes, context) {
          var data, element, id, name, type;
          if (attributes && tagName.charAt(0) != '<' &&
             ((name = attributes.name) || (type = attributes.type))) {
            tagName = '<' + tagName +
              (name ? ' name="' + name + '"' : '') +
              (type ? ' type="' + type + '"' : '') + '>';
            delete attributes.name; delete attributes.type;
            
           context || (context = doc);
           id   = context === doc ? '2' : getFuseId(getWindow(context).frameElement);
           data = Data[id].nodes;
           element = data[tagName] || (data[tagName] = context.createElement(tagName));

           // avoid adding the new element to the data cache
           Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
           element = new Decorator(element.cloneNode(false));

           return element.setAttribute(attributes);  
          }
          return __create(tagName, attributes, context);
        };
        return create;
      })(create);

    if (Feature('ELEMENT_REMOVE_NODE'))
      var getFragmentFromChildNodes =  function(parentNode, cache) {
        // removeNode: removes the parent but keeps the children
        var fragment = cache.fragment;
        fragment.appendChild(parentNode).removeNode();
        return fragment;
      };

    if (Feature('DOCUMENT_RANGE'))
      var getFragmentFromChildNodes = function(parentNode, cache) {
        var range = cache.range;
        range.selectNodeContents(parentNode);
        return range.extractContents() || cache.fragment;
      },

      getFragmentCache = function(ownerDoc) {
        var id = ownerDoc === doc ? '1' : getFuseId(getWindow(ownerDoc).frameElement),
         data = Data[id];
        return (data.fragmentCache = data.fragmentCache || {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment(),
          'range':    ownerDoc.createRange()
        });
      };


    Element.create = create;

    Element.from = Fuse.get;

    Element.fromElement = fromElement;

    Dom.extendByTag = extendByTag;

    Dom.getFragmentFromString =
      Feature('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')
      ? getFromContextualFragment
      : getFromDocumentFragment;
  })();

  fromElement = Element.fromElement;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ELEMENT_INSERT_METHODS = {
      'before': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element);
      },

      'top': function(element, node) {
        element.insertBefore(node, element.firstChild);
      },

      'bottom': function(element, node) {
        element.appendChild(node);
      },

      'after': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element.nextSibling);
      }
    },

    INSERTABLE_NODE_TYPES = {
      '1':  1,
      '3':  1,
      '8':  1,
      '10': 1,
      '11': 1
    },

    INSERT_POSITIONS_USING_PARENT_NODE = {
      'before': 1,
      'after':  1
    },

    setTimeout = global.setTimeout,

    setScriptText = (function() {
      function setScriptText(element, text) {
        (element.firstChild || element.appendChild(textNode.cloneNode(false)))
          .data = text || '';
      }

      if (Feature('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY'))
        return function(element, text) { element.text = text; };

      var textNode = Fuse._doc.createTextNode('');
      if (!Bug('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT'))
        return setScriptText;

      textNode = Fuse._doc.createComment('');
      return function(element, text) {
        setScriptText(element, text);
        global.eval(element.firstChild.data);
      };
    })(),

    replaceElement = (function(){
      function replaceElement(element, node) {
        element.parentNode.replaceChild(node, element);
      }

      if (!Bug('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT'))
        return replaceElement;

      var T = ELEMENT_INSERT_METHODS,

      before = T.before,

      top    = T.top,

      bottom = T.bottom,

      after  = T.after,

      getByTagName = function(node, tagName) {
        var results = [], child = node.firstChild;
        while (child) {
          if (getNodeName(child) === tagName)
            results.push(child);
          else if (child.getElementsByTagName) {
            // concatList implementation for nodeLists
            var i = 0, pad = results.length, nodes = child.getElementsByTagName(tagName);
            while (results[pad + i] = nodes[i++]) { }
            results.length--;
          }
          child = child.nextSibling;
        }
        return results;
      },

      wrapper = function(method, element, node) {
        var textNode, i = 0, scripts = [];
        method(element, node);

        if (INSERTABLE_NODE_TYPES[node.nodeType]) {
          if (getNodeName(node) === 'SCRIPT')
            scripts = [node];
          else if (node.getElementsByTagName)
            scripts = node.getElementsByTagName('SCRIPT');
          // document fragments don't have GEBTN
          else scripts = getByTagName(node, 'SCRIPT');
        }

        while (script = scripts[i++]) {
          textNode = script.firstChild;
          setScriptText(script, textNode && textNode.data || '');
        }
      };

      // fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
      T.before = function(element, node) { wrapper(before, element, node); };
      T.top    = function(element, node) { wrapper(top,    element, node); };
      T.bottom = function(element, node) { wrapper(bottom, element, node); };
      T.after  = function(element, node) { wrapper(after,  element, node); };

      return function(element, node) {
        wrapper(replaceElement, element, node);
      };
    })();

    /*------------------------------------------------------------------------*/

    plugin.insert = function insert(insertions) {
      var content, insertContent, nodeName, position, stripped,
       element = this.raw || this;

      if (insertions) {
        if (isHash(insertions))
          insertions = insertions._object;

        content = insertions.raw || insertions;
        if (isString(content) || isNumber(content) ||
            INSERTABLE_NODE_TYPES[content.nodeType] ||
            content.toElement || content.toHTML)
          insertions = { 'bottom': content };
      }

      for (position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insertContent = ELEMENT_INSERT_METHODS[position];

        if (content && content != '') {
          if (content.toElement) content = content.toElement();
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            insertContent(element, content.raw || content);
            continue;
          }
          content = Obj.toHTML(content);
        }
        else continue;

        if (content != '') {
          stripped = content.stripScripts();
          if (stripped != '')
            insertContent(element, Fuse.Dom.getFragmentFromString(stripped,
              INSERT_POSITIONS_USING_PARENT_NODE[position] ? element.parentNode : element));

          // only evalScripts if there are scripts
          if (content.length !== stripped.length)
            setTimeout(function() { content.evalScripts(); }, 10);
        }
      }
      return this;
    };

    plugin.replace = function replace(content) {
      var html, stripped, element = this.raw || this;

      if (content && content != '') {
        if (content.toElement)
          content = content.toElement();
        else if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          content = content.raw || content;
        } else {
          html = Obj.toHTML(content);
          stripped = html.stripScripts();
          content = stripped == '' ? '' :
            Fuse.Dom.getFragmentFromString(stripped, element.parentNode);

          if (content.length !== stripped.length)
            setTimeout(function() { html.evalScripts(); }, 10);
        }
      }

      if (!content || content == '')
        element.parentNode.removeChild(element);
      else if (INSERTABLE_NODE_TYPES[content.nodeType])
        replaceElement(element, content);

      return this;
    };

    plugin.update = function update(content) {
      var stripped, element = this.raw || this;
      if (getNodeName(element) === 'SCRIPT') {
        setScriptText(element, content);
      } else {
        if (content && content != '') {
          if (content.toElement)
            content = content.toElement();
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            element.innerHTML = '';
            element.appendChild(content.raw || content);
          }
          else {
            content = Obj.toHTML(content);
            stripped = content.stripScripts();
            element.innerHTML = stripped;

            if (content.length !== stripped.length)
              setTimeout(function() { content.evalScripts(); }, 10);
          }
        }
        else element.innerHTML = '';
      }
      return this;
    };

    // fix browsers with buggy innerHTML implementations
    (function() {
      function update(content) {
        var stripped,
         element  = this.raw || this,
         nodeName = getNodeName(element),
         isBuggy  = BUGGY[nodeName];

        if (nodeName === 'SCRIPT') {
          setScriptText(element, content);
        } else {
          // remove children
          if (isBuggy) {
            while (element.lastChild)
              element.removeChild(element.lastChild);
          } else element.innerHTML = '';

          if (content && content != '') {
            if (content.toElement)
              content = content.toElement();
            if (INSERTABLE_NODE_TYPES[content.nodeType])
              element.appendChild(content.raw || content);
            else {
              content = Obj.toHTML(content);
              stripped = content.stripScripts();

              if (isBuggy) {
                if (stripped != '')
                  element.appendChild(Fuse.Dom.getFragmentFromString(stripped, element));
              }
              else element.innerHTML = stripped;

              if (content.length !== stripped.length)
                setTimeout(function() { content.evalScripts(); }, 10);
            }
          }
        }
        return this;
      };

      var BUGGY = { };
      if (Bug('ELEMENT_COLGROUP_INNERHTML_BUGGY'))
        BUGGY.COLGROUP = 1;
      if (Bug('ELEMENT_OPTGROUP_INNERHTML_BUGGY'))
        BUGGY.OPTGROUP = 1;
      if (Bug('ELEMENT_SELECT_INNERHTML_BUGGY'))
        BUGGY.SELECT   = 1;
      if (Bug('ELEMENT_TABLE_INNERHTML_BUGGY'))
        BUGGY.TABLE = BUGGY.TBODY = BUGGY.TR = BUGGY.TD =
        BUGGY.TFOOT = BUGGY.TH    = BUGGY.THEAD = 1;

      if (!isEmpty(BUGGY))
        plugin.update = update;
    })();

    // prevent JScript bug with named function expressions
    var insert = nil, replace = nil, update = nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin.cleanWhitespace = function cleanWhitespace() {
      // removes whitespace-only text node children
      var nextNode, element = this.raw || this,
       node = element.firstChild;

      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType === 3 && !/\S/.test(node.nodeValue))
          element.removeChild(node);
        node = nextNode;
      }
      return this;
    };

    plugin.isEmpty = function isEmpty() {
      return Fuse.String((this.raw || this).innerHTML).blank();
    };

    plugin.identify = (function() {
      function identify() {
        // use getAttributeto avoid issues with form elements and
        // child controls with ids/names of "id"
        var element = this.raw || this,
         id = plugin.getAttribute.call(this, 'id');
        if (id.length) return id;

        var ownerDoc = element.ownerDocument;
        do { id = 'anonymous_element_' + counter++; }
        while (ownerDoc.getElementById(id));
        plugin.setAttribute.call(this, 'id', id);
        return Fuse.String(id);
      }

      // private counter
      var counter = 0;
      return identify;
    })();

    plugin.isDetached = (function() {
      var isDetached = function isDetached() {
        var element = this.raw || this;
        return !(element.parentNode &&
          plugin.contains.call(element.ownerDocument, element));
      };

      if (Feature('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION')) {
        isDetached = function isDetached() {
          var element = this.raw || this;
          return element.ownerDocument.all[element.sourceIndex] !== element;
        };
      }
      if (Feature('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        isDetached = function isDetached() {
          /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
          var element = this.raw || this;
          return (element.ownerDocument.compareDocumentPosition(element) & 1) === 1;
        };
      }
      return isDetached;
    })();

    plugin.hide = function hide() {
      var element = this.raw || this,
       elemStyle = element.style,
       display = elemStyle.display;

      if (display && display !== 'none')
        Data[Node.getFuseId(this)].madeHidden = display;
      elemStyle.display = 'none';
      return this;
    };

    plugin.show = function show() {
      var element = this.raw || this,
       data = Data[Node.getFuseId(this)],
       elemStyle = element.style,
       display = elemStyle.display;

      if (display === 'none')
        elemStyle.display = data.madeHidden || '';

      delete data.madeHidden;
      return this;
    };

    plugin.scrollTo = function scrollTo() {
      var pos = plugin.getCumulativeOffset.call(this);
      global.scrollTo(pos[0], pos[1]);
      return this;
    };

    plugin.remove = function remove() {
      var element = this.raw || this;
      element.parentNode &&
        element.parentNode.removeChild(element);
      return this;
    };

    plugin.toggle = function toggle() {
      return plugin[plugin.isVisible.call(this) ? 'hide' : 'show'].call(this);
    };

    plugin.wrap = function wrap(wrapper, attributes) {
      var rawWrapper, element = this.raw || this;

      if (isString(wrapper))
        wrapper = Element.create(wrapper, attributes);
      if (isElement(wrapper) && (wrapper = Fuse.get(wrapper)))
        wrapper.setAttribute(attributes);
      else wrapper = Element.create('div', wrapper);

      rawWrapper = wrapper.raw;
      if (element.parentNode)
        element.parentNode.replaceChild(rawWrapper, element);
      rawWrapper.appendChild(element);
      return wrapper;
    };

    // prevent JScript bug with named function expressions
    var cleanWhitespace = nil,
     hide =               nil,
     getFuseId =          nil,
     isDetached =         nil,
     isEmpty =            nil,
     remove =             nil,
     scrollTo =           nil,
     show =               nil,
     toggle =             nil,
     wrap =               nil;
  })(Element.plugin);
