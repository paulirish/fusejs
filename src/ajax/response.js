  /*----------------------------- AJAX: RESPONSE -----------------------------*/

  Fuse.addNS('Ajax.Response', {
    'constructor': (function() {
      function Response(request) {
        this.request = request;
        var transport  = this.transport  = request.transport,
            readyState = this.readyState = transport.readyState;

        if ((readyState > 2 && !Fuse.Browser.Agent.IE) || readyState == 4) {
          this.status       = this.getStatus();
          this.statusText   = this.getStatusText();
          this.responseText = Fuse.String.interpret(transport.responseText);
          this.headerJSON   = this._getHeaderJSON();
        }

        if (readyState == 4) {
          var xml = transport.responseXML;
          this.responseXML  = (typeof xml === 'undefined') ? null : xml;
          this.responseJSON = this._getResponseJSON();
        }
      }
      return Response;
    })()
  });

  (function() {
    this.status     = 0;
    this.statusText = '';
    this.getStatus  = Fuse.Ajax.Request.Plugin.getStatus;
    this.getHeader  = Fuse.Ajax.Request.Plugin.getHeader;

    this._getHeaderJSON = function _getHeaderJSON() {
      var json = this.getHeader('X-JSON');
      if (!json) return null;
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
        !(this.getHeader('Content-type') || '').indexOf('application/json') > -1) || 
          this.responseText.blank())
            return null;
      try {
        return this.responseText.evalJSON(options.sanitizeJSON ||
          !Fuse.Object.isSameOrigin(this.request.url));
      } catch (e) {
        this.request.dispatchException(e);
      }
    };

    this.getAllHeaders = function getAllHeaders() {
      try {
        return this.getAllResponseHeaders();
      } catch (e) { return null } 
    };

    this.getAllResponseHeaders = function getAllResponseHeaders() {
      return this.transport.getAllResponseHeaders();
    };

    this.getResponseHeader = function getResponseHeader(name) {
      return this.transport.getResponseHeader(name);
    };

    this.getStatusText = function getStatusText() {
      try {
        return this.transport.statusText || '';
      } catch (e) { return '' }
    };

    // prevent JScript bug with named function expressions
    var _getHeaderJSON =     null,
     _getResponseJSON =      null,
     getAllHeaders =         null,
     getAllResponseHeaders = null,
     getStatusText =         null;
  }).call(Fuse.Ajax.Response.Plugin);
