  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  Fuse.addNS('Ajax.Responders');

  // TODO: Utilize custom events for responders
  (function(proto) {
    proto.responders = {
      'onCreate': Fuse.List(function() { Fuse.Ajax.activeRequestCount++ }),
      'onDone':   Fuse.List(function() { Fuse.Ajax.activeRequestCount-- })
    };

    proto.dispatch = (function() {
      // This pattern, based on work by Dean Edwards and John Resig, allows a
      // responder to error out without stopping the other responders from firing.
      // http://groups.google.com/group/jquery-dev/browse_thread/thread/2a14c2da6bcbb5f
      function __dispatch(index, handlers, request, json) {
        index = index || 0;
        var error, length = handlers.length;
        try {
          while (index < length) {
            handlers[index](request, json);
            index++;
          }
        } catch (e) {
          error = e;
          __dispatch(index + 1, handlers, request, json);
        } finally {
          if (error) throw error;
        }
      }

      function dispatch(handlerName, request, json) {
        var handlers = this.responders[handlerName];
        if (handlers) __dispatch(0, handlers, request, json);
      }

      return dispatch;
    })();

    proto.register = function register(responder) {
      var m, handler, handlers, name;
      if (responder instanceof Fuse.Hash)
        responder = responder._object;

      for (name in responder) {
        handlers = this.responders[name];
        m = responder[name];
        if (!handlers || !handlers.first(function(c) { return c.__method === m })) {
          (handler = bind(m, responder)).__method = m;
          if (!handlers) this.responders[name] = handlers = Fuse.List();
          handlers.push(handler);
        }
      }
    };

    proto.unregister = function unregister(responder) {
      var name;
      if (responder instanceof Fuse.Hash)
        responder = responder._object;

      for (name in responder) {
        var handlers = this.responders[name];
        if (handlers)
          this.responders[name] =
            handlers.filter(function(c) { return c.__method !== responder[name] });
      }
    };

    // prevent JScript bug with named function expressions
    var dispatch = null, register = null, unregister =  null;
  })(Fuse.Ajax.Responders);
