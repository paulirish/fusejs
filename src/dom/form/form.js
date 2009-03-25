  /*---------------------------------- FORM ----------------------------------*/

  global.$F = (function() {
    function $F(element) {
      element = $(element);
      var s = Field.Serializers,
       method = element && element.nodeName.toLowerCase();
      return s[method] ? s[method](element) : null;
    }
    return $F;
  })();

  global.Form = { };

  (function() {
    this.reset = function reset(form) {
      form = $(form);
      form.reset();
      return form;
    };

    this.serializeElements = function serializeElements(elements, options) {
      if (typeof options !== 'object')
        options = { 'hash': !!options };
      else if (typeof options.hash === 'undefined')
        options.hash = true;

      var element, key, value, type,
       isImageType, isSubmitButton, submitSerialized,
       i = 0, result = { }, submit = options.submit;

      /* http://www.w3.org/TR/html401/interact/forms.html#successful-controls */
      while (element = elements[i++]) {
        element = $(element);
        key     = element.name;
        value   = Field.getValue(element);
        type    = element.type;

        isImageType = type === 'image';
        isSubmitButton = type === 'submit' || isImageType;

        // reduce array value
        if (Object.isArray(value) && value.length < 2)
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
        if (Object.hasKey(result, key)) {
          // a key is already present; construct an array of values
          if (!Object.isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        }
        else result[key] = value;
      }

      return options.hash
        ? result
        : Object.toQueryString(result);
    };

    // prevent JScript bug with named function expressions
    var reset = null, serializeElements = null;
  }).call(Form);

  /*--------------------------------------------------------------------------*/

  Form.Methods = { };

  (function() {
    this.disable = function disable(form) {
      form = $(form);
      var node, nodes = Form.getElements(form), i = 0;
      while (node = nodes[i++]) Field.disable(node);
      return form;
    };

    this.enable = function enable(form) {
      form = $(form);
      var node, nodes = Form.getElements(form), i = 0;
      while (node = nodes[i++]) Field.enable(node);
      return form;
    };

    this.findFirstElement = function findFirstElement(form) {
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

    this.focusFirstElement = function focusFirstElement(form) {
      form = $(form); 
      var element = Form.findFirstElement(form); 
      element && Field.focus(element); 
      return form;
    };

    this.getElements = function getElements(form) {
      form = $(form);
      var node, results = [], i = 0,
       nodes = $(form).getElementsByTagName('*');
      while (node = nodes[i++])
        if (node.nodeType === 1 &&
            Field.Serializers[node.nodeName.toLowerCase()])
          results.push(Element.extend(node));
      return results;
    };

    this.getInputs = function getInputs(form, typeName, name) {
      form = $(form);
      var inputs = form.getElementsByTagName('input');
      if (!typeName && !name)
        return nodeListSlice.call(inputs, 0).map(Element.extend);

      var input, results = [], i = 0;
      while (input = inputs[i++])
        if ((!typeName || typeName === input.type) && (!name || name === input.name))
          results.push(Element.extend(input));

      return results;
    };

    this.request = function request(form, options) {
      form = $(form), options = Object.clone(options);

      var params = options.parameters, submit = options.submit,
       action = Element.readAttribute(form, 'action') || '';
      delete options.submit;

      if (action.blank()) action = global.location.href;
      options.parameters = Form.serialize(form, { 'submit':submit, 'hash':true });

      if (params) {
        if (typeof params === 'string') params = params.toQueryParams();
        Object.extend(options.parameters, params);
      }

      if (Element.hasAttribute(form, 'method') && !options.method)
        options.method = form.method;

      return new Ajax.Request(action, options);
    };

    this.serialize = function serialize(form, options) {
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
  }).call(Form.Methods);

  /*--------------------------------------------------------------------------*/

  global.Field = Form.Element = { };

  (function() {
    this.focus = function focus(element) {
      element = $(element);
      // avoid IE errors when element
      // or ancestors are not visible
      try { element.focus() } catch(e) { }
      return element;
    };

    this.select = function select(element) {
      (element = $(element)).select();
      return element;
    };

    // prevent JScript bug with named function expressions
    var focus = null, select = null;
  }).call(Field);

  /*--------------------------------------------------------------------------*/

  Field.Methods = { };

  (function() {
    this.disable = function disable(element) {
      element = $(element);
      element.disabled = true;
      return element;
    };

    this.enable = function enable(element) {
      element = $(element);
      element.disabled = false;
      return element;
    };

    this.present = function present(element) {
      return !!$(element).value;
    };

    this.serialize = function serialize(element) {
      element = $(element);
      if (!element.disabled && element.name) {
        var value = Field.getValue(element);
        if (Object.isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          var pair = { };
          pair[element.name] = value;
          return Object.toQueryString(pair);
        }
      }
      return '';
    };

    this.getValue = function getValue(element) {
      element = $(element);
      var method = element.nodeName.toLowerCase();
      return Field.Serializers[method](element);
    };

    this.setValue = function setValue(element, value) {
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
  }).call(Field.Methods);

  (function() {
    var matchInputButtons = /^(button|image|reset|submit)$/;

    this.activate = function activate(element) {
      element = $(element);
      try { element.focus() } catch(e) { }
      if (element.select && getNodeName(element) !== 'BUTTON' &&
          !matchInputButtons.test(element.type))
        element.select();
      return element;
    };

    this.clear = function clear(element) {
      element = $(element);
      if (getNodeName(element) !== 'BUTTON' &&
          !matchInputButtons.test(element.type))
        Field.setValue(element, null);
      return element;
    };

    // prevent JScript bug with named function expressions
    var activate = null, clear = null;
  }).call(Field.Methods);

  /*--------------------------------------------------------------------------*/

  Field.Serializers = { };

  (function() {
    this.button = function button(element, value){
      if (typeof value === 'undefined')
        return Element.readAttribute(element, 'value');
      else Element.writeAttribute(element, 'value', value);
    };

    this.input = function input(element, value) {
      var type = element.type.toLowerCase(),
       method = (type === 'checkbox' || type === 'radio')
        ? 'inputSelector' : 'textarea';
      return Field.Serializers[method](element, value);
    };

    this.inputSelector = function inputSelector(element, value) {
      if (typeof value === 'undefined')
        return element.checked ? element.value : null;
      else element.checked = !!value;
    };

    this.optionValue = function optionValue(element) {
      return element[Element.hasAttribute(element, 'value') ? 'value' : 'text'];
    };

    this.select = function select(element, value) {
      if (typeof value === 'undefined')
        return this[element.type === 'select-one' ? 
          'selectOne' : 'selectMany'](element);

      if (value === null)
        return element.selectedIndex = -1;

      var node, results = [], i = 0;
      if (Object.isArray(value)) {
        while (node = element.options[i++])
          node.selected = value.contains(this.optionValue(node));
      } else {
        while (node = element.options[i++])
          if (this.optionValue(node) === value)
            return node.selected = true;
      }
    };

    this.selectOne = function selectOne(element) {
      var index = element.selectedIndex;
      return index > -1 ? this.optionValue(element.options[index]) : null;
    };

    this.selectMany = function selectMany(element) {
      var node, results = [], i = 0;
      if (!element.options.length) return null;

      while (node = element.options[i++])
        if (node.selected) results.push(this.optionValue(node));
      return results;
    };

    this.textarea = function textarea(element, value) {
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
  }).call(Field.Serializers);
