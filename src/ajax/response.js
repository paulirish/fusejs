  /*----------------------------- AJAX: RESPONSE -----------------------------*/

  Ajax.Response = Class.create((function() {
    function initialize(request){
      this.request = request;
      var transport  = this.transport  = request.transport,
          readyState = this.readyState = transport.readyState;

      if ((readyState > 2 && !P.Browser.IE) || readyState == 4) {
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
    }

    function _getHeaderJSON() {
      var json = this.getHeader('X-JSON');
      if (!json) return null;
      json = decodeURIComponent(escape(json));
      try {
        return json.evalJSON(this.request.options.sanitizeJSON ||
          !Object.isSameOrigin(this.request.url));
      } catch (e) {
        this.request.dispatchException(e);
      }
    }

    function _getResponseJSON() {
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
    }

    function getAllHeaders() {
      try {
        return this.getAllResponseHeaders();
      } catch (e) { return null } 
    }

    function getAllResponseHeaders() {
      return this.transport.getAllResponseHeaders();
    }

    function getResponseHeader(name) {
      return this.transport.getResponseHeader(name);
    }

    function getStatusText() {
      try {
        return this.transport.statusText || '';
      } catch (e) { return '' }
    }

    return {
      'status':                0,
      'statusText':            '',
      'initialize':            initialize,
      '_getHeaderJSON':        _getHeaderJSON,
      '_getResponseJSON':      _getResponseJSON,
      'getAllHeaders':         getAllHeaders,
      'getAllResponseHeaders': getAllResponseHeaders,
      'getHeader':             Ajax.Request.prototype.getHeader,
      'getStatus':             Ajax.Request.prototype.getStatus,
      'getStatusText':         getStatusText
    };
  })());
