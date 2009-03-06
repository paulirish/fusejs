  /*------------------------------- AJAX: BASE -------------------------------*/

  Ajax.Base = Class.create((function() {
    function initialize(options) {
      this.options = Object._extend(Object
        .clone(Ajax.Base.defaultOptions), options);

      this.options.method = this.options.method.toLowerCase();

      if (typeof this.options.parameters === 'string') 
        this.options.parameters = this.options.parameters.toQueryParams();
      else if (Object.isHash(this.options.parameters))
        this.options.parameters = this.options.parameters.toObject();
    }

    return {
      'initialize': initialize
    };
  })());

  Ajax.Base.defaultOptions = {
    'asynchronous': true,
    'contentType':  'application/x-www-form-urlencoded',
    'encoding':     'UTF-8',
    'evalJS':       true,
    'evalJSON':     true,
    'forceMethod':  false,
    'method':       'post',
    'parameters':   ''
  };
