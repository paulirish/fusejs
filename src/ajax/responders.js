  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  Fuse.addNS('Ajax.Responders');

  // TODO: Utilize custom events for responders
  (function(Responders) {
    Responders.responders = {
      'onCreate': Fuse.List(function() { Fuse.Ajax.activeRequestCount++ }),
      'onDone':   Fuse.List(function() { Fuse.Ajax.activeRequestCount-- })
    };

    Responders.dispatch = (function() {
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

    Responders.register = function register(responder) {
      var found, handler, handlers, length, method, name;
      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        found    = false;
        handlers = this.responders[name];
        length   = handlers.length;
        method   = responder[name];

        // check if responder method is in the handlers list
        if (handles)
          while (handler = handlers[length--])
            if (handler.__method === method) { found = true; break; }

        if (!found) {
          // create handler if not found
          handler = (function(n) {
            return function(request, json) { responder[n](request, json) }})(name);

          // tie original method to handler
          handler.__method = method;

          // create handlers list if non-existent and add handler
          if (!handlers) this.responders[name] = handlers = Fuse.List();
          handlers.push(handler);
        }
      }
    };

    Responders.unregister = function unregister(responder) {
      var handler, name, handlers, length, results;
      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        if (handlers = this.responders[name]) {
          results = Fuse.List(); 
          length  = handlers.length;
          method  = responder[name];

          // rebuild handlers list excluding the handle that is tied to the responder method
          while (handler = handlers[length--])
            if (handler.__method !== method) results.push(handler);
          this.responders[name] = results;
        }
      }
    };

    // prevent JScript bug with named function expressions
    var register = null, unregister =  null;
  })(Fuse.Ajax.Responders);
