  /*--------------------------- ELEMENT: ATTRIBUTE ---------------------------*/

  Element.Attribute = {
    'contentNames': { },
    'read':         { },
    'write':        { },
    'names': { 'htmlFor':'for', 'className':'class' }
  };

  (function(Methods) {
    var ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS =
      Bug('ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS');

    // No use of $ in this function in order to keep things fast.
    // Used by the Selector class.  
    function hasAttribute(element, attribute) {
      var node = element.getAttributeNode(attribute);
      return !!node && node.specified;
    }

    function staticHasAttribute(element, attribute) {
      if (element.hasAttribute)
        return element.hasAttribute(attribute);
      return Methods.Simulated.hasAttribute(element, attribute);
    }

    function readAttribute(element, name) {
      element = $(element);
      var result, T = Element.Attribute;
      name = T.names[name] || name;

      if (T.read[name])
        result = T.read[name](element, name);
      else result = (result = element.getAttributeNode(name)) && result.value;
      return result || '';
    }

    function writeAttribute(element, name, value) {
      element = $(element);
      var node, contentName, attr,
       attributes = { }, T = Element.Attribute;

      if (typeof name !== 'string') attributes = name;
      else attributes[name] = (typeof value === 'undefined') ? true : value;

      for (attr in attributes) {
        name = T.names[attr] || attr;
        contentName = T.contentNames[attr] || attr;
        value = attributes[attr];

        if (T.write[name])
          T.write[name](element, value);
        else if (value === false || value === null)
          element.removeAttribute(contentName);
        else if (value === true)
          element.setAttribute(contentName, contentName);
        else {
          if (ATTRIBUTE_NODES_PERSIST_ON_CLONED_ELEMENTS &&
              Element.hasAttribute(element, name))
            element.removeAttribute(contentName);
          element.setAttribute(contentName, value);
        }
      }
      return element;
    }

    Element.hasAttribute   = staticHasAttribute;
    Methods.readAttribute  = readAttribute;
    Methods.writeAttribute = writeAttribute;
    Methods.Simulated.hasAttribute = hasAttribute;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function(T) {
    function getAttribute(element, attribute) {
      return element.getAttribute(attribute);
    }

    function getEvent(element, attribute) {
      var node = element.getAttributeNode(attribute);
      return node && node.specified && node.value;
    }

    function getExact(element, attribute) {
      return element.getAttribute(attribute, 2);
    }

    function getFlag(attribute) {
      var lower = attribute.toLowerCase();
      return function(element) {
        return Element.hasAttribute(element, attribute) ? lower : '';
      };
    }

    function getStyle(element) {
      return element.style.cssText.toLowerCase();
    }

    function setChecked(element, value) {
      element.checked = !!value;
    }

    function setNode(name) {
      return function(element, value) {
        var attr = element.getAttributeNode(name);
        if (!attr) {
          attr = element.ownerDocument.createAttribute(name);
          element.setAttributeNode(attr);
        }
        attr.value = value;
      };
    }

    function setStyle(element, value) {
      element.style.cssText = value || '';
    }

    // mandate getter / setters
    T.read.type     = getAttribute;
    T.write.checked = setChecked;

    // mandate flag attributes return their name
    $w('checked disabled isMap multiple readOnly')._each(function(attr) {
      T.read[attr] = getFlag(attr);
    });

    // mandate event attribute getter
    $w('blur change click contextmenu dblclick error focus load keydown ' +
       'keypress keyup mousedown mousemove mouseout mouseover mouseup ' +
       'readystatechange reset submit select unload')._each(function(attr) {
      T.read['on' + attr] = getEvent;
    });

    // add camel-cased attributes to name translations
    $w('bgColor codeBase codeType cellPadding cellSpacing colSpan rowSpan ' +
       'vAlign vLink aLink dateTime accessKey tabIndex encType maxLength ' +
       'readOnly longDesc frameBorder isMap useMap noHref noResize noShade ' +
       'noWrap marginWidth marginHeight')._each(function(attr) {
      var lower = attr.toLowerCase();
      T.contentNames[lower] = T.names[lower] = attr;
    });

    // capability checks
    (function() {
      var node, value, form = Fuse._doc.createElement('form'),
       label  = Fuse._doc.createElement('label'),
       button = Fuse._doc.createElement('button');

      label.htmlFor = label.className = 'test';
      label.setAttribute('style', 'display:block');
      form.setAttribute('encType', 'multipart/form-data');
      button.appendChild(Fuse._doc.createTextNode('inside value'));
      button.setAttribute('value', 'test');

      // translate content name `htmlFor`
      if (label.getAttribute('htmlFor') === 'test')
        T.contentNames['for'] = 'htmlFor';
      else T.contentNames.htmlFor = 'for';

      // translate content name `className`
      if (label.getAttribute('className') === 'test')
        T.contentNames['class'] = 'className';
      else T.contentNames.className = 'class';

      // set `encType`
      if ((node = form.getAttributeNode('encType')) && 
          node.value !== 'multipart/form-data') {
        T.write.encType = setNode('encType');
      }

      // set `value`
      // http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-30233917
      value = (node = button.getAttributeNode('value')) && node.value;
      if (value !== 'test') T.write.value = setNode('value');

      // get and set `style` attribute
      value = (node = label.getAttributeNode('style')) && node.value;
      if (typeof value !== 'string' || !value.startsWith('display:block')) {
        T.read.style  = getStyle;
        T.write.style = setStyle;
      }

      // get `href` and other uri attributes
      // TODO: Check others attributes like action, cite, codeBase, lowsrc, and useMap.
      // Opera 9.25 will automatically translate `action` uri's from relative to absolute.
      if (Feature('ELEMENT_GET_ATTRIBUTE_IFLAG')) {
        $w('data href longDesc src')
          ._each(function(attr) { T.read[attr] = getExact });
      }
    })();
  })(Element.Attribute);