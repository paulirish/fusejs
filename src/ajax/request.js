  /*---------------------------- AJAX: REQUEST -------------------------------*/

  Fuse.addNS('Ajax.Request', Fuse.Ajax.Base, {
    'constructor': (function() {
      function Request(url, options) {
        if (!(this instanceof Request))
          return new Request(url, options);

        this.transport = Fuse.Ajax.getTransport();
        this.onStateChange = Fuse.Function.bind(this.onStateChange, this);
        this.request(url, options);
      }
      return Request;
    })()
  });

  Fuse.Ajax.Request.Events =
    Fuse.List('Unsent', 'Opened', 'HeadersReceived', 'Loading', 'Done');

  /*--------------------------------------------------------------------------*/

  (function() {
    this._useStatus   = true;
    this.aborted      = false;
    this.readyState   = Fuse.Number(0);
    this.responseText = Fuse.String('');
    this.status       = Fuse.Number(0);
    this.statusText   = Fuse.String('');

    this.headerJSON = this.responseJSON = this.responseXML = null;

    this.abort = function abort() {
      var transport = this.transport;
      if (this.readyState != 4) {
        try {
          // clear onreadystatechange handler to stop some browsers calling
          // it when the request is aborted
          transport.onreadystatechange = Fuse.emptyFunction;
          transport.abort();

          // skip to complete readyState
          this.aborted = true;
          this.setReadyState(4);
        }
        catch (e) { }
      }
    };

    this.dispatch = function dispatch(eventName, callback) {
      try {
        callback && callback(this, this.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      Fuse.Ajax.Responders.dispatch(eventName, this, this.headerJSON);
    };

    this.dispatchException = function dispatchException(exception) {
      var callback = this.options.onException;
      callback && callback(this, exception);
      Fuse.Ajax.Responders.dispatch('onException', this, exception);
    };

    this.getAllHeaders = function getAllHeaders() {
      var result;
      try { result = this.transport.getAllResponseHeaders() } catch (e) { }
      return Fuse.String(result || '');
    };

    this.getHeader = function getHeader(name) {
      var result;
      try { result = this.transport.getResponseHeader(name) } catch (e) { }
      return result ? Fuse.String(result) : null;
    };

    this.onStateChange = function onStateChange(event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = this.transport.readyState, readyState = this.readyState;
      if (readyState < 4) {
        if (forceState != null) readyState = forceState - 1;
        while (readyState < endState)
          this.setReadyState(++readyState);
      }
    };

    this.request = function request(url, options) {
      // treat request() as the constructor and call Base as $super
      // if first call or new options are passed
      if (!this.options || options)
        Fuse.Ajax.Base.call(this, url, options);

      options = this.options;

      var key,
       async     = options.asynchronous,
       body      = this.body,
       headers   = options.headers,
       matchHTTP = /^https?:/,
       transport = this.transport,
       url       = String(this.url);

      // non-http requests don't use http status codes
      // return true if request url is http(s) or, if relative, the pages url is http(s)
      this._useStatus = matchHTTP.test(url) ||
        (url.slice(0, 6).indexOf(':') === -1 ?
          matchHTTP.test(global.location.protocol) : false);

      // fire onCreate callbacks
      this.dispatch('onCreate', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        transport.open(this.method.toUpperCase(), url, async,
          options.username, options.password);
        transport.onreadystatechange = this.onStateChange;

        // set headers
        for (key in headers)
          transport.setRequestHeader(key, headers[key]);

        // if body is a string ensure it's a primitive
        transport.send(Fuse.Object.isString(body) ? String(body) : body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!async) this.onStateChange();
      }
      catch (e) {
        this.dispatchException(e);
      }
    };

    this.setReadyState = function setReadyState(readyState) {
      var eventName, status, statusText, successOrFailure, i = 0,
       eventNames = [],
       skipped    = { },
       aborted    = this.aborted,
       options    = this.options,
       transport  = this.transport,
       url        = this.url;

      // exit if no headers and wait for state 3 to fire states 2 and 3
      if (readyState == 2 && this.getAllHeaders() == '' &&
        transport.readyState === 2) return;

      this.readyState = Fuse.Number(readyState);

      // clear response values on readyState 0 or aborted requests
      if (readyState == 0 || aborted) {
        this.headerJSON = this.responseJSON = this.responseXML = null;
        this.responseText = Fuse.String('');
        this.status       = Fuse.Number(0);
        this.statusText   = Fuse.String('');
      }
      else if (readyState > 1 ) {
        // Request status/statusText have really bad cross-browser consistency.
        // Monsur Hossain has done an exceptional job cataloging the cross-browser
        // differences.
        // http://monsur.com/blog/2007/12/28/xmlhttprequest-status-codes/
        // http://blogs.msdn.com/ieinternals/archive/2009/07/23/The-IE8-Native-XMLHttpRequest-Object.aspx

        // Assume Firefox is throwing an error accessing status/statusText
        // caused by a 408 request timeout
        try {
          status = transport.status;
          statusText = transport.statusText;
        } catch(e) {
          status = 408;
          statusText = 'Request Timeout';
        }

        // IE will return 1223 for 204 no content
        this.status = Fuse.Number(status == 1223 ? 204 : status);

        // set statusText
        this.statusText = Fuse.String(statusText);
      }

      if (readyState == 2) {
        // set headerJSON
        var json = this.getHeader('X-JSON');
        if (json && json != '') {
          try {
            this.headerJSON = json.evalJSON(options.sanitizeJSON ||
              !Fuse.Object.isSameOrigin(url));
          } catch (e) {
            this.dispatchException(e);
          }
        }
      }
      else if (readyState > 2) {
        // set responseText
        if (!aborted)
          this.responseText = Fuse.String.interpret(transport.responseText);

        if (readyState == 4) {
          var responseXML,
           contentType = this.getHeader('Content-type') || '',
           evalJS = options.evalJS,
           evalJSON = options.evalJSON,
           responseText = this.responseText;

          // typecast status to string
          status = String(status);

          if (aborted) {
            eventNames.push('Abort', status);
          }
          else {
            // don't call global/request onSuccess/onFailure callbacks on aborted requests
            successOrFailure = this.isSuccess() ? 'Success' : 'Failure';
            eventNames.push(status, successOrFailure);

            // skip success/failure request events if status handler exists
            skipped['on' + (options['on' + status] ?
              successOrFailure : status)] = 1;

            // remove event handler to avoid memory leak in IE
            transport.onreadystatechange = Fuse.emptyFunction;

            // set responseXML
            responseXML = transport.responseXML;
            if (responseXML) this.responseXML = responseXML;

            // set responseJSON
            if (evalJSON == 'force' || (evalJSON && !responseText.blank() &&
                contentType.indexOf('application/json') > -1)) {
              try {
                this.responseJSON = responseText.evalJSON(options.sanitizeJSON ||
                  !Fuse.Object.isSameOrigin(url));
              } catch (e) {
                this.dispatchException(e);
              }
            }

            // eval javascript
            if (responseText && (evalJS == 'force' || evalJS &&
                Fuse.Object.isSameOrigin(url) &&
                contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;|\s|$)/i))) {
              try {
                global.eval(String(Fuse.String.unfilterJSON(responseText)));
              } catch (e) {
                this.dispatchException(e);
              }
            }
          }
        }
      }

      // add readyState to the list of events to dispatch
      eventNames.push(Fuse.Ajax.Request.Events[readyState]);

      while (eventName = eventNames[i++]) {
        eventName = 'on' + eventName;
        this.dispatch(eventName, !skipped[eventName] && options[eventName]);
      }
    };

    this.isSuccess = function isSuccess() {
      // http status code definitions
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
      var status = this.status;
      return this._useStatus
        ? (status >= 200 && status < 300 || status == 304)
        : status == 0;
    };

    // prevent JScript bug with named function expressions
    var abort =          null,
     dispatch =          null,
     dispatchException = null,
     getHeader =         null,
     getAllHeaders =     null,
     isSuccess =         null,
     onStateChange =     null,
     request =           null,
     setReadyState =     null;
  }).call(Fuse.Ajax.Request.Plugin);
