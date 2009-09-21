  /*---------------------------------- EVENT ---------------------------------*/

  if (!global.Event) global.Event = { };

  Event.CUSTOM_EVENT_NAME =
    Feature('ELEMENT_ADD_EVENT_LISTENER') ? 'dataavailable' :
    Feature('ELEMENT_ATTACH_EVENT') ? 'beforeupdate' : 'keyup';

  Event.Methods = { };

  /*--------------------------------------------------------------------------*/

  (function(methods) {

    var BUGGY_EVENT_TYPES = {
      'error': 1,
      'load':  1
    },

    // lazy define on first call
    isButton = function(event, mouseButton) {
      var property = (typeof event.which === 'number')
       ? 'which' : (typeof event.button === 'number')
         ? 'button' : false,

      buttonMap = (property === 'button')
        ? { 'left': 1, 'middle': 4, 'right': 2 }
        : { 'left': 1, 'middle': 2, 'right': 3 };

      return (isButton = property === false
        ? function() { return false; }
        : function(event, mouseButton) {
            return event[property] === buttonMap[mouseButton];
          }
      )(event, mouseButton);
    };

    methods.element = function element(event) {
      event = Event.extend(event);
      var node = event.target, type = event.type,
       currentTarget = event.currentTarget;

      // Firefox screws up the "click" event when moving between radio buttons
      // via arrow keys. It also screws up the "load" and "error" events on images,
      // reporting the document as the target instead of the original image.

      // Note: Fired events don't have a currentTarget
      if (currentTarget && (BUGGY_EVENT_TYPES[type] ||
          getNodeName(currentTarget) === 'INPUT' &&
          currentTarget.type === 'radio' && type === 'click'))
        node = currentTarget;

      // Fix a Safari bug where a text node gets passed as the target of an
      // anchor click rather than the anchor itself.
      return node && node.nodeType === 3
        ? decorate(node.parentNode)
        : Element(node);
    };

    methods.findElement = function findElement(event, selectors) {
      var element = Event.element(event);
      if (!selectors || selectors == null) return element;
      return element.match(selectors)
        ? element
        : element.up(selectors);
    };

    methods.isLeftClick = function isLeftClick(event) {
      return isButton(event, 'left');
    };

    methods.isMiddleClick = function isMiddleClick(event) {
      return isButton(event, 'middle');
    };

    methods.isRightClick = function isRightClick(event) {
      return isButton(event, 'right');
    };

    methods.pointer = function pointer(event) {
      return { 'x': Event.pointerX(event), 'y': Event.pointerY(event) };
    };

    methods.stop = function stop(event) {
      // Set a "stopped" property so that a custom event can be inspected
      // after the fact to determine whether or not it was stopped.
      event = Event.extend(event);
      event.stopped = true;
      event.preventDefault();
      event.stopPropagation();
    };

    // prevent JScript bug with named function expressions
    var element =    null,
     findElement =   null,
     isLeftClick =   null,
     isMiddleClick = null,
     isRightClick =  null,
     pointer =       null,
     stop =          null;
  })(Event.Methods);

  // lazy define Event.pointerX() and Event.pointerY()
  (function(methods) {
    function define(methodName, event) {
      if (!Fuse._body) return 0;
      if (typeof event.pageX === 'number') {
        Event.pointerX =
        methods.pointerX = function(event) { return event.pageX; };

        Event.pointerY =
        methods.pointerY = function(event) { return event.pageY; };
      }
      else {
        Event.pointerX =
        methods.pointerX = function(event) {
          var info = Fuse._info,
           doc = getDocument(event.srcElement || global),
           result = event.clientX + doc[info.scrollEl.property].scrollLeft -
             doc[info.root.property].clientLeft;

          return result > -1 ? result : 0;
        };

        Event.pointerY =
        methods.pointerY = function(event) {
          var info = Fuse._info,
           doc = getDocument(event.srcElement || global),
           result = event.clientY + doc[info.scrollEl.property].scrollTop -
             doc[info.root.property].clientTop;

           return result > -1 ? result : 0;
        };
      }
      return methods[methodName](event);
    }

    methods.pointerX = Func.curry(define, 'pointerX');
    methods.pointerY = Func.curry(define, 'pointerY');
  })(Event.Methods);

  /*--------------------------------------------------------------------------*/

  (function(proto) {

    function addLevel2Methods(event) {
      event.preventDefault  = preventDefault;
      event.stopPropagation = stopPropagation;

      // avoid memory leak
      event.pointer  = createPointerMethod();
      event.pointerX = createPointerMethod('x');
      event.pointerY = createPointerMethod('y');

      var length = Methods.length;
      while (length--) {
        pair = Methods[length];
        if (!(pair[0] in event))
          event[pair[0]] = pair[1];
      }
      return event;
    }

    function addLevel2Properties(event, element) {
      event.pageX = Event.pointerX(event);
      event.pageY = Event.pointerY(event);

      event._extendedByFuse = emptyFunction;
      event.currentTarget   = element;
      event.target          = event.srcElement || element;
      event.relatedTarget   = relatedTarget(event);
      return event;
    }

    function createPointerMethod(xOrY) {
      switch (xOrY) {
        case 'x': return function() { return this.pageX; };
        case 'y': return function() { return this.pageY; };
        default : return function() { return { 'x': this.pageX, 'y': this.pageY }; };
      }
    }

    function relatedTarget(event) {
      switch (event.type) {
        case 'mouseover': return decorate(event.fromElement);
        case 'mouseout':  return decorate(event.toElement);
        default:          return null;
      }
    }

    function preventDefault() {
      this.returnValue = false;
    }

    function stopPropagation() {
      this.cancelBubble = true;
    }

    function addCache(id, eventName, handler) {
      // bail if handler is already exists
      var ec = getOrCreateCache(id, eventName);
      if (arrayIndexOf.call(ec.handlers, handler) != -1)
        return false;

      ec.handlers.unshift(handler);
      if (ec.dispatcher) return false;
      return (ec.dispatcher = createDispatcher(id, eventName));
    }

    function getEventName(eventName) {
      if (eventName && eventName.indexOf(':') > -1)
        return Event.CUSTOM_EVENT_NAME;
      return eventName;
    }

    function getOrCreateCache(id, eventName) {
      var data = Data[id],
       events = data.events || (data.events ={ });
      return (events[eventName] = events[eventName] ||
        { 'handlers': [], 'dispatcher': false });
    }

    function removeCacheAtIndex(id, eventName, index) {
      // remove responders and handlers at the given index
      var events = Data[id].events, ec = events[eventName];
      ec.handlers.splice(index, 1);

      // if no more handlers/responders then
      // remove the eventName cache
      if (!ec.handlers.length) delete events[eventName];
    }

    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    function domLoadWrapper(event) {
      if (!Fuse._doc.loaded) {
        event = event || global.event;
        event.eventName = 'dom:loaded';

        // define pseudo private body and root properties
        Fuse._body     = Fuse._doc.body;
        Fuse._root     = Fuse._docEl;
        Fuse._scrollEl = Fuse._body;

        if (Bug('BODY_ACTING_AS_ROOT')) {
          Fuse._root = Fuse._body;
          Fuse._info.root = Fuse._info.body;
        }
        if (Bug('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT')) {
          Fuse._scrollEl = Fuse._docEl;
          Fuse._info.scrollEl = Fuse._info.docEl;
        }

        Fuse._doc.loaded = true;
        domLoadDispatcher(event);
        Event.stopObserving(Fuse._doc, 'dom:loaded');
      }
    }

    function winLoadWrapper(event) {
      event = event || global.event;
      if (!Fuse._doc.loaded)
        domLoadWrapper(event);
      else if (Data['2'] && Data['2'].events['dom:loaded'])
        return setTimeout(function() { winLoadWrapper(event); }, 10);

      event.eventName = null;
      winLoadDispatcher(event);
      Event.stopObserving(global, 'load');
    }

    /*------------------------------------------------------------------------*/

    var Methods, domLoadDispatcher, winLoadDispatcher,

    arrayIndexOf = Array.prototype.indexOf || Fuse.Array.plugin.indexOf,

    setTimeout = global.setTimeout,

    addMethods = function addMethods(methods) {
      var name; Methods = [];
      methods && Obj.extend(Event.Methods, methods);

      eachKey(Event.Methods, function(value, key, object) {
        if (key.indexOf('pointer') != 0)
          Methods.push([key, Func.methodize([key, object])]);
      });
    },

    // DOM Level 0
    addObserver = function(element, eventName, handler) {
      var attrName = 'on' + getEventName(eventName),
       id = Node.getFuseId(element),
       oldHandler = element[attrName];

      if (oldHandler) {
        if (oldHandler.isDispatcher) return false;
        addCache(id, eventName, element[attrName]);
      }

      element[attrName] = Data[id].events[eventName].dispatcher;
    },

    // DOM Level 0
    removeObserver = function(element, eventName, handler) {
      var attrName = 'on' + getEventName(eventName);
      if (!eventName.indexOf(':') > -1 && element[attrName] === handler)
        element[attrName] = null;
    },

    // DOM Level 0
    createDispatcher = function(id, eventName) {
      var dispatcher = function(event) {
        if (!Event || !Event.extend) return false;
        event = Event.extend(event || getWindow(this).event, this);

        var handlers, length,
         data = Data[id],
         context = data.decorator || data.node,
         events = data.events,
         ec = events && events[event.eventName || eventName];

        if (!ec) return false;

        handlers = slice.call(ec.handlers, 0);
        length = handlers.length;
        while (length--) handlers[length].call(context, event);
      };

      dispatcher.isDispatcher = true;
      return dispatcher;
    },

    extend = function extend(event, element) {
      return event && !event._extendedByFuse
        ? addLevel2Properties(addLevel2Methods(event), element)
        : event;
    },

    createEvent = function() { return false; },

    fireEvent   = createEvent;

    /*------------------------------------------------------------------------*/

    if (Feature('ELEMENT_ADD_EVENT_LISTENER') || Feature('ELEMENT_ATTACH_EVENT')) {
      // Event dispatchers manage several handlers and ensure
      // FIFO execution order. They are attached as the event
      // listener and execute all the handlers they manage.
      createDispatcher = function(id, eventName) {
        return function(event) {
          // Prevent a Firefox bug from throwing errors on page
          // load/unload (#5393, #9421). When firing a custom event all the
          // CUSTOM_EVENT_NAME observers for that element will fire. Before
          // executing, make sure the event.eventName matches the eventName.
          if (!Event || !Event.extend || (event.eventName &&
              event.eventName !== eventName)) return false;

          // shallow copy handlers to avoid issues with nested
          // observe/stopObserving
          var data = Data[id],
           ec = data.events[eventName],
           node = data.node,
           context = data.decorator || node,
           handlers = slice.call(ec.handlers, 0),
           length = handlers.length;

          event = Event.extend(event || getWindow(node).event, node);
          while (length--) handlers[length].call(context, event);
        };
      };

      // DOM Level 2
      if (Feature('ELEMENT_ADD_EVENT_LISTENER')) {
        addObserver = function(element, eventName, handler) {
          element.addEventListener(getEventName(eventName), handler, false);
        };

        removeObserver = function(element, eventName, handler) {
          element.removeEventListener(getEventName(eventName), handler, false);
        };
      }
      // JScript
      else if (Feature('ELEMENT_ATTACH_EVENT')) {
        addObserver = function(element, eventName, handler) {
          element.attachEvent('on' + getEventName(eventName), handler);
        };

        removeObserver =  function(element, eventName, handler) {
          element.detachEvent('on' + getEventName(eventName), handler);
        };
      }
    }

    // DOM Level 2
    if (Feature('DOCUMENT_CREATE_EVENT') && Feature('ELEMENT_DISPATCH_EVENT')) {
      createEvent = function(context, eventType) {
        var event = getDocument(context).createEvent('HTMLEvents');
        eventType && event.initEvent(eventType, true, true);
        return event;
      };

      fireEvent = function(element, event) {
        // In the W3C system, all calls to document.fire should treat
        // document.documentElement as the target
        if (element.nodeType === 9)
          element = element.documentElement;
        element.dispatchEvent(event);
      };
    }
    // JScript
    else if(Feature('DOCUMENT_CREATE_EVENT_OBJECT') && Feature('ELEMENT_FIRE_EVENT')) {
      createEvent = function(context, eventType) {
        var event = getDocument(context).createEventObject();
        eventType && (event.eventType = 'on' + eventType);
        return event;
      };

      fireEvent = function(element, event) {
        element.fireEvent(event.eventType, event);
      };
    }


    // extend Event.prototype
    if (proto || Feature('OBJECT__PROTO__')) {

      // redefine addMethods to support Event.prototype
      addMethods = function addMethods(methods) {
        var name; Methods = [];
        methods && Obj.extend(Event.Methods, methods);

        eachKey(Event.Methods, function(value, key, object) {
          proto[key] = Func.methodize([key, object]);
        });
      };

      // Safari 2 support
      if (!proto)
        proto = Event.prototype = createEvent(Fuse._doc)['__proto__'];

      // IE8 supports Event.prototype but still needs
      // DOM Level 2 event methods and properties.
      if (hasKey(proto, 'cancelBubble') &&
          hasKey(proto, 'returnValue') &&
         !hasKey(proto, 'stopPropagation') &&
         !hasKey(proto, 'preventDefault') &&
         !hasKey(proto, 'target') &&
         !hasKey(proto, 'currentTarget')) {

        extend = function extend(event, element) {
          return event && !event._extendedByFuse
            ? addLevel2Properties(event, element)
            : event;
        };

        // initially add methods
        addMethods();
        addLevel2Methods(proto);
      }
      else extend = K;
    }

    // avoid Function#wrap for better performance esp.
    // in winLoadWrapper which could be called every 10ms
    domLoadDispatcher = createDispatcher(2, 'dom:loaded');
    addObserver(Fuse._doc, 'dom:loaded',
      (getOrCreateCache(2, 'dom:loaded').dispatcher = domLoadWrapper));

    winLoadDispatcher = createDispatcher(1, 'load');
    addObserver(global, 'load',
      (getOrCreateCache(1, 'load').dispatcher = winLoadWrapper));

    /*------------------------------------------------------------------------*/

    Event.addMethods = addMethods;

    Event.extend = extend;

    Event.fire = function fire(element, eventName, memo) {
      var event, decorator = Fuse.get(element);
      element = decorator.raw || decorator;
      event = createEvent(element, Event.CUSTOM_EVENT_NAME);

      if (!event) return false;
      event.eventName = eventName;
      event.memo = memo || { };

      fireEvent(element, event);
      return Event.extend(event);
    };

    Event.observe = function observe(element, eventName, handler) {
      var dispatcher, decorator = Fuse.get(element);
      element = decorator.raw || decorator;

      dispatcher = addCache(Node.getFuseId(element), eventName, handler);
      if (!dispatcher) return decorator;

      addObserver(element, eventName, dispatcher);
      return decorator;
    };

    Event.stopObserving = function stopObserving(element, eventName, handler) {
      var dispatcher, ec, events, foundAt, id, length,
       decorator = Fuse.get(element);

      element = decorator.raw || decorator;
      eventName = isString(eventName) ? eventName : null;

      id = Node.getFuseId(element);
      events = Data[id].events;

      if (!events) return decorator;
      ec = events[eventName];

      if (ec && handler == null) {
        // If an event name is passed without a handler,
        // we stop observing all handlers of that type.
        length = ec.handlers.length;
        if (!length) Event.stopObserving(element, eventName, 0);
        else while (length--) Event.stopObserving(element, eventName, length);
        return decorator;
      }
      else if (!eventName || eventName == '') {
        // If both the event name and the handler are omitted,
        // we stop observing _all_ handlers on the element.
        for (eventName in events)
          Event.stopObserving(element, eventName);
        return decorator;
      }

      dispatcher = ec.dispatcher;
      foundAt = isNumber(handler) ? handler : arrayIndexOf.call(ec.handlers, handler);

      if (foundAt < 0) return decorator;
      removeCacheAtIndex(id, eventName, foundAt);

      if (!events[eventName])
        removeObserver(element, eventName, dispatcher);

      return decorator;
    };

    // add methods if haven't yet
    if (!Methods) addMethods();

  })(Event.prototype);

  /*--------------------------------------------------------------------------*/

  Obj.extend(Event, Event.Methods);

  _extend(Event, {
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

  _extend(Element.plugin, {
    'fire':          Func.methodize(['fire', Event]),
    'observe':       Func.methodize(['observe', Event]),
    'stopObserving': Func.methodize(['stopObserving', Event])
  });

  _extend(Fuse._doc, {
    'loaded':        false,
    'fire':          Func.methodize(['fire', Event]),
    'observe':       Func.methodize(['observe', Event]),
    'stopObserving': Func.methodize(['stopObserving', Event])
  });
