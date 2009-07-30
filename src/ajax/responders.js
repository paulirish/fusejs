  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  Fuse.addNS('Ajax.Responders');

  // TODO: Utilize custom events for responders
  (function() {
    this.responders = {
      'onCreate': Fuse.List(function() { Ajax.activeRequestCount++ }),
      'onDone':   Fuse.List(function() { Ajax.activeRequestCount-- })
    };

    this.dispatch = function dispatch(handlerName, request, transport, json) {
      (this.responders[handlerName] || Fuse.List())._each(function(handler) {
        try { handler(request, transport, json) } catch (e) { }
      });
    };

    this.register = function register(responder) {
      var m, handler, name;
      if (responder instanceof Fuse.Hash)
        responder = responder._object;

      for (name in responder) {
        m = responder[name];
        if (!(this.responders[name] || Fuse.List())
            .first(function(c) { return c.__method === m })) {
          (handler = Fuse.Function.bind(m, responder)).__method = m;
          if (!this.responders[name]) this.responders[name] = Fuse.List();
          this.responders[name].push(handler);
        }
      }
    };

    this.unregister = function unregister(responder) {
      var name;
      if (responder instanceof Fuse.Hash)
        responder = responder._object;

      for (name in responder)
        this.responders[name] = (this.responders[name] || Fuse.List())
         .filter(function(c) { return c.__method !== responder[name] });
    };

    // prevent JScript bug with named function expressions
    var dispatch = null, register = null, unregister =  null;
  }).call(Fuse.Ajax.Responders);
