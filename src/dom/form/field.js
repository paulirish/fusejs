  /*--------------------------------- FIELD ----------------------------------*/

  (function(Dom) {
    (function() {
      var tagName, i = 0,
       tagNames = ['button', 'input', 'option', 'select', 'textarea'];
      while (tagName = tagNames[i++]) Dom.extendByTag(tagName);
    })();

    var CHECKED_INPUT_TYPES = {
      'CHECKBOX': 1,
      'RADIO':    1
    },

    INPUT_BUTTONS = {
      'button': 1,
      'image':  1,
      'reset':  1,
      'submit': 1
    },

    buttonPlugin   = Dom.ButtonElement.plugin,

    inputPlugin    = Dom.InputElement.plugin,

    optionPlugin   = Dom.OptionElement.plugin,

    selectPlugin   = Dom.SelectElement.plugin,

    textAreaPlugin = Dom.TextAreaElement.plugin,

    getOptionValue = function getValue() {
      var element = this.raw || this;
      return element[this.hasAttribute('value') ? 'value' : 'text'];
    };


    /* define common field class methods */

    inputPlugin.activate = function activate() {
      var element = this.raw || this;
      try { element.focus(); } catch(e) { }
      if (element.select && getNodeName(element) !== 'BUTTON' &&
          !INPUT_BUTTONS[element.type])
        element.select();
      return this;
    };

    inputPlugin.clear = function clear() {
      var element = this.raw || this;
      if (getNodeName(element) !== 'BUTTON' &&
          !INPUT_BUTTONS[element.type])
        this.setValue(null);
      return element;
    };

    inputPlugin.disable = function disable() {
      (this.raw || this).disabled = true;
      return this;
    };

    inputPlugin.enable = function enable() {
      (this.raw || this).disabled = false;
      return this;
    };

    inputPlugin.focus = function focus() {
      // avoid IE errors when element
      // or ancestors are not visible
      try { (this.raw || this).focus(); } catch(e) { }
      return this;
    };

    inputPlugin.present = function present() {
      return !!(this.raw || this).value;
    };

    inputPlugin.serialize = function serialize() {
      var value, pair, element = this.raw || this;
      if (!element.disabled && element.name) {
        value = this.getValue();
        if (isArray(value) && value.length < 2)
          value = value[0];
        if (value != null) {
          pair = { };
          pair[element.name] = value;
          return Obj.toQueryString(pair);
        }
      }
      return '';
    };

    inputPlugin.select = function select() {
      (this.raw || this).select();
      return this;
    };

    // copy InputElement methods to the other field classes
    eachKey(inputPlugin, function(value, key, object) {
      if (key !== 'constructor' && hasKey(object, key))
        buttonPlugin[key]   =
        selectPlugin[key]   =
        textAreaPlugin[key] = value;
    });


    /* define getValue/setValue for each field class */

    buttonPlugin.getValue = function getValue() {
      return this.readAttribute('value');
    };

    buttonPlugin.setValue = function setValue(value) {
      this.writeAttribute('value', value);
    };

    inputPlugin.getValue = function getValue() {
      var element = this.raw || this;
      return CHECKED_INPUT_TYPES[element.type.toUpperCase()]
        ? element.checked ? element.value : null
        : element.value;
    };

    inputPlugin.setValue = function setValue(value) {
      var element = this.raw || this;
      if (CHECKED_INPUT_TYPES[element.type.toUpperCase()])
        element.checked = !!value;
      else element.value = value || '';
    };

    selectPlugin.getValue = function getValue() {
      var i, node, element = this.raw || this, result = null;
      if (element.type === 'select-one') {
        var index = element.selectedIndex;
        if (index > -1) result = getOptionValue.call(element.options[index]);
      }
      else if (element.options.length) {
        result = Fuse.List(); i = 0;
        while (node = element.options[i++])
          if (node.selected) result.push(getOptionValue.call(node));
      }
      return result;
    };

    selectPlugin.setValue = function setValue(value) {
      var i, node, element = this.raw || this;
      if (value === null)
        element.selectedIndex = -1;

      else if (isArray(value)) {
        // quick of array#indexOf
        value = expando + value.join(expando) + expando; i = 0;
        while (node = element.options[i++])
          node.selected = value.indexOf(expando + getOptionValue.call(node) + expando) > -1;
      }
      else {
        while (node = element.options[i++])
          if (getOptionValue.call(node) === value) { node.selected = true; break; }
      }
    };

    textAreaPlugin.getValue = function getValue() {
      return (this.raw || this).value;
    };

    textAreaPlugin.setValue =
    optionPlugin.setValue   = function setValue(value) {
      return (this.raw || this).value  = value || '';
    };

    optionPlugin.getValue = getOptionValue;

    // prevent JScript bug with named function expressions
    var activate = nil,
     clear =       nil,
     disable =     nil,
     enable =      nil,
     focus =       nil,
     getValue =    nil,
     present =     nil,
     select =      nil,
     setValue =    nil,
     serialize =   nil;
  })(Fuse.Dom);
