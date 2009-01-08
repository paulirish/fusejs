  /*---------------------------------- EVENT ---------------------------------*/

  if (!global.Event) Event = { };

  Object.extend(Event, {
    'cache':         { },
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
    'KEY_UP':        38
  });

  /*--------------------------------------------------------------------------*/

  Event.Methods = (function() {
    var isButton = (function() {
      if (P.Browser.IE) {
        // IE doesn't map left/right/middle the same way.
        var buttonMap = { '0': 1, '1': 4, '2': 2 };
        return function(event, code) {
          return event.button == buttonMap[code];
        };
      }
      if (P.Browser.WebKit) {
        // In Safari we have to account for when the user
        // holds down the "meta" key.
        return function(event, code) {
          switch (code) {
            case 0:  return event.which == 1 && !event.metaKey;
            case 1:  return event.which == 1 && event.metaKey;
            default: return false;
          }
        };
      }
      return function(event, code) {
        return event.which ? (event.which === code + 1) : (event.button === code);
      };
    })();

    function isLeftClick(event) {
      return isButton(event, 0);
    }

    function isMiddleClick(event) {
      return isButton(event, 1);
    }

    function isRightClick(event) {
      return isButton(event, 2);
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
      return Element.extend(node && node.nodeType == Node.TEXT_NODE ?
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
      if ('pageXOffset' in global) {
        m.pointerX = function() { return global.pageXOffset };
        m.pointerY = function() { return global.pageYOffset };
      } else {
        var node = Bug('BODY_ACTING_AS_ROOT') ? body : docEl;
        m.pointerX = function(event) { return event.clientX + (node.scrollLeft - docEl.clientLeft) };
        m.pointerY = function(event) { return event.clientY + (node.scrollTop  - docEl.clientTop)  };
      }
      return m[methodName](event);
    }
    m.pointerX = define.curry('pointerX');
    m.pointerY = define.curry('pointerY');
  })(Event.Methods);

  /*--------------------------------------------------------------------------*/

  Event.extend = (function() {
    // Compile the list of methods that get extended onto Events.
    var Methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
      // use custom "methodize" to allow lazy defined Event methods
      Event.Methods[name]._methodized = m[name] = function() {
        return arguments.length
          ? Event.Methods[name].apply(null, prependList(arguments, this))
          : Event.Methods[name].call(null, this);
      };
      return m;
    });

    // populate Event.prototype if needed
    (function(EP) {
      if (!EP) return;
      Event.prototype = EP;
      Object.extend(Event.prototype, Methods);
    })(Event.prototype || (isHostObject(doc, 'createEvent') && doc.createEvent('HTMLEvents')['__proto__']));

    if (Event.prototype) return K;

    var inspect = function() {
      return '[object Event]';
    };

    var preventDefault = function() {
      this.returnValue = false;
    };

    var relatedTarget = function(event) {
      switch (event.type) {
        case 'mouseover': return Element.extend(event.fromElement);
        case 'mouseout':  return Element.extend(event.toElement);
        default:          return null;
      }
    };

    var stopPropagation = function() {
      this.cancelBubble = true;
    };

    Object.extend(Methods, {
      stopPropagation: stopPropagation,
      preventDefault:  preventDefault,
      inspect:         inspect
    });

    return function(event) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      Object.extend(event, {
        '_extendedByPrototype': P.emptyFunction,
        'pageX':                Event.pointerX(event),
        'pageY':                Event.pointerY(event),
        'relatedTarget':        relatedTarget(event),
        'target':               event.srcElement
      });
      return Object.extend(event, Methods);
    };
  })();

  /*--------------------------------------------------------------------------*/

  Object.extend(Event, Event.Methods);

  (function() {
    var EVENT_OBSERVER_ORDER_NOT_FIFO = false;

    var addEvent = function(element, eventName, handler) {
      element.addEventListener(getDOMEventName(eventName), handler, false);
    };

    var removeEvent = function(element, eventName, handler) {
      element.removeEventListener(getDOMEventName(eventName), handler, false);
    };

    // redefine for IE
    if (Feature('ELEMENT_ATTACH_EVENT')) {
      addEvent = function(element, eventName, handler) {
        element.attachEvent('on' + getDOMEventName(eventName), handler);
      };
      removeEvent = function(element, eventName, handler) {
        element.detachEvent('on' + getDOMEventName(eventName), handler);
      };
    }

    /*--------------------------------------------------------------------------*/

    function getDOMEventName(eventName) {
      if (eventName && eventName.include(':')) return 'dataavailable';
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

    function getEventCache(id, eventName) {
      var c = Event.cache[id];
      return c && c.events[eventName] || { 'responders':[], 'handlers':[], 'dispatcher':false };
    }

    function cacheEvent(element, eventName, handler) {
      var id = getCacheID(element),
       ec = createEventCache(element, eventName);

      var hasHandler = ec.handlers.include(handler),
       useDispatcher = EVENT_OBSERVER_ORDER_NOT_FIFO || ec.dispatcher;

      // add to beginning of the array (unshift) 
      // because we iterate with a reverse while loop
      if (!useDispatcher) {
        if (hasHandler) return false;
        ec.handlers.unshift(handler);
        ec.responders.unshift(createResponder(id, eventName, handler));
        return ec.responders[0];
      }
      if (!hasHandler) {
        ec.handlers.unshift(handler);
        ec.responders.unshift(null);
      }
      if (ec.dispatcher) return false;
      return ec.dispatcher = createDispatcher(id, eventName);
    }

    function createEventCache(element, eventName, handler) {
      var id = getCacheID(element),
       c = Event.cache[id] = Event.cache[id] || { 'events': { } };
      c.element = c.element || element;
      return Event.cache[id].events[eventName] = getEventCache(id, eventName);
    }

    function createResponder(id, eventName, handler) {
      return function(event) {
         if (!isEventValid(event, eventName)) return false;
         handler.call(Event.cache[id].element, Event.extend(event));
       };
    }

    function createDispatcher(id, eventName) {
      return function(event) {
        if (!isEventValid(event, eventName)) return false;
        // Make a shallow copy of the handlers array so 
        // changes made by other observers won't effect
        // iterating over the handlers.
        var c = Event.cache[id], ec = c.events[eventName],
         handlers = slice.call(ec.handlers, 0), length = handlers.length;
        while (length--) handlers[length].call(c.element, Event.extend(event));
      };
    }

    function destroyCacheAtIndex(id, eventName, index) {
      var c = Event.cache[id], ec = c.events[eventName];
      ec.responders.splice(index, 1);
      ec.handlers.splice(index, 1);

      // clean-up cache
      if (!ec.handlers.length) delete c.events[eventName];
      for (var i in c.events) return;
      delete Event.cache[id];
    }

    function findResponder(id, eventName, handler) {
      var ec = getEventCache(id, eventName),
       length = ec.handlers.length;
      while (length--) {
        if (ec.handlers[length] === handler)
          return { 'responder': ec.responders[length], 'index': length };
      }
      return false;
    }

    function isEventValid(event, eventName) {
      // Prevent a Firefox bug from throwing errors on page load/unload (#5393, #9421).
      // When firing a custom event all "dataavailable" observers for that element will fire.
      // Before executing, make sure the event.eventName matches the eventName.
      return Event && Event.extend && (!event.eventName ||
        event.eventName && event.eventName === eventName);
    }

    /*--------------------------------------------------------------------------*/

    Object.extend(Event, (function() {
      function fire(element, eventName, memo) {
        // In the W3C system, all calls to document.fire should treat
        // document.documentElement as the target
        element = $(element);
        if (element.nodeType === 9 && doc.createEvent && !element.dispatchEvent)
          element = element.documentElement;

        var event, usesCreateEvent = isHostObject(doc, 'createEvent');

        if (usesCreateEvent) {
          event = getOwnerDoc(element).createEvent('HTMLEvents');
          event.initEvent('dataavailable', true, true);
        } else {
          event = doc.createEventObject();
          event.eventType = 'ondataavailable';
        }

        event.eventName = eventName;
        event.memo = memo || { };

        if (usesCreateEvent) {
          element.dispatchEvent(event);
        } else {
          element.fireEvent(event.eventType, event);
        }
        return Event.extend(event);
      }

      function observe(element, eventName, handler) {
        element = $(element);
        var responder = cacheEvent(element, eventName, handler);
        if (!responder) return element;
        addEvent(element, eventName, responder);
        return element;
      }

      function getEventID() {
        arguments[0] = $(arguments[0]);
        // handle calls from Event object
        if (this !== global)
          return arguments[0].getEventID();
        // private id variable
        var id = getNewCacheID(arguments[0]);
        var method = function(element) {
          // if cache doesn't match, request a new id
          var c = Event.cache[id];
          if (c && c.element !== element)
            id = getNewCacheID(element);
          return id;
        };
        // overwrite element.getEventID and execute
        return (arguments[0].getEventID = method.methodize())();
      }

      function stopObserving(element, eventName, handler) {
        element = $(element);
        eventName = (typeof eventName === 'string') ? eventName : null;
        var id = getCacheID(element), c = Event.cache[id],
         ec = getEventCache(id, eventName);

        if (!c)
          return element;
        else if (!handler && eventName) {
          // If an event name is passed without a handler,
          // we stop observing all handlers of that type.
          var length = ec.responders.length;
          while (length--) Event.stopObserving(element, eventName,
            { 'responder': ec.responders[length], 'index':length });
          return element;
        }
        else if (!eventName) {
          // If both the event name and the handler are omitted,
          // we stop observing _all_ handlers on the element.
          for (var eventName in c.events)
            Event.stopObserving(element, eventName);
          return element;
        }

        var dispatcher = ec.dispatcher;
        var found = (typeof handler === 'object') ? 
          handler : findResponder(id, eventName, handler);

        if (!found && !dispatcher) return element;
        destroyCacheAtIndex(id, eventName, found.index);

        if (dispatcher) {
          if (!Event.cache[id] || !Event.cache[id][eventName])
            removeEvent(element, eventName, dispatcher);
        } else removeEvent(element, eventName, found.responder);

        return element;
        }

      return {
        'fire':          fire,
        'getEventID':    getEventID,
        'observe':       observe,
        'stopObserving': stopObserving
      };
    })());

    Object.extend(Element.Methods, {
      'fire':          Event.fire,
      'getEventID':    Event.getEventID,
      'observe':       Event.observe,
      'stopObserving': Event.stopObserving
    });

    Object.extend(doc, {
      'loaded':        false,
      'fire':          Element.Methods.fire.methodize(),
      'getEventID':    Element.Methods.getEventID.methodize(),
      'observe':       Element.Methods.observe.methodize(),
      'stopObserving': Element.Methods.stopObserving.methodize()
    });

    /*--------------------------------------------------------------------------*/

    // set constant after Event methods defined
    EVENT_OBSERVER_ORDER_NOT_FIFO = Bug('EVENT_OBSERVER_ORDER_NOT_FIFO');

    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    (function() {
      var DOM_LOADED_EXECUTED = false;

      function winLoadWrapper(proceed, event) {
        if (!DOM_LOADED_EXECUTED)
          winLoadWrapper.defer(proceed, event);
        else proceed(event);
      }

      function domLoadWrapper(proceed, event) {
        proceed(event);
        DOM_LOADED_EXECUTED = true;
      }

      addEvent(global, 'load', createEventCache(global, 'load').dispatcher = 
        createDispatcher(1 /* window ID */, 'load').wrap(winLoadWrapper));

      addEvent(doc, 'dom:loaded', createEventCache(doc, 'dom:loaded').dispatcher = 
        createDispatcher(2 /* document ID */, 'dom:loaded').wrap(domLoadWrapper));
    })();

    // Safari has a dummy event handler on page unload so that it won't
    // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
    // object when page is returned to via the back button using its bfcache.
    if (P.Browser.WebKit) {
      global.addEventListener('unload', P.emptyFunction, false);
    }
  })();
