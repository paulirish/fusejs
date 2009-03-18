  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  Abstract.TimedObserver = Class.create(Timer);
  
  (function() {
    this.initialize = function initialize(element, interval, callback) {
      // this._super() equivalent
      Timer.prototype.initialize.call(this, callback, interval);

      this.element = $(element);
      this.lastValue = this.getValue();
      this.start();
    };

    this.execute = function execute() {
      var value = this.getValue();
      if ((typeof this.lastValue === 'string' && typeof value === 'string') ?
          this.lastValue != value : String(this.lastValue) != String(value)) {
        this.callback(this.element, value);
        this.lastValue = value;
      }
    };

    // prevent JScript bug with named function expressions
    var initialize = null, execute = null;
  }).call(Abstract.TimedObserver.prototype);

  Field.Observer = 
  Field.TimedObserver = Class.create(Abstract.TimedObserver, (function() {
    function getValue() {
      return Form.Element.getValue(this.element);
    }
    return {
      'getValue': getValue
    };
  })());

  Form.Observer = 
  Form.TimedObserver = Class.create(Abstract.TimedObserver, (function() {
    function getValue() {
      return Form.serialize(this.element);
    }
    return {
      'getValue': getValue
    };
  })());