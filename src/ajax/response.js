  /*----------------------------- AJAX: RESPONSE -----------------------------*/

  Ajax.Response = Class.create({
    'status':     0,
    'statusText': '',
    'getStatus':  Ajax.Request.prototype.getStatus,
    'getHeader':  Ajax.Request.prototype.getHeader
  });

  (function() {
    Ajax.Response.addMethods({
      'initialize': function initialize(request){
        this.request = request;
        var transport  = this.transport  = request.transport,
            readyState = this.readyState = transport.readyState;

        if ((readyState > 2 && !Fuse.Browser.Agent.IE) || readyState == 4) {
          this.status       = this.getStatus();
          this.statusText   = this.getStatusText();
          this.responseText = String.interpret(transport.responseText);
          this.headerJSON   = this._getHeaderJSON();
        }

        if (readyState == 4) {
          var xml = transport.responseXML;
          this.responseXML  = (typeof xml === 'undefined') ? null : xml;
          this.responseJSON = this._getResponseJSON();
        }
      },

      '_getHeaderJSON': function _getHeaderJSON() {
        var json = this.getHeader('X-JSON');
        if (!json) return null;
        json = decodeURIComponent(escape(json));
        try {
          return json.evalJSON(this.request.options.sanitizeJSON ||
            !Object.isSameOrigin(this.request.url));
        } catch (e) {
          this.request.dispatchException(e);
        }
      },

      '_getResponseJSON': function _getResponseJSON() {
        var options = this.request.options;
        if (!options.evalJSON || (options.evalJSON != 'force' && 
          !(this.getHeader('Content-type') || '').include('application/json')) || 
            this.responseText.blank())
              return null;
        try {
          return this.responseText.evalJSON(options.sanitizeJSON ||
            !Object.isSameOrigin(this.request.url));
        } catch (e) {
          this.request.dispatchException(e);
        }
      },

      'getAllHeaders': function getAllHeaders() {
        try {
          return this.getAllResponseHeaders();
        } catch (e) { return null } 
      },

      'getAllResponseHeaders': function getAllResponseHeaders() {
        return this.transport.getAllResponseHeaders();
      },

      'getResponseHeader': function getResponseHeader(name) {
        return this.transport.getResponseHeader(name);
      },

      'getStatusText': function getStatusText() {
        try {
          return this.transport.statusText || '';
        } catch (e) { return '' }
      }
    });

    // prevent JScript bug with named function expressions
    var _getHeaderJSON =     null,
     _getResponseJSON =      null,
     getAllHeaders =         null,
     getAllResponseHeaders = null,
     getStatusText =         null,
     initialize =            null;
  })();
