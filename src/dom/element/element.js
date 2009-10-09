  /*-------------------------------- ELEMENT ---------------------------------*/

  // make Fuse() pass to Fuse.get()
  Fuse =
  global.Fuse = (function(__Fuse) {
    function Fuse(object, context) {
      return Fuse.get(object, context);
    }
    return Obj.extend(Class({ 'constructor': Fuse }), __Fuse,
      function(value, key, object) { if (hasKey(object, key)) object[key] = value; });
  })(Fuse);

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

  (function() {
    function $(element) {
      var elements, args = arguments, length = args.length;
      if (length > 1) {
        elements = NodeList();
        while (length--) elements[length] = $(args[length]);
        return elements;
      }
      return get(element);
    }

    function get(object, attributes, context) {
      if (isString(object)) {
        if (attributes && typeof attributes.nodeType !== 'string')
          return Element.create(object, attributes, context);

        context = attributes;
        if (object.charAt(0) == '<' && object.charAt(object.length - 1) == '>')
          return Element.create(object, context);
        object = (context || doc).getElementById(object || expando);
        return object && fromElement(object);
      }

      if (!object) return object;

      var nodeType = object.nodeType;
      if (nodeType === DOCUMENT_NODE) return Document(object);

      // bail on XML nodes, text nodes, and window objects
      return (nodeType !== ELEMENT_NODE || object == getWindow(object) ||
        !object.ownerDocument.body) ? object : fromElement(object);
    }

    function getById(id, context) {
      var element = (context || doc).getElementById(id || expando);
      return element && fromElement(element);
    }

    var doc = Fuse._doc;

    Element.from =
    Fuse.get     = get;
    Fuse.getById = getById;

    Fuse.addNS('Util');
    Fuse.Util.$ = $;
  })();

  /*--------------------------------------------------------------------------*/

  // For speed we don't normalize tagName case.
  // There is the potential for cache.div, cache.DIV, cache['<div name="x">']
  // Please stick to either all uppercase or lowercase tagNames.
  //
  // IE7 and below need to use the sTag of createElement to set the `name` attribute
  // http://msdn.microsoft.com/en-us/library/ms536389.aspx
  //
  // IE fails to set the BUTTON element's `type` attribute without using the sTag
  // http://dev.rubyonrails.org/ticket/10548

  Element.create = (function() {
    var doc = Fuse._doc,

    matchComplexTag = /^<([A-Za-z]+)>$/,

    create = function create(tagName, attributes, context) {
      var complexTag, data, element, fragment, id, html, length, nodes, result;

      // caching html strings is not supported at the moment
      if (tagName.charAt(0) == '<') {
        context = attributes;

        // support <div> format tags
        if (complexTag = tagName.match(matchComplexTag)) {
          tagName = complexTag[1];
        }
        else {
          html     = tagName;
          fragment = Fuse.Dom.getFragmentFromString(html, context);
          length   = fragment.childNodes.length;

          // single element return decorated element
          if (length < 2)
            result = fromElement(fragment.removeChild(fragment.firstChild));
          // multiple elements return a NodeList
          else {
            result = NodeList();
            while (length--)
              result[length] = fromElement(fragment.removeChild(fragment.lastChild));
          }
          return result;
        }
      }

      context = context || doc;
      id = context === doc ? '0' : getFuseId(getWindow(context).frameElement);
      data = Data[id];
      nodes = data.nodes || (data.nodes = { });
      element = nodes[tagName];

      if (!element)
        element = nodes[tagName] = context.createElement(tagName);

      element = fromElement(element.cloneNode(false));
      return attributes
        ? element.writeAttribute(attributes)
        : element;
    };

    if (Feature('CREATE_ELEMENT_WITH_HTML')) {
      var __create = create;

      create = function create(tagName, attributes, context) {
        var name, type;
        if (attributes && tagName.charAt(0) != '<' &&
           ((name = attributes.name) || (type = attributes.type))) {
          tagName = '<' + tagName +
            (name ? ' name="' + name + '"' : '') +
            (type ? ' type="' + type + '"' : '') + '>';
          delete attributes.name; delete attributes.type;
        }
        return __create(tagName, attributes, context);
      };
    }
    return create;
  })();

  /*--------------------------------------------------------------------------*/

  fromElement =
  (function() {
    var TAG_NAME_CLASSES = {
      'A':        'Anchor',
      'CAPTION':  'TableCaption',
      'COL':      'TableCol',
      'COLGROUP': 'TableCol',
      'DEL':      'Mod',
      'DIR':      'Directory',
      'DL':       'DList',
      'H1':       'Heading',
      'H2':       'Heading',
      'H3':       'Heading',
      'H4':       'Heading',
      'H5':       'Heading',
      'H6':       'Heading',
      'IFRAME':   'IFrame',
      'IMG':      'Image',
      'INS':      'Mod',
      'FIELDSET': 'FieldSet',
      'FRAMESET': 'FrameSet',
      'OL':       'OList',
      'OPTGROUP': 'OptGroup',
      'P':        'Paragraph',
      'Q':        'Quote',
      'TBODY':    'TableSection',
      'TD':       'TableCell',
      'TEXTAREA': 'TextArea',
      'TH':       'TableCell',
      'TFOOT':    'TableSection',
      'THEAD':    'TableSection',
      'TR':       'TableRow',
      'UL':       'UList'
    },

    Decorator = function() { },

    Dom = Fuse.Dom,

    doc = Fuse._doc,

    getFuseId = Node.getFuseId;

    function getOrCreateTagClass(tagName) {
      var tagClassName = (TAG_NAME_CLASSES[tagName.toUpperCase()] ||
         capitalize.call(tagName)) + 'Element',
       tagClass = Dom[tagClassName];

      return tagClass || (Dom[tagClassName] = Class(Element, {
        'constructor': function(element) {
          return element && (element.raw ?
            element : fromElement(element));
        }
      }));
    }

    function fromElement(element) {
      // return if already a decorator
      if (element.raw) return element;

      var decorated, tagClass,
       id = getFuseId(element),
       data = Data[id];

      // return cached if available
      if (data.decorator) return data.decorator;

      Decorator.prototype =
        getOrCreateTagClass(element.nodeName).plugin;

      data.decorator =
      decorated = new Decorator;

      data.node =
      decorated.raw = element;
      decorated.style = element.style;

      return decorated;
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

    Element.fromElement = fromElement;
    Dom.extendByTag = extendByTag;
    return fromElement;
  })();

  /*--------------------------------------------------------------------------*/

  Fuse.Dom.getFragmentFromString = (function() {

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

    doc = Fuse._doc,

    getFuseId = Node.getFuseId,

    matchStartsWithTableRow = /^<[tT][rR]/,

    matchTagName= /^<([^> ]+)/,

    getFragmentCache = (function() {
      if (Feature('DOCUMENT_RANGE'))
        return function(ownerDoc) {
          var id = ownerDoc === doc ? '0' : getFuseId(getWindow(ownerDoc).frameElement),
           data = Data[id];
          return (data.fragmentCache = data.fragmentCache || {
            'node':     ownerDoc.createElement('div'),
            'fragment': ownerDoc.createDocumentFragment(),
            'range':    ownerDoc.createRange()
          });
        };

      return function(ownerDoc) {
        var id = ownerDoc === doc ? '0' : getFuseId(getWindow(ownerDoc).frameElement),
         data = Data[id];
        return (data.fragmentCache = data.fragmentCache || {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment()
        });
      };
    })(),

    getFragmentFromChildNodes = (function() {
      if (Feature('ELEMENT_REMOVE_NODE'))
        return function(parentNode, cache) {
          // removeNode: removes the parent but keeps the children
          var fragment = cache.fragment;
          fragment.appendChild(parentNode).removeNode();
          return fragment;
        };

      if (Feature('DOCUMENT_RANGE'))
        return function(parentNode, cache) {
          var range = cache.range;
          range.selectNodeContents(parentNode);
          return range.extractContents() || cache.fragment;
        };

      return function(parentNode, cache) {
        var fragment = cache.fragment,
         nodes = parentNode.childNodes,
         length = node.length;

        while (length--)
          fragment.insertBefore(nodes[length], fragment.firstChild);
        return fragment;
      };
    })();

    function getFromDocumentFragment(html, context, cache) {
       context = context || Fuse._body || Fuse._docEl;
       cache = cache || getFragmentCache(context.ownerDocument || context);
       var node = cache.node,
        nodeName = context.nodeType === DOCUMENT_NODE
          ? FROM_STRING_CHILDRENS_PARENT_KEYS[tagName.match(matchTagName)[1].toUpperCase()]
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

    function getFromContextualFragment(html, context) {
      try {
        // 1) Konqueror throws when trying to create a fragment from
        //    incompatible markup such as table rows. Similar to IE's issue
        //    with setting table's innerHTML.
        //
        // 2) WebKit and KHTML throw when creating contextual fragments from
        //    orphaned elements.

        context = context || Fuse._body || Fuse._docEl;
        var cache = getFragmentCache(context.ownerDocument || context),
         range = cache.range;
        range.selectNode(context.firstChild);
        return range.createContextualFragment(html);
      } catch (e) {
        return getFromDocumentFragment(html, context, cache);
      }
    }

    return Feature('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')
      ? getFromContextualFragment
      : getFromDocumentFragment;
  })();

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
        element.removeChild(element.firstChild);
        element.appendChild(textNode.cloneNode(false)).data = text;
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
        if (INSERTABLE_NODE_TYPES[node.nodeType]) {
          if (getNodeName(node) === 'SCRIPT')
            scripts = [node];
          else if (node.getElementsByTagName)
            scripts = node.getElementsByTagName('SCRIPT');
          // Safari 2 fragments don't have GEBTN
          else scripts = getByTagName(node, 'SCRIPT');
        }

        method(element, node);
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
        if (isString(content) || INSERTABLE_NODE_TYPES[content.nodeType] ||
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
            insertContent(element, content);
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
            element.appendChild(content);
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
            if (content.toElement) content = content.toElement();
            if (INSERTABLE_NODE_TYPES[content.nodeType]) element.appendChild(content);
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

    plugin.empty = function empty() {
      return Fuse.String((this.raw || this).innerHTML).blank();
    };

    plugin.identify = (function() {
      function identify() {
        // use readAttribute to avoid issues with form elements and
        // child controls with ids/names of "id"
        var element = this.raw || this,
         id = plugin.readAttribute.call(this, 'id');
        if (id.length) return id;

        var ownerDoc = element.ownerDocument;
        do { id = 'anonymous_element_' + counter++; }
        while (ownerDoc.getElementById(id));
        plugin.writeAttribute.call(this, 'id', id);
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
          plugin.descendantOf.call(element.ownerDocument));
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
      var pos = plugin.cumulativeOffset.call(this);
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
      var element = this.raw || this;

      if (isString(wrapper))
        wrapper = Element.create(wrapper, attributes);
      if (isElement(wrapper = wrapper.raw || Fuse.get(wrapper)))
        wrapper.writeAttribute(attributes);
      else wrapper = Element.create('div', wrapper);

      wrapper = wrapper.raw;
      if (element.parentNode)
        element.parentNode.replaceChild(wrapper, element);
      wrapper.appendChild(element);
      return wrapper;
    };

    // prevent JScript bug with named function expressions
    var cleanWhitespace = nil,
     empty =              nil,
     hide =               nil,
     getFuseId =          nil,
     isDetached =         nil,
     remove =             nil,
     scrollTo =           nil,
     show =               nil,
     toggle =             nil,
     wrap =               nil;
  })(Element.plugin);
