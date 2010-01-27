  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  fuse.ajax.activeRequestCount = 0;

  // TODO: Utilize custom events for responders
  (function(Responders) {
    Responders.responders = {
      'onCreate': fuse.Array(function() { fuse.ajax.activeRequestCount++; }),
      'onDone':   fuse.Array(function() { fuse.ajax.activeRequestCount--; })
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
      var found, handler, handlers, length, method, name,
       responders = this.responders;

      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        found    = false;
        handlers = responders[name];
        method   = responder[name];

        // check if responder method is in the handlers list
        if (handlers) {
          length = handlers.length;
          while (length--)
            if (handlers[length].__method === method) { found = true; break; }
        }

        if (!found) {
          // create handler if not found
          handler = (function(n) {
            return function(request, json) { responder[n](request, json); };})(name);

          // tie original method to handler
          handler.__method = method;

          // create handlers list if non-existent and add handler
          if (!handlers) responders[name] = handlers = fuse.Array();
          handlers.push(handler);
        }
      }
    };

    Responders.unregister = function unregister(responder) {
      var handler, name, handlers, length, results,
       responders = this.responders;

      if (isHash(responder)) responder = responder._object;

      for (name in responder) {
        if (handlers = responders[name]) {
          i = 0;
          method = responder[name];
          results = fuse.Array(); 

          // rebuild handlers list excluding the handle that is tied to the responder method
          while (handler = handlers[i++])
            if (handler.__method !== method) results.push(handler);
          responders[name] = results;
        }
      }
    };

    // prevent JScript bug with named function expressions
    var register = nil, unregister = nil;
  })(fuse.ajax.Responders = { });
