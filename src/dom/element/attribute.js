  /*--------------------------- ELEMENT: ATTRIBUTE ---------------------------*/

  Object.extend(Element.Methods, (function() {
    var FORM_CHILDNODES_ARE_ATTRIBUTES     = Bug('FORM_CHILDNODES_ARE_ATTRIBUTES'),
     ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR = Bug('ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR');

    var getNamespacedAttribute = (function() {
      if (ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR &&
          Feature('ELEMENT_GET_ATTRIBUTE_IFLAG')) {
        return function(element, name) {
          return element.getAttribute(name, 2) || '';
        };
      }
      return K;
    })();

    function readAttribute(element, name) {
      element = $(element);
      var result, t = Element._attributeTranslations;
      name = t.names[name] || name;

      if (FORM_CHILDNODES_ARE_ATTRIBUTES &&
        element.tagName.toUpperCase() === 'FORM' &&
          typeof element[name] !== 'string') {
        element = element.cloneNode(false);
      }

      if (t.read[name])
        result = t.read[name](element, name);
      else if (ELEMENT_TABLE_XMLLANG_ATTRIBUTE_ERROR && name.include(':')) {
        result = getNamespacedAttribute(element, name);
      } else result = element.getAttribute(name);

      return result || '';
    }

    function writeAttribute(element, name, value) {
      element = $(element);
      var attributes = { }, t = Element._attributeTranslations;

      if (typeof name == 'object') attributes = name;
      else attributes[name] = (typeof value === 'undefined') ? true : value;

      for (var attr in attributes) {
        name = t.names[attr] || attr;
        value = attributes[attr];

        if (t.write[name]) name = t.write[name](element, value);
        if (value === false || value === null)
          element.removeAttribute(name);
        else if (value === true)
          element.setAttribute(name, name);
        else element.setAttribute(name, value);
      }
      return element;
    }

    return {
      'readAttribute':  readAttribute,
      'writeAttribute': writeAttribute
    };
  })());

  /*--------------------------------------------------------------------------*/

  (function() {
    // No use of $ in this function in order to keep things fast.
    // Used by the Selector class.  
    function hasAttribute(element, attribute) {
      if (element.hasAttribute) return element.hasAttribute(attribute);
      return Element.Methods.Simulated.hasAttribute(element, attribute);
    }

    function simulatedHasAttribute(element, attribute) {
      attribute = Element._attributeTranslations.has[attribute] || attribute;
      var node = element.getAttributeNode(attribute);
      return !!(node && node.specified);
    }

    Object.extend(Element.Methods.Simulated, { 'hasAttribute': simulatedHasAttribute });
    Element.hasAttribute = hasAttribute;
  })();

  /*--------------------------------------------------------------------------*/

  Element._attributeTranslations = {
    'has':     { },
    'names':   { }
  };

  Element._attributeTranslations.read = (function() {
    function flag(attribute) {
      var lower = attribute.toLowerCase();
      return function(element) {
        return Element.hasAttribute(element, attribute) ? lower : '';
      };
    }

    function getAttr(element, attribute) {
      return element.getAttribute(attribute, 2);
    }

    function getAttrNode(element, attribute) {
      var node = element.getAttributeNode(attribute);
      return node && node.value;
    }

    function getEv(element, attribute) {
      attribute = element.getAttribute(attribute);
      if (typeof attribute !== 'function') return '';
      var source = attribute.toString();
      return source.indexOf('function anonymous()\n{\n') === 0 ?
        source.slice(23, -2) : '';
    }
 
    return {
      '_flag':        flag,
      '_getAttr':     getAttr,
      '_getAttrNode': getAttrNode,
      '_getEv':       getEv
    };
  })();

  Element._attributeTranslations.write = (function() {
    function checked(element, value) {
      element.checked = !!value;
    }

    function setAttrNode(name) {
      return function(element, value) {
        var attr = element.getAttributeNode(name);
        if (!attr) {
          attr = element.ownerDocument.createAttribute(name);
          element.setAttributeNode(attr);
        }
        attr.value = value;
      };
    }

    return {
      '_setAttrNode': setAttrNode,
      'checked':      checked
    };
  })();

  (function(T) {
    var Has = T.has, Names = T.names, 
     Read = T.read, Write = T.write;

    // mandate flag attributes return their name
    $w('checked disabled isMap multiple readOnly')._each(function(attr) {
      Read[attr] = Read._flag(attr);
    });

    // translate "htmlFor"
    (function() {
      var label = doc.createElement('label');
      label.htmlFor = 'test';
      if (label.getAttribute('for') === 'test')
        Names.htmlFor = 'for';
      else Names['for'] = 'htmlFor';
    })();

    // get and set "encType"
    (function() {
      var form = doc.createElement('form');
      form.setAttribute('encType', 'multipart/form-data');
      if (form.getAttribute('encType') !== 'multipart/form-data') {
        Read.encType  = Read._getAttrNode;
        Write.encType = Write._setAttrNode('encType');
      }
    })();

    // get and set "value"
    (function() {
      var button = doc.createElement('button');
      button.appendChild(doc.createTextNode('inner text'));
      if (button.getAttribute('value')) {
        Read.value  = Read._getAttrNode;
        Write.value = Write._setAttrNode('value');
      }
    })();

    (function() {
      function getTitle(element) {
        return element.title;
      }

      function getStyleAttribute(element) {
        return (element.style.cssText || '').toLowerCase();
      }

      function setStyleAttribute(element, value) {
        element.style.cssText = value || '';
      }

      // translate "className"
      dummy.className = 'test';
      if (dummy.getAttribute('class') === 'test')
        Names.className = 'class';
      else Names['class'] = 'className';

      // get and set "style"
      dummy.setAttribute('style', 'display:block');
      var style = dummy.getAttribute('style');
      if (!(typeof style === 'string' && style.startsWith('display:block'))) {
        Read.style  = getStyleAttribute;
        Write.style = setStyleAttribute;
      }

      // get "title"
      dummy.title = 'test';
      if (!dummy.getAttribute('title'))
        Read.title = getTitle;

      // are attributes case sensitive ?
      dummy.setAttribute('accesskey', 1);
      if (dummy.accessKey !== 1) {
        // add camel-cased attributes to the name translations
        $w('bgColor codeBase codeType cellPadding cellSpacing colSpan rowSpan vAlign vLink aLink ' +
           'dateTime accessKey tabIndex encType maxLength readOnly longDesc frameBorder isMap ' +
           'useMap noHref noResize noShade noWrap marginWidth marginHeight')._each(function(attr) {
          var lower = attr.toLowerCase();
          Has[lower] = Names[lower] = attr;
        });
      }

      dummy.innerHTML = '<a href="test.html" onclick="test()"></a>';
      var anchor = dummy.firstChild;

      // check if "href" and other uri attributes need fixing
      if (Feature('ELEMENT_GET_ATTRIBUTE_IFLAG') &&
          !(anchor.getAttribute('href') || '').toString().startsWith('test.html')) {
        $w('data href longdesc src')._each(function(attr) {
          Read[attr] = Read._getAttr;
        });
      }

      // can read event attributes ?
      var onclick = (anchor.getAttribute('onclick') || '').toString();
      if (!onclick || onclick.startsWith('function anonymous()')) {
        $w('blur change click contextmenu dblclick error focus load keydown keypress keyup mousedown ' +
           'mousemove mouseout mouseover mouseup readystatechange reset submit select unload')._each(function(attr) {
          Read['on' + attr] = Read._getEv;
        });
      }

      // cleanup dummy
      dummy.innerHTML = dummy.accessKey = dummy.className = dummy.title = '';
    })();

  })(Element._attributeTranslations);
  