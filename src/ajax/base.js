 /*------------------------------- AJAX: BASE -------------------------------*/

  Fuse.addNS('Ajax.Base', {
    'constructor': (function() {
      function Base(options) {
        this.options = Fuse.Object._extend(Fuse.Object
          .clone(Fuse.Ajax.Base.defaultOptions), options);

        this.options.method = this.options.method.toLowerCase();

        var params = this.options.parameters;
        if (Fuse.Object.isString(params))
          this.options.parameters = Fuse.String(params).toQueryParams();
        else if (params instanceof Fuse.Hash)
          this.options.parameters = params.toObject();
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
