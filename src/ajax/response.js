  /*----------------------------- AJAX: RESPONSE -----------------------------*/

  Ajax.Response = Class.create({
    'status':     0,
    'statusText': '',
    'getStatus':  Ajax.Request.prototype.getStatus,
    'getHeader':  Ajax.Request.prototype.getHeader
  });

  (function() {
    this.initialize = function initialize(request){
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
    };

    this._getHeaderJSON = function _getHeaderJSON() {
      var json = this.getHeader('X-JSON');
      if (!json) return null;
      try {
        return json.evalJSON(this.request.options.sanitizeJSON ||
          !Object.isSameOrigin(this.request.url));
      } catch (e) {
        this.request.dispatchException(e);
      }
    };

    this._getResponseJSON = function _getResponseJSON() {
      var options = this.request.options;
      if (!options.evalJSON || (options.evalJSON != 'force' && 
        !(this.getHeader('Content-type') || '').contains('application/json')) || 
          this.responseText.blank())
            return null;
      try {
        return this.responseText.evalJSON(options.sanitizeJSON ||
          !Object.isSameOrigin(this.request.url));
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
     getStatusText =         null,
     initialize =            null;
  }).call(Ajax.Response.prototype);
