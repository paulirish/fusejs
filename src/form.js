var Form = {
  reset: function(form) {
    $(form).reset();
    return form;
  },
  
  serializeElements: function(elements, options) {
    if (typeof options !== 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    
    var key, value, type, isImageType, isSubmitButton,
     submitSerialized, submit = options.submit;
    
    var data = elements.inject({ }, function(result, element) {
      element = $(element);
      key     = element.name;
      value   = element.getValue();
      type    = element.type;
      
      isImageType = type === 'image';
      isSubmitButton = type === 'submit' || isImageType;
      
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
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },
  
  getElements: function(form) {
    var elements = [], nodes = $(form).getElementsByTagName('*');
    for (var i = 0, node; node = nodes[i++]; ) {
      if (node.nodeType === 1 && 
          Form.Element.Serializers[node.tagName.toLowerCase()]) {
        elements.push(Element.extend(node));
      }
    }
    return elements;
  },
  
  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');
    
    if (!typeName && !name) return $A(inputs).map(Element.extend);
      
    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();
    
    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return ['button', 'input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    form = $(form); 
    var element = Form.findFirstElement(form); 
    element && Form.Element.activate(element); 
    return form;
  },
  
  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });
    
    var params = options.parameters, submit = options.submit,
     action = form.readAttribute('action') || '';
    delete options.submit;
    
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize({ submit:submit, hash:true });
    
    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }
    
    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;
    
    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/

Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != null) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },
  
  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value || null);
    return element;
  },

  clear: function(element) {
    element = $(element);
    if (element.tagName.toUpperCase() != 'BUTTON' &&
        !['button', 'image', 'reset', 'submit'].include(element.type))
      Form.Element.setValue(element, null);
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },
  
  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && element.tagName.toUpperCase() != 'BUTTON' &&
          !['button', 'reset', 'submit'].include(element.type))
        element.select();
    } catch (e) { }
    return element;
  },
  
  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },
  
  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

function $F(element) {
  element = $(element);
  var s = Form.Element.Serializers,
   method = element && element.tagName.toLowerCase();
  return s[method] ? s[method](element) : null;
}

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':  
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  button: function(element, value){
    if (Object.isUndefined(value)) return Element.readAttribute(element, 'value');
    else Element.writeAttribute(element, 'value', value);
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value || '';
  },
  
  select: function(element, value) {
    if (Object.isUndefined(value))
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
  },
  
  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },
  
  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;
    
    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },
  
  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },
  
  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;
    
    this.lastValue = this.getValue();
    if (this.element.tagName.toUpperCase() == 'FORM')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },
  
  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },
  
  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },
  
  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':  
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }    
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
