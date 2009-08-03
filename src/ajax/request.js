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
       transport = this.transport;

      // fire onCreate callbacks
      this.dispatch('onCreate', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        transport.open(this.method.toUpperCase(), this.url, async,
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
      var eventName, successOrFailure, i = 0,
       eventNames = [],
       skipped    = { },
       aborted    = this.aborted,
       options    = this.options,
       url        = this.url,
       transport  = this.transport;

      // clear response values on readyState 0 or aborted requests
      if (readyState == 0 || aborted) {
        this.headerJSON = this.responseJSON = this.responseXML = null;
        this.responseText = Fuse.String('');
      }

      if (readyState == 2) {
        // exit if no headers and wait for state 3 to fire states 2 and 3
        if (this.getAllHeaders() == '' && transport.readyState === 2)
          return;

        this.readyState = Fuse.Number(readyState);

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

        this.readyState = Fuse.Number(readyState);

        // set status
        try { this.status = Fuse.Number(transport.status || 0) } catch (e) { }

        // set statusText
        try { this.statusText = Fuse.String(transport.statusText || '') } catch (e) { }

        // set responseText
        if (!aborted)
          this.responseText = Fuse.String.interpret(transport.responseText);

        if (readyState == 4) {
          var responseXML,
           contentType = this.getHeader('Content-type') || '',
           evalJS = options.evalJS,
           evalJSON = options.evalJSON,
           responseText = this.responseText,
           status = String(this.status);

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
      var status = this.status;
      return status == 0 || (status >= 200 && status < 300);
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
