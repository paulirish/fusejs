  /*---------------------------------- FORM ----------------------------------*/

  Fuse.Dom.extendByTag('form');

  Form = Fuse.Dom.FormElement;

  Fuse.addNS('Util');

  Fuse.Util.$F = (function() {
    function $F(element) {
      element = Fuse.get(element);
      return element && element.getValue
        ? element.getValue()
        : null;
    }
    return $F;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var FIELD_NODE_NAMES = {
      'BUTTON':   1,
      'INPUT':    1,
      'SELECT':   1,
      'TEXTAREA': 1
    };

    function eachElement(decorator, callback) {
      var node, i = 1,
       nodes = (decorator.raw || decorator).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          FIELD_NODE_NAMES[node.nodeName.toUpperCase()] && callback(node);
        } while (node = nodes[i++]);
      }
    }

    plugin.disable = function disable() {
      eachElement(this, function(node) { node.disabled = true; });
      return this;
    };

    plugin.enable = function enable() {
      eachElement(this, function(node) { node.disabled = false; });
      return this;
    };

    plugin.findFirstElement = function findFirstElement() {
      var firstByIndex, node, firstNode = null, tabIndex, i = 0,
       minTabIndex = Infinity;

      eachElement(this, function(node) {
        if (node.type !== 'hidden' && !node.disabled && !firstNode)
          firstNode = node;
        if ((tabIndex = node.tabIndex) > -1 && tabIndex < minTabIndex) {
          minTabIndex  = tabIndex;
          firstByIndex = node;
        }
      });

      return firstByIndex || firstNode;
    };

    plugin.focusFirstElement = function focusFirstElement() {
      var element = this.findFirstElement();
      element && element.focus();
      return this;
    };

    plugin.getElements = function getElements() {
      var node, i = 1, results = NodeList(),
       nodes = (this.raw || this).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          FIELD_NODE_NAMES[node.nodeName.toUpperCase()] &&
            results.push(fromElement(node));
        } while (node = element[i++]);
      }
      return results;
    };

    plugin.getInputs = function getInputs(typeName, name) {
      typeName = String(typeName || '');
      name = String(typeName || '');

      var input, inputs = (this.raw || this).getElementsByTagName('input'),
       results = Fuse.List(), i = 0;

      if (!typeName && !name) {
        while (input = inputs[i]) results[i++] = fromElement(input);
      }
      else if (typeName && !name) {
        while (input = inputs[i++])
          if (typeName === input.type) results.push(fromElement(input));
      }
      else {
        while (input = inputs[i++])
          if ((!typeName || typeName === input.type) && (!name || name === input.name))
            results.push(fromElement(input));
      }
      return results;
    };

    plugin.request = function request(options) {
      options = clone(options);

      var params = options.parameters, submit = options.submit,
       action = this.readAttribute('action');

      delete options.submit;
      options.parameters = this.serialize({ 'submit':submit, 'hash':true });

      if (params) {
        if (isString(params)) params = Fuse.String.toQueryParams(params);
        _extend(options.parameters, params);
      }

      if (this.hasAttribute('method') && !options.method)
        options.method = form.method;

      return new Fuse.Ajax.Request(action, options);
    };

    plugin.reset = function reset() {
      (this.raw || this).reset();
      return this;
    };

    plugin.serialize = function serialize(options) {
      return this.serializeElements(null, options);
    };

    plugin.serializeElements = function serializeElements(elements, options) {
      if (typeof options !== 'object')
        options = { 'hash': !!options };
      else if (typeof options.hash === 'undefined')
        options.hash = true;

      var element, key, value, isImageType, isSubmitButton, getValue, nodeName,
       submitSerialized, type, i = 1,
       checkString = !!elements,
       doc         = Fuse._doc,
       Dom         = Fuse.Dom,
       result      = Fuse.Object(),
       submit      = options.submit;

      if (!elements)
        elements = (this.raw || this).getElementsByTagName('*');

      if (element = elements[0]) {
        do {

          // avoid checking for element ids if we are iterating the default nodeList
          if (checkString && isString(element))
            element = doc.getElementById(element);

          // skip if a serializer does not exist for the element
          nodeName = element.nodeName || '';
          if (!FIELD_NODE_NAMES[nodeName.toUpperCase()]) continue;

          key   = element.name;
          type  = element.type;
          value = element.getValue
            ? element.getValue()
            : Dom[capitalize.call(nodeName) + 'Element'].plugin.getValue.call(element);

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
        while (element = elements[i++]);
      }

      return options.hash
        ? result
        : Obj.toQueryString(result);
    };

    // prevent JScript bug with named function expressions
    var disable =        nil,
     enable =            nil,
     findFirstElement =  nil,
     focusFirstElement = nil,
     getElements =       nil,
     getInputs =         nil,
     request =           nil,
     reset =             nil,
     serializeElements = nil,
     serialize =         nil;
  })(Form.plugin);