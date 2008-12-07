  /*---------------------------------- FORM ----------------------------------*/

  $F = function(element) {
    element = $(element);
    var s = Form.Element.Serializers,
     method = element && element.tagName.toLowerCase();
    return s[method] ? s[method](element) : null;
  };

  Form = (function() {
    function reset(form) {
      form = $(form);
      form.reset();
      return form;
    }

    function serializeElements(elements, options) {
      if (typeof options !== 'object') options = { hash: !!options };
      else if (typeof options.hash === 'undefined') options.hash = true;

      var key, value, type, isImageType, isSubmitButton,
       submitSerialized, submit = options.submit;

      var data = elements.inject({ }, function(result, element) {
        element = $(element);
        key     = element.name;
        value   = Form.Element.getValue(element);
        type    = element.type;

        isImageType = type === 'image';
        isSubmitButton = type === 'submit' || isImageType;

        // reduce array value
        if (Object.isArray(value) && value.length < 2)
          value = value[0];
        // null/undefined values don't get serialized
        if (value == null) return result;
        // disabled elements don't get serialized
        if (element.disabled) return result;
        // <input type="file|reset" /> don't get serialized
        if (type === 'file' || type === 'reset') return result;
        // non-active submit buttons don't get serialized
        if (isSubmitButton &&
         (submit === false || submitSerialized ||
         (submit && !(key === submit || element === submit))))
          return result;

        if (isSubmitButton) {
          submitSerialized = true;
          if (isImageType) {
            var prefix = key ? key + '.' : '',
             x = options.x || 0, y = options.y || 0;
            result[prefix + 'x'] = x;
            result[prefix + 'y'] = y;
          }
        }
        if (!key) return result;
        // property exists and and belongs to result
        if (key in result && result[key] !== Object.prototype[key]) {
          // a key is already present; construct an array of values
          if (!Object.isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        } else result[key] = value;

        return result;
      });

      return options.hash ? data : Object.toQueryString(data);
    }

    return {
      'reset':             reset,
      'serializeElements': serializeElements
    };
  })();

  /*--------------------------------------------------------------------------*/

  Form.Methods = (function() {
    function disable(form) {
      form = $(form);
      Form.getElements(form).invoke('disable');
      return form;
    }

    function enable(form) {
      form = $(form);
      Form.getElements(form).invoke('enable');
      return form;
    }

    function findFirstElement(form) {
      var elements = $(form).getElements().findAll(function(element) {
        return 'hidden' != element.type && !element.disabled;
      });
      var firstByIndex = elements.findAll(function(element) {
        return Element.hasAttribute(element, 'tabIndex') && element.tabIndex >= 0;
      }).sortBy(function(element) { return element.tabIndex }).first();

      return firstByIndex ? firstByIndex : elements.find(function(element) {
        return ['button', 'input', 'select', 'textarea'].include(element.tagName.toLowerCase());
      });
    }

    function focusFirstElement(form) {
      form = $(form); 
      var element = Form.findFirstElement(form); 
      element && Form.Element.activate(element); 
      return form;
    }

    function getElements(form) {
      var elements = [], nodes = $(form).getElementsByTagName('*');
      for (var i = 0, node; node = nodes[i++]; ) {
        if (node.nodeType === 1 && 
            Form.Element.Serializers[node.tagName.toLowerCase()]) {
          elements.push(Element.extend(node));
        }
      }
      return elements;
    }

    function getInputs(form, typeName, name) {
      form = $(form);
      var inputs = form.getElementsByTagName('input');

      if (!typeName && !name)
        return nodeListSlice.call(inputs, 0).map(Element.extend);

      for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
        var input = inputs[i];
        if ((typeName && input.type != typeName) || (name && input.name != name))
          continue;
        matchingInputs.push(Element.extend(input));
      }

      return matchingInputs;
    }

    function request(form, options) {
      form = $(form), options = Object.clone(options || { });

      var params = options.parameters, submit = options.submit,
       action = form.readAttribute('action') || '';
      delete options.submit;

      if (action.blank()) action = global.location.href;
      options.parameters = form.serialize({ submit:submit, hash:true });

      if (params) {
        if (typeof params === 'string') params = params.toQueryParams();
        Object.extend(options.parameters, params);
      }

      if (form.hasAttribute('method') && !options.method)
        options.method = form.method;

      return new Ajax.Request(action, options);
    }

    function serialize(form, options) {
      return Form.serializeElements(Form.getElements(form), options);
    }

    return {
      'disable':           disable,
      'enable':            enable,
      'findFirstElement':  findFirstElement,
      'focusFirstElement': focusFirstElement,
      'getElements':       getElements,
      'getInputs':         getInputs,
      'request':           request,
      'serialize':         serialize
  };
  })();

  /*--------------------------------------------------------------------------*/

  Field = Form.Element = (function() {
    function focus(element) {
      (element = $(element)).focus();
      return element;
    }

    function select(element) {
      (element = $(element)).select();
      return element;
    }

    return {
      'focus':  focus,
      'select': select
  };
  })();

  /*--------------------------------------------------------------------------*/

  Form.Element.Methods = (function() {
    function activate(element) {
      element = $(element);
      try {
        element.focus();
        if (element.select && element.tagName.toUpperCase() != 'BUTTON' &&
            !['button', 'reset', 'submit'].include(element.type))
          element.select();
      } catch (e) { }
      return element;
    }

    function clear(element) {
      element = $(element);
      if (element.tagName.toUpperCase() != 'BUTTON' &&
          !['button', 'image', 'reset', 'submit'].include(element.type))
        Form.Element.setValue(element, null);
      return element;
    }

    function disable(element) {
      element = $(element);
      element.disabled = true;
      return element;
    }

    function enable(element) {
      element = $(element);
      element.disabled = false;
      return element;
    }

    function present(element) {
      return $(element).value != '';
    }

    function serialize(element) {
      element = $(element);
      if (!element.disabled && element.name) {
        var value = Form.Element.getValue(element);
        if (Object.isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          var pair = { };
          pair[element.name] = value;
          return Object.toQueryString(pair);
        }
      }
      return '';
    }

    function getValue(element) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      return Form.Element.Serializers[method](element);
    }

    function setValue(element, value) {
      element = $(element);
      var method = element.tagName.toLowerCase();
      Form.Element.Serializers[method](element, value || null);
      return element;
    }

    return {
      'activate':  activate,
      'clear':     clear,
      'disable':   disable,
      'enable':    enable,
      'getValue':  getValue,
      'present':   present,
      'serialize': serialize,
      'setValue':  setValue
  };
  })();

  /*--------------------------------------------------------------------------*/

  Form.Element.Serializers = (function() {
    function button(element, value){
      if (typeof value === 'undefined') return Element.readAttribute(element, 'value');
      else Element.writeAttribute(element, 'value', value);
    }

    function input(element, value) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':  
        case 'radio':
          return Form.Element.Serializers.inputSelector(element, value);
        default:
          return Form.Element.Serializers.textarea(element, value);
      }
    }

    function inputSelector(element, value) {
      if (typeof value === 'undefined') return element.checked ? element.value : null;
      else element.checked = !!value;
    }

    function optionValue(opt) {
      // extend element because hasAttribute may not be native
      return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
    }

    function select(element, value) {
      if (typeof value === 'undefined')
        return this[element.type == 'select-one' ? 
          'selectOne' : 'selectMany'](element);
      else {
        var opt, currentValue, single = !Object.isArray(value);
        if (value === null) {
          element.selectedIndex = -1;
          return;
        }
        for (var i = 0, length = element.length; i < length; i++) {
          opt = element.options[i];
          currentValue = this.optionValue(opt);
          if (single) {
            if (currentValue == value) {
              opt.selected = true;
              return;
            }
          }
          else opt.selected = value.include(currentValue);
        }
      }
    }

    function selectOne(element) {
      var index = element.selectedIndex;
      return index >= 0 ? this.optionValue(element.options[index]) : null;
    }

    function selectMany(element) {
      var values, length = element.length;
      if (!length) return null;

      for (var i = 0, values = []; i < length; i++) {
        var opt = element.options[i];
        if (opt.selected) values.push(this.optionValue(opt));
      }
      return values;
      }

    function textarea(element, value) {
      if (typeof value === 'undefined') return element.value;
      else element.value = value || '';
    }

    return {
      'button':        button,
      'input':         input,
      'inputSelector': inputSelector,
      'optionValue':   optionValue,
      'select':        select,
      'selectOne':     selectOne,
      'selectMany':    selectMany,
      'textarea':      textarea
    };
  })();
