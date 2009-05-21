 /*------------------------------- AJAX: BASE -------------------------------*/

  Fuse.addNS('Ajax.Base', {
    'constructor': (function() {
      function Base(options) {
        this.options = Fuse.Object._extend(Fuse.Object
          .clone(Fuse.Ajax.Base.defaultOptions), options);

        this.options.method = this.options.method.toLowerCase();

        if (Fuse.Object.isString(this.options.parameters))
          this.options.parameters = Fuse.String(this.options.parameters).toQueryParams();
        else if (this.options.parameters instanceof Fuse.Hash)
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
