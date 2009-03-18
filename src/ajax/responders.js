  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  (function() {
    Ajax.Responders = {
      'responders': {
        'onCreate':   [ function() { Ajax.activeRequestCount++ } ],
        'onComplete': [ function() { Ajax.activeRequestCount-- } ]
      },

      'dispatch': function dispatch(handlerName, request, transport, json) {
        (this.responders[handlerName] || [])._each(function(handler) {
          try { handler(request, transport, json) } catch (e) { }
        });
      },
  
      'register': function register(responder) {
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
      },
  
      'unregister': function unregister(responder) {
        for (var name in responder)
          this.responders[name] = (this.responders[name] || [])
           .reject(function(c) { return c.__method === responder[name] });
      }
    };

    // prevent JScript bug with named function expressions
    var dispatch = null,
     register =    null,
     unregister =  null
  })();
