  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = Class(fuse.Timer, {
      'constructor': (function() {
        function BaseTimedObserver(element, callback, interval, options) {
          // this._super() equivalent
          fuse.Timer.call(this, callback, interval, options);

          this.element = fuse.get(element);
          this.lastValue = this.getValue();
          this.start();
        }
        return BaseTimedObserver;
      })(),

      'execute': (function() {
        function execute() {
          var value = this.getValue();
          if (String(this.lastValue) != String(value)) {
            this.callback(this.element, value);
            this.lastValue = value;
          }
        }
        return execute;
      })()
    });

    /*------------------------------------------------------------------------*/

    var Field = fuse.dom.InputElement, getValue = nil;

    Field.Observer =
    Field.TimedObserver = (function() {
      function Klass() { }

      function FieldTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      }

      var FieldTimedObserver = Class(BaseTimedObserver, { 'constructor': FieldTimedObserver });
      Klass.prototype = FieldTimedObserver.plugin;
      return FieldTimedObserver;
    })();

    Field.Observer.plugin.getValue = function getValue() {
      return this.element.getValue();
    };

    Form.Observer =
    Form.TimedObserver = (function() {
      function Klass() { }

      function FormTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      }

      var FormTimedObserver = Class(BaseTimedObserver, { 'constructor': FormTimedObserver });
      Klass.prototype = FormTimedObserver.plugin;
      return FormTimedObserver;
    })();

    Form.Observer.plugin.getValue = function getValue() {
      return this.element.serialize();
    };
  })();
