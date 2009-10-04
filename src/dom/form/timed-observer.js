  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = Class(Fuse.Timer, {
      'constructor': (function() {
        function BaseTimedObserver(element, callback, interval, options) {
          // this._super() equivalent
          Fuse.Timer.call(this, callback, interval, options);

          this.element = Fuse.get(element);
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

    Field.Observer =
    Field.TimedObserver = (function() {
      var Klass = function() { },

      FieldTimedObserver = function FieldTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      };

      FieldTimedObserver = Class(BaseTimedObserver, { 'constructor': FieldTimedObserver });
      Klass.prototype = FieldTimedObserver.plugin;
      return FieldTimedObserver;
    })();

    Field.Observer.plugin.getValue = (function() {
      function getValue() { return Field.getValue(this.element); }
      return getValue;
    })();

    Form.Observer =
    Form.TimedObserver = (function() {
      var Klass = function() { },

      FormTimedObserver = function FormTimedObserver(element, callback, interval, options) {
        var instance = new Klass;
        BaseTimedObserver.call(instance, element, callback, interval, options);
        return instance;
      };

      FormTimedObserver = Class(BaseTimedObserver, { 'constructor': FormTimedObserver });
      Klass.prototype = FormTimedObserver.plugin;
      return FormTimedObserver;
    })();

    Form.Observer.plugin.getValue = (function() {
      function getValue() { return Form.serialize(this.element); }
      return getValue;
    })();
  })();
