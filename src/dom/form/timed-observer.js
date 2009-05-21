  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = Fuse.Class(Fuse.Timer, {
      'constructor': (function() {
        function BaseTimedObserver(element, interval, callback) {
          // this._super() equivalent
          Fuse.Timer.call(this, callback, interval);

          this.element = $(element);
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

  /*--------------------------------------------------------------------------*/

    Field.Observer = 
    Field.TimedObserver = Fuse.Class(BaseTimedObserver, {
      'constructor': (function() {
        function FieldTimedObserver(element, interval, callback) {
          if (!(this instanceof FieldTimedObserver))
            return new FieldTimedObserver(element, interval, callback);
          BaseTimedObserver.call(this, element, interval, callback);
        }
        return FieldTimedObserver;
      })(),

      'getValue': (function() {
        function getValue() { return Form.Element.getValue(this.element) }
        return getValue;
      })()
    });

    Form.Observer = 
    Form.TimedObserver = Fuse.Class(BaseTimedObserver, {
      'constructor': (function() {
        function FormTimedObserver(element, interval, callback) {
          if (!(this instanceof FormTimedObserver))
            return new FormTimedObserver(element, interval, callback);
          BaseTimedObserver.call(this, element, interval, callback);
        }
        return FormTimedObserver;
      })(),

      'getValue': (function() {
        function getValue() { return Form.serialize(this.element) }
        return getValue;
      })()
    });
  })();