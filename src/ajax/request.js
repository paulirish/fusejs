  /*---------------------------- AJAX: REQUEST -------------------------------*/

  Fuse.addNS('Ajax.Request', Fuse.Ajax.Base, {
    'constructor': (function() {
      function Request(url, options) {
        if (!(this instanceof Request))
          return new Request(url, options);

        // this._super() equivalent
        Fuse.Ajax.Base.call(this, options);

        this.transport = Fuse.Ajax.getTransport();
        this.onStateChange = Fuse.Function.bind(this.onStateChange, this);
        this.request(url);
      }
      return Request;
    })()
  });

  Fuse.Ajax.Request.Events =
    Fuse.List('Unsent', 'Opened', 'HeadersRecieved', 'Loading', 'Done'); 

  /*--------------------------------------------------------------------------*/

  (function() {
    this.readyState = 0;

    this.abort = function abort() {
      var result = false; 
      if (this.readyState != 4) {
        try {
          // clear onreadystatechange handler to stop some browsers calling
          // it when the request is aborted
          this.transport.onreadystatechange = Fuse.emptyFunction;
          this.transport.abort();

          // skip to complete readyState
          this.aborted = true;
          this.setReadyState(4);
          result = true;
        }
        catch (e) {
          this.transport.onreadystatechange = this.onStateChange;
          this.dispatchException(e);
        }
      }
      return result;
    };

    this.dispatch = function dispatch(eventName, callback, response) {
      response = response || new Fuse.Ajax.Response(this);
      try {
        callback && callback(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      Fuse.Ajax.Responders.dispatch(eventName, this, response);
    };

    this.dispatchException = function dispatchException(exception) {
      var callback = this.options.onException;
      callback && callback(this, exception);
      Fuse.Ajax.Responders.dispatch('onException', this, exception);
    };

    this.evalResponse = function evalResponse() {
      try {
        var text = this.transport.responseText || '';
        if (text) text = Fuse.String.unfilterJSON(text);
        return global.eval(String(text));
      } catch (e) {
        this.dispatchException(e);
      }
    };

    this.getHeader = function getHeader(name) {
      var result;
      try { result = this.transport.getResponseHeader(name) } catch (e) { }
      return result ? Fuse.String(result) : null;
    };

    this.getStatus = function getStatus() {
      var result = 0;
      try { result = this.transport.status || 0 } catch (e) { }
      return Fuse.Number(result);
    };

    this.onStateChange = function onStateChange(event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = this.transport.readyState;
      if (this.readyState < 4) {
        if (forceState != null) this.readyState = forceState - 1;
        if (this.readyState < endState) {
          while (this.readyState < endState)
            this.setReadyState(this.readyState + 1);
        }
      }
    };

    this.request = function request(url) {
      var body,
       options    = this.options,
       method     = options.method,
       params     = this.parameters = Fuse.Object.clone(options.parameters),
       url        = Fuse.String(url || global.location.href),
       transport  = this.transport;

      if (!/^(get|post)$/.test(method)) {
        // simulate other verbs over post
        params['_method'] = method;
        method = 'post';
      }
      this.method = Fuse.String(method);

      if (params = Fuse.Object.toQueryString(params)) {
        // when GET, append parameters to URL
        if (method == 'get')
          url = url + (url.indexOf('?') > -1 ? '&' : '?') + params;
      }
      this.url = Fuse.String(url);

      // fire onCreate callbacks
      this.dispatch('onCreate', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        this.transport.open(method.toUpperCase(), url, options.asynchronous);
        this.transport.onreadystatechange = this.onStateChange;
        this.setRequestHeaders();

        body = method == 'post' ? String(options.postBody || params) : null;
        this.body = body && Fuse.String(body);

        this.transport.send(body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!options.asynchronous) this.onStateChange();
      }
      catch (e) {
        this.dispatchException(e);
      }
    };

    this.setReadyState = function setReadyState(readyState) {
      this.readyState = readyState;

      var eventName, successOrFailure, i = 0,
       eventNames = [], 
       skipped    = { },
       options    = this.options,
       response   = Fuse.Ajax.Response(this),
       aborted    = response.aborted,
       status     = response.status;

      if (aborted) eventNames.push('Abort');

      if (readyState == 4) {
        // remove event handler to avoid memory leak in IE
        this.transport.onreadystatechange = Fuse.emptyFunction;
        eventNames.push(String(status));

        // dont call global/request onSuccess/onFailure callbacks on aborted requests
        successOrFailure = this.success() ? 'Success' : 'Failure';
        if (!aborted) eventNames.push(successOrFailure);

        // skip success/failure handlers if status handler exists
        skipped['on' + (options['on' + status] ?
          successOrFailure : status)] = 1;

        // handle returned javascript
        var contentType = response.getHeader('Content-type');
        if (!aborted && (options.evalJS == 'force' || options.evalJS &&
            Fuse.Object.isSameOrigin(this.url) && contentType &&
            contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
          this.evalResponse();
      }

      // add readyState to the list of events to dispatch
      eventNames.push(Fuse.Ajax.Request.Events[readyState]);

      while (eventName = eventNames[i++]) {
        eventName = 'on' + eventName;
        this.dispatch(eventName, !skipped[eventName] && options[eventName], response);
      }
    };

    this.setRequestHeaders = function setRequestHeaders() {
      var options = this.options, encoding = options.encoding;

      var headers = {
        'Accept':           'text/javascript, text/html, application/xml, text/xml, */*',
        'X-Fuse-Version':   Fuse.Version,
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (this.method == 'post') {
        headers['Content-type'] = options.contentType +
          (encoding ? '; charset=' + encoding : '');

        /* Force "Connection: close" for older Mozilla browsers to work
         * around a bug where XMLHttpRequest sends an incorrect
         * Content-length header. See Mozilla Bugzilla #246651.
         */
        if (this.transport.overrideMimeType &&
           (userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
          headers['Connection'] = 'close';
      }

      // user-defined headers
      var key, extras = options.requestHeaders;
      if (typeof extras === 'object') {
        if (Fuse.List.isArray(extras)) {
          for (var i = 0, length = extras.length; i < length; i += 2)
            headers[extras[i]] = extras[i + 1];
        }
        else {
          if (extras instanceof Fuse.Hash) extras = extras._object;
          for (key in extras) headers[key] = extras[key];
        }
      }

      for (key in headers)
        this.transport.setRequestHeader(key, headers[key]);
    };

    this.success = function success() {
      var status = this.getStatus();
      return status == 0 || (status >= 200 && status < 300);
    };

    // prevent JScript bug with named function expressions
    var abort =             null,
     dispatch =             null,
     dispatchException =    null,
     evalResponse =         null,
     getHeader =            null,
     getStatus =            null,
     onStateChange =        null,
     request =              null,
     setReadyState =        null,
     setRequestHeaders =    null,
     success =              null;
  }).call(Fuse.Ajax.Request.Plugin);
