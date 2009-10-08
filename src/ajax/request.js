  /*---------------------------- AJAX: REQUEST -------------------------------*/

  Fuse.Ajax.Request = (function() {
    var Decorator = function() { },

    Request = function Request(url, options) {
      var decorated  = new Decorator,
       onStateChange = decorated.onStateChange,
       onTimeout     = decorated.onTimeout;

      decorated.raw = Fuse.Ajax.create();

      decorated.onTimeout =
        function() { onTimeout.call(request); };

      decorated.onStateChange =
        function(event, forceState) { onStateChange.call(decorated, event, forceState); };

      decorated.request(url, options);
      return decorated;
    };

    Request = Class(Fuse.Ajax.Base, { 'constructor': Request });
    Decorator.prototype = Request.plugin;
    return Request;
  })();

  Fuse.Ajax.Request.Events =
    Fuse.List('Unsent', 'Opened', 'HeadersReceived', 'Loading', 'Done');

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var matchHTTP = /^https?:/,
      Responders = Fuse.Ajax.Responders;

    plugin._useStatus   = true;
    plugin._timerID     = nil;
    plugin.aborted      = false;
    plugin.readyState   = Fuse.Number(0);
    plugin.responseText = Fuse.String('');
    plugin.status       = Fuse.Number(0);
    plugin.statusText   = Fuse.String('');
    plugin.timedout     = false;

    plugin.headerJSON = plugin.responseJSON = plugin.responseXML = nil;

    plugin.abort = function abort() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        // clear onreadystatechange handler to stop some browsers calling
        // it when the request is aborted
        xhr.onreadystatechange = emptyFunction;
        xhr.abort();

        // skip to complete readyState and flag it as aborted
        this.aborted = true;
        this.setReadyState(4);
      }
    };

    plugin.dispatch = function dispatch(eventName, callback) {
      try {
        callback && callback(this, this.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }
      Responders && Responders.dispatch(eventName, this, this.headerJSON);
    };

    plugin.dispatchException = function dispatchException(exception) {
      var callback = this.options.onException;
      callback && callback(this, exception);
      Responders && Responders.dispatch('onException', this, exception);

      // throw error if not caught by a request onException handler
      if (!callback) throw exception;
    };

    plugin.getAllHeaders = function getAllHeaders() {
      var result;
      try { result = this.raw.getAllResponseHeaders(); } catch (e) { }
      return Fuse.String(result || '');
    };

    plugin.getHeader = function getHeader(name) {
      var result;
      try { result = this.raw.getResponseHeader(name); } catch (e) { }
      return result ? Fuse.String(result) : null;
    };

    plugin.onTimeout = function onTimeout() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        xhr.onreadystatechange = emptyFunction;
        xhr.abort();

        // skip to complete readyState and flag it as timedout
        this.timedout = true;
        this.setReadyState(4);
      }
    };

    plugin.onStateChange = function onStateChange(event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = this.raw.readyState, readyState = this.readyState;
      if (readyState < 4) {
        if (forceState != null) readyState = forceState - 1;
        while (readyState < endState)
          this.setReadyState(++readyState);
      }
    };

    plugin.request = function request(url, options) {
      // treat request() as the constructor and call Base as $super
      // if first call or new options are passed
      if (!this.options || options)
        Fuse.Ajax.Base.call(this, url, options);

      options = this.options;

      var key,
       async     = options.asynchronous,
       body      = this.body,
       headers   = options.headers,
       timeout   = options.timeout,
       url       = String(this.url),
       xhr       = this.raw;

      // reset flags
      this.aborted = this.timedout = false;

      // reset response values
      this.headerJSON   = this.responseJSON = this.responseXML = null;
      this.readyState   = Fuse.Number(0);
      this.responseText = Fuse.String('');
      this.status       = Fuse.Number(0);
      this.statusText   = Fuse.String('');

      // non-http requests don't use http status codes
      // return true if request url is http(s) or, if relative, the pages url is http(s)
      this._useStatus = matchHTTP.test(url) ||
        (url.slice(0, 6).indexOf(':') < 0 ?
          matchHTTP.test(global.location.protocol) : false);

      // start timeout timer if provided
      if (timeout != null)
        this._timerID = setTimeout(this.onTimeout, timeout * this.timerMultiplier);

      // fire onCreate callbacks
      this.dispatch('onCreate', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        xhr.open(this.method.toUpperCase(), url, async,
          options.username, options.password);
        xhr.onreadystatechange = this.onStateChange;

        // set headers
        for (key in headers)
          xhr.setRequestHeader(key, headers[key]);

        // if body is a string ensure it's a primitive
        xhr.send(isString(body) ? String(body) : body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!async) this.onStateChange();
      }
      catch (e) {
        this.dispatchException(e);
      }
    };

    plugin.setReadyState = function setReadyState(readyState) {
      var eventName, json, responseText, status, statusText, successOrFailure, i = 0,
       aborted    = this.aborted,
       eventNames = [],
       skipped    = { },
       options    = this.options,
       evalJSON   = options.evalJSON,
       timedout   = this.timedout,
       url        = this.url,
       xhr        = this.raw;

      // exit if no headers and wait for state 3 to fire states 2 and 3
      if (readyState == 2 && this.getAllHeaders() == '' &&
        xhr.readyState === 2) return;

      this.readyState = Fuse.Number(readyState);

      // clear response values on aborted/timedout requests
      if (aborted || timedout) {
        this.headerJSON   = this.responseJSON = this.responseXML = null;
        this.responseText = Fuse.String('');
        this.status       = Fuse.Number(0);
        this.statusText   = Fuse.String('');
      }
      else if (readyState > 1) {
        // Request status/statusText have really bad cross-browser consistency.
        // Monsur Hossain has done an exceptional job cataloging the cross-browser
        // differences.
        // http://monsur.com/blog/2007/12/28/xmlhttprequest-status-codes/
        // http://blogs.msdn.com/ieinternals/archive/2009/07/23/The-IE8-Native-XMLHttpRequest-Object.aspx

        // Assume Firefox is throwing an error accessing status/statusText
        // caused by a 408 request timeout
        try {
          status = xhr.status;
          statusText = xhr.statusText;
        } catch(e) {
          status = 408;
          statusText = 'Request Timeout';
        }

        // IE will return 1223 for 204 no content
        this.status = Fuse.Number(status == 1223 ? 204 : status);

        // set statusText
        this.statusText = Fuse.String(statusText);

        // set responseText
        if (readyState > 2) {
          // IE will throw an error when accessing responseText in state 3
          try {
            if (responseText = xhr.responseText)
              this.responseText = Fuse.String(responseText);
          } catch (e) { }
        }
        else if (readyState == 2 && evalJSON &&
            (json = this.getHeader('X-JSON')) && json != '') {
          // set headerJSON
          try {
            this.headerJSON = json.evalJSON(options.sanitizeJSON || !isSameOrigin(url));
          } catch (e) {
            this.dispatchException(e);
          }
        }
      }

      if (readyState == 4) {
        var responseXML,
         contentType = this.getHeader('Content-type') || '',
         evalJS = options.evalJS,
         timerID = this._timerID;

        responseText = this.responseText;

        // typecast status to string
        status = String(status);

        // clear timeout timer
        if (timerID != null) {
          global.clearTimeout(timerID);
          this._timerID = null;
        }

        if (aborted) {
          eventNames.push('Abort', status);
        }
        else if (timedout) {
          eventNames.push('Timeout', status);
        }
        else {
          // don't call global/request onSuccess/onFailure callbacks on aborted/timedout requests
          successOrFailure = this.isSuccess() ? 'Success' : 'Failure';
          eventNames.push(status, successOrFailure);

          // skip success/failure request events if status handler exists
          skipped['on' + (options['on' + status] ?
            successOrFailure : status)] = 1;

          // remove event handler to avoid memory leak in IE
          xhr.onreadystatechange = emptyFunction;

          // set responseXML
          responseXML = xhr.responseXML;
          if (responseXML) this.responseXML = responseXML;

          // set responseJSON
          if (evalJSON == 'force' || (evalJSON && !responseText.blank() &&
              contentType.indexOf('application/json') > -1)) {
            try {
              this.responseJSON = responseText.evalJSON(options.sanitizeJSON ||
                !isSameOrigin(url));
            } catch (e) {
              this.dispatchException(e);
            }
          }

          // eval javascript
          if (responseText && (evalJS == 'force' || evalJS &&
              isSameOrigin(url) &&
              contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;|\s|$)/i))) {
            try {
              global.eval(String(Fuse.String.unfilterJSON(responseText)));
            } catch (e) {
              this.dispatchException(e);
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

    plugin.isSuccess = function isSuccess() {
      // http status code definitions
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
      var status = this.status;
      return this._useStatus
        ? (status >= 200 && status < 300 || status == 304)
        : status == 0;
    };

    // prevent JScript bug with named function expressions
    var abort =          nil,
     dispatch =          nil,
     dispatchException = nil,
     getHeader =         nil,
     getAllHeaders =     nil,
     isSuccess =         nil,
     onStateChange =     nil,
     onTimeout =         nil,
     request =           nil,
     setReadyState =     nil;
  })(Fuse.Ajax.Request.plugin);
