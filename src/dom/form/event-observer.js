  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  (function() {
    var EventObserver = Fuse.Class();

    (function() {
      this.initialize = function initialize(element, callback) {
        this.element = $(element);
        this.onElementEvent = Fuse.Function.bind(this.onElementEvent, this);

        if (getNodeName(this.element) === 'FORM')
          return this.registerFormCallbacks();

        var member, name = element.name, i = 0;
        this.group = (name && Fuse.query(element.nodeName +
          '[name="' + name + '"]')) || [element];

        this.callback = callback;
        this.lastValue = this.getValue();

        while (member = this.group[i++])
          this.registerCallback(member);
      };

      this.onElementEvent = function onElementEvent() {
        var value = this.getValue();
        if (this.lastValue === value) return;
        this.callback(this.element, value);
        this.lastValue = value;
      };

      this.registerCallback = function registerCallback(element) {
        if (!element.type) return;
        var eventName = 'change', type = element.type;
        if (type === 'checkbox' || type === 'radio')
          eventName = 'click';
        Event.observe(element, eventName, this.onElementEvent);
      };

      this.registerFormCallbacks = function registerFormCallbacks() {
        var element, elements = Form.getElements(this.element), i= 0;
        while (element = elements[i++]) this.registerCallback(element);
      };

      // prevent JScript bug with named function expressions
      var initialize =         null,
       onElementEvent =        null,
       registerCallback =      null,
       registerFormCallbacks = null;
    }).call(EventObserver.Plugin);

    Field.EventObserver = Fuse.Class(EventObserver, (function() {
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

    Form.EventObserver = Fuse.Class(EventObserver, (function() {
      function getValue() {
        return Form.serialize(this.element);
      }
      return {
        'getValue': getValue
      };
    })());
  })();
