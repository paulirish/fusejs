  /*---------------------------- AJAX: REQUEST -------------------------------*/

  Ajax.Request = Class.create(Ajax.Base, {
    '_complete': false
  });

  Ajax.Request.Events = 
    ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

  (function() {
    this.initialize = function initialize(url, options) {
      // this._super() equivalent
      Ajax.Base.prototype.initialize.call(this, options);
      this.transport = Ajax.getTransport();
      this.request(url);
    };

    this.dispatchException = function dispatchException(exception) {
      (this.options.onException || Fuse.emptyFunction)(this, exception);
      Ajax.Responders.dispatch('onException', this, exception);
    };

    this.evalResponse = function evalResponse() {
      try {
        return eval((this.transport.responseText || '').unfilterJSON());
      } catch (e) {
        this.dispatchException(e);
      }
    };

    this.getHeader = function getHeader(name) {
      try {
        return this.transport.getResponseHeader(name) || null;
      } catch (e) { return null }
    };

    this.getStatus = function getStatus() {
      try {
        return this.transport.status || 0;
      } catch (e) { return 0 } 
    };

    this.onStateChange = function onStateChange() {
      var readyState = this.transport.readyState;
      if (readyState > 1 && !((readyState == 4) && this._complete))
        this.respondToReadyState(this.transport.readyState);
    };

    this.request = function request(url) {
      this.url = url;
      this.method = this.options.method;
      var params = Object.clone(this.options.parameters);

      if (!['get', 'post'].contains(this.method)) {
        // simulate other verbs over post
        params['_method'] = this.method;
        this.method = 'post';
      }

      this.parameters = params;

      if (params = Object.toQueryString(params)) {
        // when GET, append parameters to URL
        if (this.method == 'get')
          this.url += (this.url.contains('?') ? '&' : '?') + params
      }

      try {
        var response = new Ajax.Response(this);
        if (this.options.onCreate) this.options.onCreate(response);
        Ajax.Responders.dispatch('onCreate', this, response);

        this.transport.open(this.method.toUpperCase(), this.url, 
          this.options.asynchronous);

        if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

        this.transport.onreadystatechange = this.onStateChange.bind(this);
        this.setRequestHeaders();

        this.body = this.method == 'post' ? (this.options.postBody || params) : null;
        this.transport.send(this.body);

        /* Force Firefox to handle ready state 4 for synchronous requests */
        if (!this.options.asynchronous && this.transport.overrideMimeType)
          this.onStateChange();

      }
      catch (e) {
        this.dispatchException(e);
      }
    };

    this.respondToReadyState = function respondToReadyState(readyState) {
      var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

      if (state == 'Complete') {
        try {
          this._complete = true;
          (this.options['on' + response.status]
           || this.options['on' + (this.success() ? 'Success' : 'Failure')]
           || Fuse.emptyFunction)(response, response.headerJSON);
        } catch (e) {
          this.dispatchException(e);
        }

        var contentType = response.getHeader('Content-type');
        if (this.options.evalJS == 'force'
            || (this.options.evalJS && Object.isSameOrigin(this.url) && contentType 
            && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
          this.evalResponse();
      }

      try {
        (this.options['on' + state] || Fuse.emptyFunction)(response, response.headerJSON);
        Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      if (state == 'Complete') {
        // avoid memory leak in MSIE: clean up
        this.transport.onreadystatechange = Fuse.emptyFunction;
      }
    };

    this.setRequestHeaders = function setRequestHeaders() {
      var headers = {
        'Accept':           'text/javascript, text/html, application/xml, text/xml, */*',
        'X-Fuse-Version':   Fuse.Version,
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (this.method === 'post') {
        headers['Content-type'] = this.options.contentType +
          (this.options.encoding ? '; charset=' + this.options.encoding : '');

        /* Force "Connection: close" for older Mozilla browsers to work
         * around a bug where XMLHttpRequest sends an incorrect
         * Content-length header. See Mozilla Bugzilla #246651. 
         */
        if (this.transport.overrideMimeType &&
            (userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
              headers['Connection'] = 'close';
      }

      // user-defined headers
      var key, extras = this.options.requestHeaders;
      if (typeof extras === 'object') {
        if (Object.isArray(extras))
          for (var i = 0, length = extras.length; i < length; i += 2) 
            headers[extras[i]] = extras[i + 1];
        else {
          if (Object.isHash(extras)) extras = extras._object;
          for (key in extras) headers[key] = extras[key];
        }
      }

      for (key in headers) 
        this.transport.setRequestHeader(key, headers[key]);
    };

    this.success = function success() {
      var status = this.getStatus();
      return !status || (status >= 200 && status < 300);
    };

    // prevent JScript bug with named function expressions
    var initialize =       null,
     dispatchException =   null,
     evalResponse =        null,
     getHeader =           null,
     getStatus =           null,
     onStateChange =       null,
     request =             null,
     respondToReadyState = null,
     setRequestHeaders =   null,
     success =             null;
  }).call(Ajax.Request.prototype);
