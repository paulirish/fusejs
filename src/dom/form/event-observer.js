  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  Abstract.EventObserver = Class.create((function() {
    function initialize(element, callback) {
      this.element   = $(element);
      this.callback  = callback;
      this.lastValue = this.getValue();

      if (this.element.tagName.toUpperCase() === 'FORM')
        this.registerFormCallbacks();
      else
        this.registerCallback(this.element);
    }

    function onElementEvent() {
      var value = this.getValue();
      if (this.lastValue != value) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    }

    function registerCallback(element) {
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

    function registerFormCallbacks() {
      Form.getElements(this.element).each(this.registerCallback, this);
    }

    return {
      'initialize':            initialize,
      'onElementEvent':        onElementEvent,
      'registerCallback':      registerCallback,
      'registerFormCallbacks': registerFormCallbacks
    };
  })());

  Form.Element.EventObserver = Class.create(Abstract.EventObserver, (function() {
    function getValue() {
      return Form.Element.getValue(this.element);
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
