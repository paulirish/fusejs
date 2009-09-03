  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = Fuse.Class(Fuse.Timer, {
      'constructor': (function() {
        function BaseTimedObserver(element, callback, interval, options) {
          // this._super() equivalent
          Fuse.Timer.call(this, callback, interval, options);

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

    /*------------------------------------------------------------------------*/

    Field.Observer =
    Field.TimedObserver = Fuse.Class(BaseTimedObserver, {
      'constructor': (function() {
        function FieldTimedObserver(element, callback, interval, options) {
          if (!(this instanceof FieldTimedObserver))
            return new FieldTimedObserver(element, callback, interval, options);
          BaseTimedObserver.call(this, element, callback, interval, options);
        }
        return FieldTimedObserver;
      })(),

      'getValue': (function() {
        function getValue() { return Field.getValue(this.element); }
        return getValue;
      })()
    });

    Form.Observer =
    Form.TimedObserver = Fuse.Class(BaseTimedObserver, {
      'constructor': (function() {
        function FormTimedObserver(element, callback, interval, options) {
          if (!(this instanceof FormTimedObserver))
            return new FormTimedObserver(element, callback, interval, options);
          BaseTimedObserver.call(this, element, callback, interval, options);
        }
        return FormTimedObserver;
      })(),

      'getValue': (function() {
        function getValue() { return Form.serialize(this.element); }
        return getValue;
      })()
    });
  })();
