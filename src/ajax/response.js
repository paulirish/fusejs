  /*----------------------------- AJAX: RESPONSE -----------------------------*/

  Fuse.addNS('Ajax.Response', {
    'constructor': (function() {
      function Response(request) {
        if (!(this instanceof Response))
          return new Response(request);

        this.request = request;
        var readyState = this.readyState = request.readyState,
         transport = this.transport = request.transport;

        if (this.aborted = request._aborted) {
          this.status = transport.readyState > 1 ? this.getStatus() : 0;
        }
        else {
          if ((readyState > 2 && !Fuse.Browser.Agent.IE) || readyState === 4) {
            this.status       = this.getStatus();
            this.statusText   = this.getStatusText();
            this.responseText = Fuse.String.interpret(transport.responseText);
            this.headerJSON   = this._getHeaderJSON();

            if (readyState === 4) {
              var xml = transport.responseXML;
              this.responseXML  = typeof xml === 'undefined' ? null : xml;
              this.responseJSON = this._getResponseJSON();
            }
          }
        }
      }
      return Response;
    })()
  });

  (function() {
    this.status       = 0;
    this.statusText   = '';
    this.responseText = null,
    this.getStatus    = Fuse.Ajax.Request.Plugin.getStatus;
    this.getHeader    = Fuse.Ajax.Request.Plugin.getHeader;

    this._getHeaderJSON = function _getHeaderJSON() {
      var json = this.getHeader('X-JSON');
      if (!json || json == '') return null;
      try {
        return json.evalJSON(this.request.options.sanitizeJSON ||
          !Fuse.Object.isSameOrigin(this.request.url));
      } catch (e) {
        this.request.dispatchException(e);
      }
    };

    this._getResponseJSON = function _getResponseJSON() {
      var options = this.request.options;
      if (!options.evalJSON || (options.evalJSON != 'force' && 
         (this.getHeader('Content-type') || '').indexOf('application/json') < 0 || 
          !this.responseText || this.responseText.blank()))
            return null;
      try {
        return this.responseText.evalJSON(options.sanitizeJSON ||
          !Fuse.Object.isSameOrigin(this.request.url));
      } catch (e) {
        this.request.dispatchException(e);
      }
    };

    this.getAllResponseHeaders = function getAllResponseHeaders() {
      var result = null;
      try { result = this.transport.getAllResponseHeaders() } catch (e) { }
      return result === null ? null : Fuse.String(result);
    };

    this.getStatusText = function getStatusText() {
      var result = '';
      try { result = this.transport.statusText || '' } catch (e) { }
      return Fuse.String(result);
    };

    // aliases
    this.getAllHeaders = this.getAllResponseHeaders;
    this.getResponseHeader = this.getHeader;

    // prevent JScript bug with named function expressions
    var _getHeaderJSON =     null,
     _getResponseJSON =      null,
     getAllResponseHeaders = null,
     getStatusText =         null;
  }).call(Fuse.Ajax.Response.Plugin);
