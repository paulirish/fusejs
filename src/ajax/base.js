 /*------------------------------- AJAX: BASE -------------------------------*/

  Fuse.addNS('Ajax.Base', {
    'constructor': (function() {
      function Base(options) {
        options = this.options = Fuse.Object._extend(Fuse.Object
          .clone(Fuse.Ajax.Base.options), options);

        // Playing it safe here, even though we could not reproduce this bug,
        // jQuery tickets #2570, #2865 report versions of Opera will display a
        // login prompt when passing null like values for username/password when 
        // no authorization is needed.
        if (!options.username) options.username = options.password = '';
        options.method = options.method.toLowerCase();

        var params = options.parameters;
        if (Fuse.Object.isString(params))
          options.parameters = Fuse.String(params).toQueryParams();
        else if (params instanceof Fuse.Hash)
          options.parameters = params.toObject();
      }
      return Base;
    })()
  });

  Fuse.Ajax.Base.options = {
    'asynchronous': true,
    'contentType':  'application/x-www-form-urlencoded',
    'encoding':     'UTF-8',
    'evalJS':       true,
    'evalJSON':     true,
    'forceMethod':  false,
    'method':       'post',
    'parameters':   ''
  };
