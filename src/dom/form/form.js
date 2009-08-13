  /*---------------------------------- FORM ----------------------------------*/

  Fuse.addNS('Util');

  Fuse.Util.$F = (function() {
    function $F(element) {
      element = $(element);
      var s = Field.Serializers,
       method = element && element.nodeName.toLowerCase();
      return s[method] ? s[method](element) : null;
    }
    return $F;
  })();

  /*--------------------------------------------------------------------------*/

  global.Form = { };

  (function() {
    Form.reset = function reset(form) {
      form = $(form);
      form.reset();
      return form;
    };

    Form.serializeElements = function serializeElements(elements, options) {
      if (typeof options !== 'object')
        options = { 'hash': !!options };
      else if (typeof options.hash === 'undefined')
        options.hash = true;

      var element, key, value, type,
       isImageType, isSubmitButton, submitSerialized,
       i = 0, result = Fuse.Object(), submit = options.submit;

      /* http://www.w3.org/TR/html401/interact/forms.html#successful-controls */
      while (element = elements[i++]) {
        element = $(element);
        key     = element.name;
        value   = Field.getValue(element);
        type    = element.type;

        isImageType = type === 'image';
        isSubmitButton = type === 'submit' || isImageType;

        // reduce array value
        if (isArray(value) && value.length < 2)
          value = value[0];

        if (value == null    || // controls with null/undefined values are unsuccessful
            element.disabled || // disabled elements are unsuccessful
            type === 'file'  || // skip file inputs;
            type === 'reset' || // reset buttons are unsuccessful
            (isSubmitButton &&  // non-active submit buttons are unsuccessful
            (submit === false || submitSerialized ||
            (submit && !(key === submit || element === submit))))) {
          continue;
        }
        if (isSubmitButton) {
          submitSerialized = true;
          if (isImageType) {
            var prefix = key ? key + '.' : '',
             x = options.x || 0, y = options.y || 0;
            result[prefix + 'x'] = x;
            result[prefix + 'y'] = y;
          }
        }
        if (!key) continue;

        // property exists and and belongs to result
        if (hasKey(result, key)) {
          // a key is already present; construct an array of values
          if (!isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        }
        else result[key] = value;
      }

      return options.hash
        ? result
        : Obj.toQueryString(result);
    };

    // prevent JScript bug with named function expressions
    var reset = null, serializeElements = null;
  })();

  /*--------------------------------------------------------------------------*/

  Form.Methods = { };

  (function(methods) {
    methods.disable = function disable(form) {
      form = $(form);
      var node, nodes = Form.getElements(form), i = 0;
      while (node = nodes[i++]) Field.disable(node);
      return form;
    };

    methods.enable = function enable(form) {
      form = $(form);
      var node, nodes = Form.getElements(form), i = 0;
      while (node = nodes[i++]) Field.enable(node);
      return form;
    };

    methods.findFirstElement = function findFirstElement(form) {
      var firstByIndex, firstNode, node,
       nodes = $(form).getElements(), minTabIndex = Infinity, i = 0;

      while (node = nodes[i++]) {
        if (node.type !== 'hidden' && !node.disabled && !firstNode)
          firstNode = node;
        if (Element.hasAttribute(node, 'tabIndex') && node.tabIndex > -1 &&
            node.tabIndex < minTabIndex) {
          minTabIndex = node.tabIndex;
          firstByIndex = node;
        }
      }
      return firstByIndex || firstNode;
    };

    methods.focusFirstElement = function focusFirstElement(form) {
      form = $(form);
      var element = Form.findFirstElement(form);
      element && Field.focus(element);
      return form;
    };

    methods.getElements = function getElements(form) {
      form = $(form);
      var node, results = Fuse.List(), i = 0,
       nodes = $(form).getElementsByTagName('*');
      while (node = nodes[i++])
        if (node.nodeType === 1 &&
            Field.Serializers[node.nodeName.toLowerCase()])
          results.push(Element.extend(node));
      return results;
    };

    methods.getInputs = function getInputs(form, typeName, name) {
      form = $(form);
      typeName = String(typeName || '');
      name = String(typeName || '');

      var input, inputs = form.getElementsByTagName('input'),
       results = Fuse.List(), i = 0;

      if (!typeName && !name) {
        while (input = inputs[i]) results[i++] = Element.extend(input);
      }
      else if (typeName && !name) {
        while (input = inputs[i++])
          if (typeName === input.type) results.push(Element.extend(input));
      }
      else {
        while (input = inputs[i++])
          if ((!typeName || typeName === input.type) && (!name || name === input.name))
            results.push(Element.extend(input));
      }
      return results;
    };

    methods.request = function request(form, options) {
      form = $(form);
      options = clone(options);

      var params = options.parameters, submit = options.submit,
       action = Element.readAttribute(form, 'action') || Fuse.String('');
      delete options.submit;

      if (action.blank()) action = global.location.href;
      options.parameters = Form.serialize(form, { 'submit':submit, 'hash':true });

      if (params) {
        if (isString(params)) params = Fuse.String(params).toQueryParams();
        Obj.extend(options.parameters, params);
      }

      if (Element.hasAttribute(form, 'method') && !options.method)
        options.method = form.method;

      return new Fuse.Ajax.Request(action, options);
    };

    methods.serialize = function serialize(form, options) {
      return Form.serializeElements(Form.getElements(form), options);
    };

    // prevent JScript bug with named function expressions
    var disable =        null,
     enable =            null,
     findFirstElement =  null,
     focusFirstElement = null,
     getElements =       null,
     getInputs =         null,
     request =           null,
     serialize =         null;
  })(Form.Methods);

  /*--------------------------------------------------------------------------*/

  global.Field = Form.Element = { };

  (function() {
    Field.focus = function focus(element) {
      element = $(element);
      // avoid IE errors when element
      // or ancestors are not visible
      try { element.focus() } catch(e) { }
      return element;
    };

    Field.select = function select(element) {
      (element = $(element)).select();
      return element;
    };

    // prevent JScript bug with named function expressions
    var focus = null, select = null;
  })();

  /*--------------------------------------------------------------------------*/

  Field.Methods = { };

  (function(methods) {
    methods.disable = function disable(element) {
      element = $(element);
      element.disabled = true;
      return element;
    };

    methods.enable = function enable(element) {
      element = $(element);
      element.disabled = false;
      return element;
    };

    methods.present = function present(element) {
      return !!$(element).value;
    };

    methods.serialize = function serialize(element) {
      element = $(element);
      if (!element.disabled && element.name) {
        var value = Field.getValue(element);
        if (isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          var pair = { };
          pair[element.name] = value;
          return Obj.toQueryString(pair);
        }
      }
      return '';
    };

    methods.getValue = function getValue(element) {
      element = $(element);
      var method = element.nodeName.toLowerCase();
      return Field.Serializers[method](element);
    };

    methods.setValue = function setValue(element, value) {
      element = $(element);
      var method = element.nodeName.toLowerCase();
      Field.Serializers[method](element, value || null);
      return element;
    };

    // prevent JScript bug with named function expressions
    var disable = null,
     enable =     null,
     getValue =   null,
     present =    null,
     serialize =  null,
     setValue =   null;
  })(Field.Methods);

  (function(methods) {
    var matchInputButtons = /^(button|image|reset|submit)$/;

    methods.activate = function activate(element) {
      element = $(element);
      try { element.focus() } catch(e) { }
      if (element.select && getNodeName(element) !== 'BUTTON' &&
          !matchInputButtons.test(element.type))
        element.select();
      return element;
    };

    methods.clear = function clear(element) {
      element = $(element);
      if (getNodeName(element) !== 'BUTTON' &&
          !matchInputButtons.test(element.type))
        Field.setValue(element, null);
      return element;
    };

    // prevent JScript bug with named function expressions
    var activate = null, clear = null;
  })(Field.Methods);

  /*--------------------------------------------------------------------------*/

  Field.Serializers = { };

  (function(serializers) {
    serializers.button = function button(element, value){
      if (typeof value === 'undefined')
        return Element.readAttribute(element, 'value');
      else Element.writeAttribute(element, 'value', value);
    };

    serializers.input = function input(element, value) {
      var type = element.type.toLowerCase(),
       method = (type === 'checkbox' || type === 'radio')
        ? 'inputSelector' : 'textarea';
      return Field.Serializers[method](element, value);
    };

    serializers.inputSelector = function inputSelector(element, value) {
      if (typeof value === 'undefined')
        return element.checked ? element.value : null;
      else element.checked = !!value;
    };

    serializers.optionValue = function optionValue(element) {
      return element[Element.hasAttribute(element, 'value') ? 'value' : 'text'];
    };

    serializers.select = function select(element, value) {
      if (typeof value === 'undefined')
        return this[element.type === 'select-one' ?
          'selectOne' : 'selectMany'](element);

      if (value === null)
        return element.selectedIndex = -1;

      var node, i = 0;
      if (isArray(value)) {
        value = expando + value.join(expando) + expando;
        while (node = element.options[i++])
          node.selected = value.indexOf(expando + this.optionValue(node) +expando) > -1;
      } else {
        while (node = element.options[i++])
          if (this.optionValue(node) === value)
            return (node.selected = true);
      }
    };

    serializers.selectOne = function selectOne(element) {
      var index = element.selectedIndex;
      return index > -1 ? this.optionValue(element.options[index]) : null;
    };

    serializers.selectMany = function selectMany(element) {
      var node, results = Fuse.List(), i = 0;
      if (!element.options.length) return null;

      while (node = element.options[i++])
        if (node.selected) results.push(this.optionValue(node));
      return results;
    };

    serializers.textarea = function textarea(element, value) {
      if (typeof value === 'undefined') return element.value;
      else element.value = value || '';
    };

    // prevent JScript bug with named function expressions
    var button =     null,
     input =         null,
     inputSelector = null,
     optionValue =   null,
     select =        null,
     selectOne =     null,
     selectMany =    null,
     textarea =      null;
  })(Field.Serializers);
