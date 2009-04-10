  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var TimedObserver = Fuse.Class(Fuse.Timer);

    (function() {
      this.initialize = function initialize(element, interval, callback) {
        // this._super() equivalent
        Timer.prototype.initialize.call(this, callback, interval);

        this.element = $(element);
        this.lastValue = this.getValue();
        this.start();
      };

      this.execute = function execute() {
        var isString = Fuse.Object.isString, value = this.getValue();
        if (isString(this.lastValue) && isString(value) ?
            this.lastValue != value : String(this.lastValue) != String(value)) {
          this.callback(this.element, value);
          this.lastValue = value;
        }
      };

      // prevent JScript bug with named function expressions
      var initialize = null, execute = null;
    }).call(TimedObserver.Plugin);

    Field.Observer = 
    Field.TimedObserver = Fuse.Class(TimedObserver, (function() {
      function getValue() {
        return Form.Element.getValue(this.element);
      }
      return {
        'getValue': getValue
      };
    })());

    Form.Observer = 
    Form.TimedObserver = Fuse.Class(TimedObserver, (function() {
      function getValue() {
        return Form.serialize(this.element);
      }
      return {
        'getValue': getValue
      };
    })());
  })();