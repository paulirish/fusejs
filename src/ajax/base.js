 /*------------------------------- AJAX: BASE -------------------------------*/

  Fuse.addNS('Ajax.Base', {
    'constructor': (function() {
      function Base(options) {
        this.options = Fuse.Object._extend(Object
          .clone(Ajax.Base.defaultOptions), options);

        this.options.method = this.options.method.toLowerCase();

        if (typeof this.options.parameters === 'string') 
          this.options.parameters = this.options.parameters.toQueryParams();
        else if (Fuse.Object.isHash(this.options.parameters))
          this.options.parameters = this.options.parameters.toObject();
      }
      return Base;
    })()
  });

  Fuse.Ajax.Base.defaultOptions = {
    'asynchronous': true,
    'contentType':  'application/x-www-form-urlencoded',
    'encoding':     'UTF-8',
    'evalJS':       true,
    'evalJSON':     true,
    'forceMethod':  false,
    'method':       'post',
    'parameters':   ''
  };
