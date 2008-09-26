if (!window.Event) var Event = { };

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,
  KEY_INSERT:   45,
  
  cache: { },

  relatedTarget: function(event) {
    var element;
    switch(event.type) {
      case 'mouseover': element = event.fromElement; break;
      case 'mouseout':  element = event.toElement;   break;
      default: return null;
    }
    return Element.extend(element);
  }
});

Event.Methods = (function() {
  var isButton;

  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    isButton = function(event, code) {
      return event.button == buttonMap[code];
    };
    
  } else if (Prototype.Browser.WebKit) {
    isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };
    
  } else {
    isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  return {
    isLeftClick:   function(event) { return isButton(event, 0) },
    isMiddleClick: function(event) { return isButton(event, 1) },
    isRightClick:  function(event) { return isButton(event, 2) },
    
    element: function(event) {
      event = Event.extend(event);
      var node = event.target, type = event.type,
       currentTarget = event.currentTarget;
      
      if (currentTarget && currentTarget.tagName) {
        // Firefox screws up the "click" event when moving between radio buttons
        // via arrow keys. It also screws up the "load" and "error" events on images,
        // reporting the document as the target instead of the original image.
        if (['load', 'error'].include(type) || (currentTarget.tagName.toUpperCase() === 'INPUT' &&
         currentTarget.type === 'radio' && type === 'click'))
          node = currentTarget;
      }
      
      return Element.extend(node && node.nodeType == Node.TEXT_NODE ?
       node.parentNode : node);
    },

    findElement: function(event, expression) {
      var element = Event.element(event);
      if (!expression) return element;
      var elements = [element].concat(element.ancestors());
      return Selector.findElement(elements, expression, 0);
    },

    pointer: function(event) {
      var docElement = document.documentElement,
       body = document.body || { scrollLeft: 0, scrollTop: 0 };
      return {
        x: event.pageX || (event.clientX + 
          (docElement.scrollLeft || body.scrollLeft) -
          (docElement.clientLeft || 0)),
        y: event.pageY || (event.clientY + 
          (docElement.scrollTop || body.scrollTop) -
          (docElement.clientTop || 0))
      };
    },

    pointerX: function(event) { return Event.pointer(event).x },
    pointerY: function(event) { return Event.pointer(event).y },

    stop: function(event) {
      Event.extend(event);
      event.preventDefault();
      event.stopPropagation();
      event.stopped = true;
    }
  };
})();

Event.extend = (function() {
  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });
  
  if (Prototype.Browser.IE) {
    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return "[object Event]" }
    });

    return function(event) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;
      
      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);
      Object.extend(event, {
        target: event.srcElement,
        relatedTarget: Event.relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });
      return Object.extend(event, methods);
    };
    
  } else {
    Event.prototype = Event.prototype || document.createEvent("HTMLEvents").__proto__;
    Object.extend(Event.prototype, methods);
    return Prototype.K;
  }
})();

Object.extend(Event, (function() {
  var global = this;
  
  function getEventID(element) {
    if (element === global) return 1;
    if (element.nodeType === 9) return 2;
    return element.getEventID();
  }
  getEventID.id = 3;
  
  function getNewEventID(element) {
    var id = getEventID.id++;
    element._prototypeEventID = [id]; // backwards compatibility
    return id;
  }
  
  function getDOMEventName(eventName) {
    if (eventName && eventName.include(':')) return "dataavailable";
    return eventName;
  }
  
  function getCacheForEventName(id, eventName) {
    var c = Event.cache[id];
    return c && c.events[eventName] || { wrappers:[], handlers:[] };
  }
  
  function findWrapper(id, eventName, handler) {
    var enc = getCacheForEventName(id, eventName),
     length = enc.handlers.length;
    while (length--) {
      if (enc.handlers[length] === handler)
        return { wrapper:enc.wrappers[length], index:length };
    }
    return { wrapper:null, index:null };
  }
  
  function isEventValid(event, eventName) {
    // Prevent a Firefox bug from throwing errors on page load/unload (#5393, #9421).
    // When firing a custom event all "dataavailable" observers for that element will fire.
    // Before executing, make sure the event.eventName matches the private eventName.
    return Event && Event.extend && (!event.eventName ||
      event.eventName && event.eventName === eventName);
  }
  
  function cacheEvent(element, eventName, handler) {
    var id = getEventID(element),
     enc = createCacheForEvent(element, eventName);
    return createAndCacheWrapper(id, eventName, handler);
  }
  
  function createCacheForEvent(element, eventName) {
    var id = getEventID(element),
     c = Event.cache[id] = Event.cache[id] || { events: { } };
    c.element = c.element || element;
    return Event.cache[id].events[eventName] = getCacheForEventName(id, eventName);
  }
  
  function createAndCacheWrapper(id, eventName, handler) {
    var enc = getCacheForEventName(id, eventName);
    if (enc.handlers.include(handler)) return false;
    
    // add to beginning of the array because we
    // iterate with a reverse while loop
    var wrapper = createWrapper(id, eventName, handler);
    enc.wrappers.unshift(wrapper);
    enc.handlers.unshift(handler);
    return wrapper;
  }
  
  function createWrapper(id, eventName, handler) {
    return function(event) {
      if (!isEventValid(event, eventName)) return false;
      handler.call(Event.cache[id].element, Event.extend(event));
    };
  }
  
  function destroyWrapper(id, eventName, index) {
    var c = Event.cache[id], enc = c.events[eventName];
    enc.wrappers.splice(index, 1);
    enc.handlers.splice(index, 1);
    
    // clean-up cache
    if (!enc.handlers.length) delete c.events[eventName];
    for (var i in c.events) return;
    delete Event.cache[id];
  }
  
  // Safari has a dummy event handler on page unload so that it won't
  // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
  // object when page is returned to via the back button using its bfcache.
  if (Prototype.Browser.WebKit) {
    window.addEventListener("unload", Prototype.emptyFunction, false);
  }
    
  return {
    getEventID: function() {
      arguments[0] = $(arguments[0]);
      // handle calls from Event object
      if (this !== global)
        return arguments[0].getEventID();
      // private id variable
      var id = getNewEventID(arguments[0]);
      // if cache doesn't match, request a new id
      var method = function(element) {
        var c = Event.cache[id];
        if (c && c.element !== element)
          id = getNewEventID(element);
        return id;
      };
      // overwrite element.getEventID and execute
      return (arguments[0].getEventID = method.methodize())();
    },
    
    observe: function(element, eventName, handler) {
      element = $(element);
      var name = getDOMEventName(eventName),
       wrapper = cacheEvent(element, eventName, handler);
      
      if (!wrapper) return element;
      if (element.addEventListener) {
        element.addEventListener(name, wrapper, false);
      } else {
        element.attachEvent("on" + name, wrapper);
      }
      return element;
    },
  
    stopObserving: function(element, eventName, handler) {
      element = $(element);
      eventName = Object.isString(eventName) ? eventName : null;
      var id = getEventID(element), c = Event.cache[id];
       enc = getCacheForEventName(id, eventName);
      
      if (!c)
        return element;
      else if (!handler && eventName) {
        var length = enc.wrappers.length;
        while (length--) Event.stopObserving(element, eventName,
          { wrapper:enc.wrappers[length], index:length });
        return element;
      }
      else if (!eventName) {
        for (var eventName in c.events)
          Event.stopObserving(element, eventName);
        return element;
      }
      
      var found = typeof handler === 'object' ?
        handler : findWrapper(id, eventName, handler);
      if (!found.wrapper) return element;
      
      var name = getDOMEventName(eventName);
      if (element.removeEventListener) {
        element.removeEventListener(name, found.wrapper, false);
      } else {
        element.detachEvent("on" + name, found.wrapper);
      }
      
      destroyWrapper(id, eventName, found.index);
      return element;
    },
  
    fire: function(element, eventName, memo) {
      element = $(element);
      if (element === document && document.createEvent && !element.dispatchEvent)
        element = document.documentElement;
        
      var event;
      if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("dataavailable", true, true);
      } else {
        event = document.createEventObject();
        event.eventType = "ondataavailable";
      }

      event.eventName = eventName;
      event.memo = memo || { };

      if (document.createEvent) {
        element.dispatchEvent(event);
      } else {
        element.fireEvent(event.eventType, event);
      }
      return Event.extend(event);
    }
  };
})());

Object.extend(Event, Event.Methods);

Element.addMethods({
  fire:          Event.fire,
  getEventID:    Event.getEventID,
  observe:       Event.observe,
  stopObserving: Event.stopObserving
});

Object.extend(document, {
  fire:          Element.Methods.fire.methodize(),
  getEventID:    Element.Methods.getEventID.methodize(),
  observe:       Element.Methods.observe.methodize(),
  stopObserving: Element.Methods.stopObserving.methodize(),
  loaded:        false
});

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb, 
     Matthias Miller, Dean Edwards, John Resig and Diego Perini. */
  
  var timer, global = this, doc = document;
  
  function clearTimer() {
    timer && global.clearInterval(timer);
  }
  
  function fireDomLoadedEvent() {
    clearTimer();
    if (doc.loaded) return;
    doc.loaded = true;
    return doc.fire("dom:loaded");
  }
  
  var respondToReadyState = function(event) {
    clearTimer();
    checkDomLoadedState(event);
  };
  
  var checkDomLoadedState = function(event) {
    if (event && event.type === 'DOMContentLoaded' ||
        /loaded|complete/.test(doc.readyState)) {
      doc.stopObserving("readystatechange", respondToReadyState);
      fireDomLoadedEvent();
    }
  };
  
  // IE
  if ('attachEvent' in doc && !('addEventListener' in doc)) {
    if (global === top) {
      // doScroll() does not error when the document
      // is in an iframe. Fallback on document readyState.
      checkDomLoadedState = function() {
        try { doc.documentElement.doScroll("left") } catch(e) { return }
        fireDomLoadedEvent();
      };
    }
    respondToReadyState = checkDomLoadedState;
  }
  
  // worst case fallbacks... 
  timer = setInterval(checkDomLoadedState, 10);
  Event.observe(window, "load", fireDomLoadedEvent);
  
  // remove timer if other options are available
  $w('DOMContentLoaded readystatechange')._each(function(eventName) {
    doc.observe(eventName, respondToReadyState);
  });
})();
