  /*---------------------------------- EVENT ---------------------------------*/

  if (!global.Event) Event = { };

  Event.cache = { };

  Event.Methods = (function() {

    var isButton = function(event, mouseButton) {
      var property = (typeof event.which === 'number')
       ? 'which' : (typeof event.button === 'number')
         ? 'button' : false;

      var buttonMap = (property === 'button')
        ? { 'left': 1, 'middle': 4, 'right': 2 }
        : { 'left': 1, 'middle': 2, 'right': 3 };

      return (isButton = (property === false)
        ? function() { return false }
        : function(event, mouseButton) { return event[property] === buttonMap[mouseButton] }
      )(event, mouseButton);
    };

    function isLeftClick(event) {
      return isButton(event, 'left');
    }

    function isMiddleClick(event) {
      return isButton(event, 'middle');
    }

    function isRightClick(event) {
      return isButton(event, 'right');
    }

    function element(event) {
      event = Event.extend(event);
      var node = event.target, type = event.type,
       currentTarget = event.currentTarget;

      if (currentTarget && currentTarget.tagName) {
        // Firefox screws up the "click" event when moving between radio buttons
        // via arrow keys. It also screws up the "load" and "error" events on images,
        // reporting the document as the target instead of the original image.
        if (['load', 'error'].include(type) || (currentTarget.tagName.toUpperCase() === 'INPUT' &&
          currentTarget.type === 'radio' && type === 'click')) {
          node = currentTarget;
        }
      }
      // Fix a Safari bug where a text node gets passed as the target of an
      // anchor click rather than the anchor itself.
      return node && Element.extend(node.nodeType === 3 ?
        node.parentNode : node);
    }

    function findElement(event, expression) {
      var element = Event.element(event);
      if (!expression) return element;
      var elements = prependList(Element.ancestors(element), element);
      return Selector.findElement(elements, expression, 0);
    }

    function pointer(event) {
      return { 'x': Event.pointerX(event), 'y': Event.pointerY(event) };
    }

    function stop(event) {
      // Set a "stopped" property so that a custom event can be inspected
      // after the fact to determine whether or not it was stopped.
      event = Event.extend(event);
      event.stopped = true;
      event.preventDefault();
      event.stopPropagation();
    }

    return {
      'element':       element,
      'findElement':   findElement,
      'isLeftClick':   isLeftClick,
      'isMiddleClick': isMiddleClick,
      'isRightClick':  isRightClick,
      'pointer':       pointer,
      'stop':          stop
    };
  })();

  // lazy define Event.pointerX() and Event.pointerY()
  (function(m) {
    function define(methodName, event) {
      if (!body) return 0;
      if (typeof global.pageXOffset === 'number') {
        m.pointerX = function() { return global.pageXOffset };
        m.pointerY = function() { return global.pageYOffset };
      } else {
        m.pointerX = function(event) { return event.clientX + (root.scrollLeft - docEl.clientLeft) };
        m.pointerY = function(event) { return event.clientY + (root.scrollTop  - docEl.clientTop)  };
      }
      return m[methodName](event);
    }
    m.pointerX = define.curry('pointerX');
    m.pointerY = define.curry('pointerY');
  })(Event.Methods);

  /*--------------------------------------------------------------------------*/

  Object.extend(Event, (function() {

    var addEvent, removeEvent, createEvent, fireEvent,
     CUSTOM_EVENT_NAME = 'keyup';

    // Event dispatchers manage several handlers and ensure
    // FIFO execution order. They are attached as the event
    // listener and execute all the handlers they manage.
    var createDispatcher =  function(id, eventName) {
      return function(event) {
        // Prevent a Firefox bug from throwing errors on page load/unload (#5393, #9421).
        // When firing a custom event all the CUSTOM_EVENT_NAME observers for that element will fire.
        // Before executing, make sure the event.eventName matches the eventName.
        if (!Event || !Event.extend || (event.eventName &&
            event.eventName !== eventName)) return false;
        event = Event.extend(event || global.event);

        // shallow copy handlers to avoid issues with nested observe/stopObserving
        var c = Event.cache[id], ec = c.events[eventName],
         handlers = slice.call(ec.handlers, 0), length = handlers.length;
        while (length--) handlers[length].call(c.element, event);
      };
    };

    if (Feature('ELEMENT_ADD_EVENT_LISTENER')) {
      CUSTOM_EVENT_NAME = 'dataavailable';

      addEvent = function(element, eventName, handler) {
        element.addEventListener(getDOMEventName(eventName), handler, false);
      };

      removeEvent = function(element, eventName, handler) {
        element.removeEventListener(getDOMEventName(eventName), handler, false);
      };
    }
    else if (Feature('ELEMENT_ATTACH_EVENT')) {
      CUSTOM_EVENT_NAME = 'beforeupdate';

      addEvent = function(element, eventName, handler) {
        element.attachEvent('on' + getDOMEventName(eventName), handler);
      };

      removeEvent = function(element, eventName, handler) {
        element.detachEvent('on' + getDOMEventName(eventName), handler);
      };
    } 
    else {
      // DOM Level 0
      addEvent = function(element, eventName, handler) {
        var domEventName = getDOMEventName(eventName),
         attrName = 'on' + domEventName, oldHandler = element[attrName];

        if (oldHandler) {
          if (oldHandler.isDispatcher) return false;
          addCache(element, eventName, element[attrName]);
        }
        element[attrName] = Event.cache[getCacheID(element)].events[eventName].dispatcher;
      };

      removeEvent = function(element, eventName, handler) {
        var domEventName = getDOMEventName(eventName),
         attrName = 'on' + domEventName;
        if (!eventName.include(':') && element[attrName] === handler)
          element[attrName] = null;
      };

      createDispatcher = function(id, eventName) {
        var dispatcher = function(event) {
          if (!Event || !Event.extend) return false;
          event = Event.extend(event || global.event);
          var c = Event.cache[id], ec = c && c.events && c.events[event.eventName || eventName];
          if (!ec) return false;
          var handlers = slice.call(ec.handlers, 0), length = handlers.length;
          while (length--) handlers[length].call(this, event);
        };
        dispatcher.isDispatcher = true;
        return dispatcher;
      };
    }

    if (Feature('DOCUMENT_CREATE_EVENT')) {
      createEvent = function(context, eventType) {
        var event = getOwnerDoc(context).createEvent('HTMLEvents');
        eventType && event.initEvent(eventType, true, true);
        return event;
      };
    }
    else if (Feature('DOCUMENT_CREATE_EVENT_OBJECT')) {
      createEvent = function(context, eventType) {
        var event = getOwnerDoc(context).createEventObject();
        eventType && (event.eventType = 'on' + eventType);
        return event;
      };
    } else createEvent = function() { return false };

    if (Feature('ELEMENT_DISPATCH_EVENT')) {
      fireEvent = function(element, event) {
        // In the W3C system, all calls to document.fire should treat
        // document.documentElement as the target
        if (element.nodeType === 9)
          element = element.documentElement;
        element.dispatchEvent(event);
      };
    }
    else if (Feature('ELEMENT_FIRE_EVENT')) {
      fireEvent = function(element, event) {
        element.fireEvent(event.eventType, event);
      };
    } else fireEvent = function() { return false };

    /*--------------------------------------------------------------------------*/

    (function() {
      // compile list of methods using use custom "methodize" 
      // to allow lazy defined Event methods
      var name, Methods = { };
      for (name in Event.Methods) (function(n) {
        Event.Methods[n]._methodized = Methods[n] = function() {
          return arguments.length
            ? Event.Methods[n].apply(null, prependList(arguments, this))
            : Event.Methods[n].call(null, this);
        };
      })(name);

      // supports Event.prototype extensions; no need to extend
      if (function() {
        var e = createEvent(doc), EP = Event.prototype || e && e['__proto__'];
        return EP && Object.extend(Event.prototype = EP, Methods);
      }()) Event.extend = Fuse.K;

      delete name; delete Methods.pointer; delete Methods.pointerX; delete Methods.pointerY;

      // manual event object extensions
      Event.extend = Event.extend || (function() {
 
        function inspect() {
          return '[object Event]';
        }

        function preventDefault() {
          this.returnValue = false;
        }

        function relatedTarget(event) {
          switch (event.type) {
            case 'mouseover': return Element.extend(event.fromElement);
            case 'mouseout':  return Element.extend(event.toElement);
            default:          return null;
          }
        }

        function stopPropagation() {
          this.cancelBubble = true;
        }

        return function(event) {
          if (!event || event._extendedByFuse) return event;

          // avoid unnecessary Object.extend() usage
          event._extendedByFuse = Fuse.emptyFunction;
          event.inspect         = inspect;
          event.pageX           = Event.pointerX(event);
          event.pageY           = Event.pointerY(event);
          event.preventDefault  = preventDefault;
          event.relatedTarget   = relatedTarget(event);
          event.stopPropagation = stopPropagation;
          event.target          = event.srcElement;

          // optimize by re-defining with resolved values
          event.pointer  = function() { return { 'x': this.pageX, 'y': this.pageY } };
          event.pointerX = function() { return this.pageX };
          event.pointerY = function() { return this.pageY };

          return Object.extend(event, Methods);
        };
      })();
    })();

    /*--------------------------------------------------------------------------*/

    function getDOMEventName(eventName) {
      if (eventName && eventName.include(':')) return CUSTOM_EVENT_NAME;
      return eventName;
    }

    function getCacheID(element) {
      if (element === global) return 1;
      if (element.nodeType === 9) return 2;
      return element.getEventID();
    }
    getCacheID.id = 3;

    function getNewCacheID(element) {
      var id = getCacheID.id++;
      element._prototypeEventID = [id]; // backwards compatibility
      return id;
    }

    function addCache(element, eventName, handler) {
      var id = getCacheID(element),
       ec = getOrCreateCache(id, element, eventName);

      // bail if handler is already exists
      if (ec.handlers.indexOf(handler) !== -1)
        return false;

      ec.handlers.unshift(handler);
      if (ec.dispatcher) return false;
      return ec.dispatcher = createDispatcher(id, eventName);
    }

    function getOrCreateCache(id, element, eventName) {
      var c = Event.cache[id] = Event.cache[id] || { 'events': { } };
      c.element = c.element || element;
      return c.events[eventName] = c.events[eventName] || { 'handlers': [ ], 'dispatcher': false };
    }

    function removeCacheAtIndex(id, eventName, index) {
      // remove responders and handlers at the given index
      var c = Event.cache[id], ec = c.events[eventName];
      ec.handlers.splice(index, 1);

      // if no more handlers/responders then
      // remove the eventName cache
      if (!ec.handlers.length) delete c.events[eventName];

      // if no more events cached remove the
      // cache for the element
      for (var i in c.events) return;
      delete Event.cache[id];
    }

    /*--------------------------------------------------------------------------*/

    function fire(element, eventName, memo) {
      element = $(element);
      var event = createEvent(element, CUSTOM_EVENT_NAME);
      if (event) {
        event.eventName = eventName;
        event.memo = memo || { };
        fireEvent(element, event);
        return Event.extend(event);
      }
      return false;
    }

    function getEventID() {
      // handle calls from Event object
      if (this !== global)
        return $(arguments[0]).getEventID();
      // private id variable
      var id = getNewCacheID(arguments[0]);
      // overwrite element.getEventID and execute
      return (arguments[0].getEventID = function() {
        // if cache doesn't match, request a new id
        var c = Event.cache[id];
        if (c && c.element !== this)
          id = getNewCacheID(this);
        return id;
      })();
    }

    function observe(element, eventName, handler) {
      element = $(element);
      var dispatcher = addCache(element, eventName, handler);
      if (!dispatcher) return element;
      addEvent(element, eventName, dispatcher);
      return element;
    }

    function stopObserving(element, eventName, handler) {
      element = $(element);
      eventName = (typeof eventName === 'string') ? eventName : null;
      var id = getCacheID(element), c = Event.cache[id];

      if (!c || !c.events) return element;
      var ec = c.events[eventName];

      if (ec && handler == null) {
        // If an event name is passed without a handler,
        // we stop observing all handlers of that type.
        var length = ec.handlers.length;
        while (length--) Event.stopObserving(element, eventName, length);
        return element;
      }
      else if (!eventName) {
        // If both the event name and the handler are omitted,
        // we stop observing _all_ handlers on the element.
        for (var eventName in c.events)
          Event.stopObserving(element, eventName);
        return element;
      }

      var dispatcher = ec.dispatcher,
       foundAt = (typeof handler === 'number') ?
        handler : ec.handlers.indexOf(handler);

      if (foundAt === -1) return element;
      removeCacheAtIndex(id, eventName, foundAt);

      if (!Event.cache[id] || !Event.cache[id].events[eventName])
        removeEvent(element, eventName, dispatcher);

      return element;
    }

    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    (function() {
      var WIN_ID = 1, DOC_ID = 2,
       domLoadDispatcher   = createDispatcher(DOC_ID, 'dom:loaded'),
       winLoadDispatcher   = createDispatcher(WIN_ID, 'load'),
       winUnloadDispatcher = createDispatcher(WIN_ID, 'unload');

      function domLoadWrapper(event) {
        if (!doc.loaded) {
          event = event || global.event;
          event.eventName = 'dom:loaded';

          // define private body and root variables
          body = Element.extend(doc.body);
          root = Bug('BODY_ACTING_AS_ROOT') ? body : Element.extend(docEl);

          doc.loaded = true;
          domLoadDispatcher(event);
          Event.stopObserving(doc, 'dom:loaded');
        }
      }
 
      function winLoadWrapper(event) {
        event = event || global.event;
        if (!doc.loaded)
          domLoadWrapper(event);
        else if (Event.cache['1'].events['dom:loaded'])
          return winLoadWrapper.defer(event);
        event.eventName = null;
        winLoadDispatcher(event);
        Event.stopObserving(global, 'load');
      }

      function winUnloadWrapper(event) {
        // to avoid memory leaks we clear
        // private body and root variables
        winUnloadDispatcher(event || global.event);
        doc = dummy = body = docEl = root = null;
      }

      addEvent(doc, 'dom:loaded',
        getOrCreateCache(DOC_ID, doc, 'dom:loaded').dispatcher = domLoadWrapper);

      // avoid Function#wrap for better performance esp.
      // in winLoadWrapper which could be called every 10ms
      addEvent(global, 'load',
        getOrCreateCache(WIN_ID, global, 'load').dispatcher = winLoadWrapper);

      // Warning: Disables bfcache for all browsers.
      // Safari <= 3.1 has an issue with restoring the "document"
      // object when page is returned to via the back button using its bfcache.
      addEvent(global, 'unload',
        getOrCreateCache(WIN_ID, global, 'unload').dispatcher = winUnloadWrapper);
    })();

    return {
      'KEY_BACKSPACE': 8,
      'KEY_DELETE':    46,
      'KEY_DOWN':      40,
      'KEY_END':       35,
      'KEY_ESC':       27,
      'KEY_HOME':      36,
      'KEY_INSERT':    45,
      'KEY_LEFT':      37,
      'KEY_PAGEDOWN':  34,
      'KEY_PAGEUP':    33,
      'KEY_RETURN':    13,
      'KEY_RIGHT':     39,
      'KEY_TAB':       9,
      'KEY_UP':        38,
      'fire':          fire,
      'getEventID':    getEventID,
      'observe':       observe,
      'stopObserving': stopObserving
    };
  })());

  Object.extend(Event, Event.Methods);

  Object.extend(Element.Methods, {
    'fire':          Event.fire,
    'getEventID':    Event.getEventID,
    'observe':       Event.observe,
    'stopObserving': Event.stopObserving
  });

  Object.extend(doc, {
    'loaded':        false,
    'fire':          Element.Methods.fire.methodize(),
    'observe':       Element.Methods.observe.methodize(),
    'stopObserving': Element.Methods.stopObserving.methodize()
  });
