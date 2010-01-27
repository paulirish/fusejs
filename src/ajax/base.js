 /*------------------------------- AJAX: BASE -------------------------------*/

  fuse.ajax.Base = Class({
    'constructor': (function() {
      function Base(url, options) {
        var customHeaders, queryString,
         body = null,
         defaultOptions = fuse.ajax.Base.options,
         defaultHeaders = defaultOptions.headers,
         location = global.location;

        // remove headers from user options to be added in further down
        if (options && options.headers) {
          customHeaders = options.headers;
          delete options.headers;
        }

        // clone default options/headers and overwrite with user options
        delete defaultOptions.headers;
        defaultOptions = clone(defaultOptions);
        fuse.ajax.Base.options.headers = defaultHeaders;

        defaultOptions.headers = clone(defaultHeaders);
        options = this.options = _extend(defaultOptions, options);

        var encoding = options.encoding,
         headers = options.headers,
         method = options.method.toLowerCase(),
         params = options.parameters;

        // if no url is provided use the window's location data
        if (!url || url == '') {
          url = location.protocol + '//' + location.host + location.pathname;
          if (!params || params == '')
            params = location.search.slice(1);
        }

        // convert string/hash parameters to an object
        if (isString(params))
          params = fuse.String(params).toQueryParams();
        else if (isHash(params))
          params = params.toObject();
        else params = clone(params);

        // simulate other verbs over post
        if (!/^(get|post)$/.test(method)) {
          params['_method'] = method;
          method = 'post';
        }

        // when GET request, append parameters to URL
        queryString = Obj.toQueryString(params);
        if ( method == 'get' && queryString != '')
          url += (url.indexOf('?') > -1 ? '&' : '?') + queryString;

        // add in user defined array/hash/object headers over the default
        if (typeof customHeaders === 'object') {
          if (isArray(customHeaders)) {
            for (var i = 0, length = customHeaders.length; i < length; i += 2)
              headers[customHeaders[i]] = customHeaders[i + 1];
          } else {
            if (isHash(customHeaders)) customHeaders = customHeaders._object;
            for (key in customHeaders) headers[key] = customHeaders[key];
          }
        }

        // ensure character encoding is set in headers of POST requests
        if (method == 'post' && (headers['Content-type'] || '').indexOf('charset=') < 0) {
          headers['Content-type'] = options.contentType +
            (encoding ? '; charset=' + encoding : '');
        }

        // set default timeout multiplier
        this.timerMultiplier = options.timerMultiplier ||
          fuse.Timer && fuse.Timer.options.multiplier || 1;

        // Playing it safe here, even though we could not reproduce this bug,
        // jQuery tickets #2570, #2865 report versions of Opera will display a
        // login prompt when passing null-like values for username/password when
        // no authorization is needed.
        if (!options.username) options.username = options.password = '';

        // body is null for every method except POST
        if (method == 'post')
          body = options.postBody || queryString;

        this.body       = body;
        this.method     = fuse.String(method);
        this.parameters = params;
        this.url        = fuse.String(url);
      }

      return Base;
    })()
  });

  fuse.ajax.Base.options = {
    'asynchronous': true,
    'contentType':  'application/x-www-form-urlencoded',
    'encoding':     'UTF-8',
    'evalJS':       true,
    'evalJSON':     !!fuse.String.plugin.evalJSON,
    'forceMethod':  false,
    'method':       'post',
    'parameters':   '',
    'headers':      {
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
      'X-Fuse-Version': fuse.version,
      'X-Requested-With': 'XMLHttpRequest'
    }
  };
