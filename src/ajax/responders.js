  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  Ajax.Responders = (function() {
    function dispatch(handlerName, request, transport, json) {
      (this.responders[handlerName] || [])._each(function(handler) {
        try { handler(request, transport, json) } catch (e) { }
      });
    }

    function register(responder) {
      var m, handler, name;
      for (name in responder) {
        m = responder[name];
        if (!(this.responders[name] || [])
            .detect(function(c) { return c.__method === m })) {
          (handler = m.bind(responder)).__method = m;
          if (!this.responders[name]) this.responders[name] = [];
          this.responders[name].push(handler);
        }
      }
    }

    function unregister(responder) {
      for (var name in responder)
        this.responders[name] = (this.responders[name] || [])
         .reject(function(c) { return c.__method === responder[name] });
    }

    return {
      responders: {
        'onCreate':   [ function() { Ajax.activeRequestCount++ } ],
        'onComplete': [ function() { Ajax.activeRequestCount-- } ]
      },
      'dispatch':   dispatch,
      'register':   register,
      'unregister': unregister
    };
  })();
