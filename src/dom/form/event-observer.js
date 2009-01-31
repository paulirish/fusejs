  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  Abstract.EventObserver = Class.create((function() {
    function initialize(element, callback) {
      this.element = $(element);
      this.onElementEvent = this.onElementEvent.bind(this);

      if (this.element.tagName.toUpperCase() === 'FORM')
        return this.registerFormCallbacks();

      var member, name = element.name, i = 0;
      this.group = (name && $$(element.tagName +
        '[name="' + name + '"]')) || [element];

      this.callback = callback;
      this.lastValue = this.getValue();

      while (member = this.group[i++])
        this.registerCallback(member);
    }

    function onElementEvent() {
      var value = this.getValue();
      if (this.lastValue === value) return;
      this.callback(this.element, value);
      this.lastValue = value;
    }

    function registerCallback(element) {
      if (!element.type) return;
      var eventName = 'change', type = element.type;
      if (type === 'checkbox' || type === 'radio')
        eventName = 'click';
      Event.observe(element, eventName, this.onElementEvent);
    }

    function registerFormCallbacks() {
      var element, elements = Form.getElements(this.element), i= 0;
      while (element = elements[i++]) this.registerCallback(element);
    }

    return {
      'initialize':            initialize,
      'onElementEvent':        onElementEvent,
      'registerCallback':      registerCallback,
      'registerFormCallbacks': registerFormCallbacks
    };
  })());

  Field.EventObserver = Class.create(Abstract.EventObserver, (function() {
    function getValue() {
      if (this.group.length === 1)
        return Form.Element.getValue(this.element);
      var member, value, i = 0;
      while (member = this.group[i++])
        if (value = Form.Element.getValue(member))
          return value;
    }
    return {
      'getValue': getValue
    };
  })());

  Form.EventObserver = Class.create(Abstract.EventObserver, (function() {
    function getValue() {
      return Form.serialize(this.element);
    }
    return {
      'getValue': getValue
    };
  })());
