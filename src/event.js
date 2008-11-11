  if (!global.Event) Event = { };

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

    if (P.Browser.IE) {
      var buttonMap = { 0: 1, 1: 4, 2: 2 };
      isButton = function(event, code) {
        return event.button == buttonMap[code];
      };

    } else if (P.Browser.WebKit) {
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
        var elements = prependList(Element.ancestors(element), element);
        return Selector.findElement(elements, expression, 0);
      },

      stop: function(event) {
        Event.extend(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopped = true;
      }
    };
  })();

  // Mouse pointer
  (function() {
    var map = { X: 'Left', Y: 'Top' },
     fakeBody = { scrollLeft: 0, scrollTop: 0 };

    $w('X Y')._each(function(C) {
      var Pos = map[C];
      Event.Methods['pointer' + C] = function(event) {
        return event['page' + C] || (event['client' + C] +
         (docEl['scroll' + Pos] || (body || fakeBody)['scroll' + Pos]) -
         (docEl['client' + Pos] || 0));
      };
    });

    Event.Methods.pointer = function(event) {
      return { x: Event.pointerX(event), y: Event.pointerY(event) };
    };
  })();

  Object.extend(Event, Event.Methods);

  Event.extend = (function() {
    var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
      m[name] = Event.Methods[name].methodize();
      return m;
    });

    if (P.Browser.IE) {
      Object.extend(methods, {
        stopPropagation: function() { this.cancelBubble = true },
        preventDefault:  function() { this.returnValue = false },
        inspect: function() { return "[object Event]" }
      });

      return function(event) {
        if (!event) return false;
        if (event._extendedByPrototype) return event;

        event._extendedByPrototype = P.emptyFunction;
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
      Event.prototype = Event.prototype || doc.createEvent("HTMLEvents").__proto__;
      Object.extend(Event.prototype, methods);
      return P.K;
    }
  })();

  (function() {

    var timer, domLoadedDone = false,
     EVENT_OBSERVER_ORDER_NOT_FIFO = false;

    var addEvent = function(element, eventName, handler) {
      element.addEventListener(getDOMEventName(eventName), handler, false);
    };

    var removeEvent = function(element, eventName, handler) {
      element.removeEventListener(getDOMEventName(eventName), handler, false);
    };

    // redefine for IE
    if (Feature('EVENT_USES_ATTACH')) {
      addEvent = function(element, eventName, handler) {
        element.attachEvent("on" + getDOMEventName(eventName), handler);
      };
      removeEvent = function(element, eventName, handler) {
        element.detachEvent("on" + getDOMEventName(eventName), handler);
      };
    }

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
      return c && c.events[eventName] || { wrappers:[], handlers:[], dispatcher:false };
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

    function isUsingDispatcher(id, eventName) {
      return EVENT_OBSERVER_ORDER_NOT_FIFO ||
        !!getCacheForEventName(id, eventName).dispatcher;
    }

    function cacheEvent(element, eventName, handler) {
      var id = getEventID(element),
       enc = createCacheForEvent(element, eventName);

      if (isUsingDispatcher(id, eventName)) {
        createAndCacheWrapper(id, eventName, handler);
        if (enc.dispatcher) return false;
        return enc.dispatcher = createDispatcher(id, eventName);
      }
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
      return isUsingDispatcher(id, eventName) ? handler :
       function(event) {
         if (!isEventValid(event, eventName)) return false;
         handler.call(Event.cache[id].element, Event.extend(event));
       };
    }

    function createDispatcher(id, eventName) {
      return function(event) {
        if (!isEventValid(event, eventName)) return false;
        var enc = getCacheForEventName(id, eventName),
         length = enc.handlers.length, element = Event.cache[id].element;
        event = Event.extend(event);
        while (length--) enc.handlers[length].call(element, event);
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

    Object.extend(Event, {
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
        var wrapper = cacheEvent(element, eventName, handler);
        if (!wrapper) return element;
        addEvent(element, eventName, wrapper);
        return element;
      },

      stopObserving: function(element, eventName, handler) {
        element = $(element);
        eventName = (typeof eventName === 'string') ? eventName : null;
        var id = getEventID(element), c = Event.cache[id],
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

        var dispatcher = enc.dispatcher;
        destroyWrapper(id, eventName, found.index);

        if (dispatcher && (!Event.cache[id] || !Event.cache[id][eventName])) 
          found.wrapper = dispatcher;

        removeEvent(element, eventName, found.wrapper);
        return element;
      },

      fire: function(element, eventName, memo) {
        element = $(element);
        if (element.nodeType === 9 && doc.createEvent && !element.dispatchEvent)
          element = element.documentElement;

        var event;
        if (doc.createEvent) {
          event = getOwnerDoc(element).createEvent("HTMLEvents");
          event.initEvent("dataavailable", true, true);
        } else {
          event = doc.createEventObject();
          event.eventType = "ondataavailable";
        }

        event.eventName = eventName;
        event.memo = memo || { };

        if (doc.createEvent) {
          element.dispatchEvent(event);
        } else {
          element.fireEvent(event.eventType, event);
        }
        return Event.extend(event);
      }
    });

    Element.addMethods({
      fire:          Event.fire,
      getEventID:    Event.getEventID,
      observe:       Event.observe,
      stopObserving: Event.stopObserving
    });

    Object.extend(doc, {
      fire:          Element.Methods.fire.methodize(),
      getEventID:    Element.Methods.getEventID.methodize(),
      observe:       Element.Methods.observe.methodize(),
      stopObserving: Element.Methods.stopObserving.methodize(),
      loaded:        false
    });

    // set constant after Event methods defined
    EVENT_OBSERVER_ORDER_NOT_FIFO = Bug('EVENT_OBSERVER_ORDER_NOT_FIFO');

    // Safari has a dummy event handler on page unload so that it won't
    // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
    // object when page is returned to via the back button using its bfcache.
    if (P.Browser.WebKit)
      global.addEventListener("unload", P.emptyFunction, false);

    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    addEvent(global, "load", 
     createCacheForEvent(global, "load").dispatcher = 
      createDispatcher(1, "load").wrap(function(proceed, event) {
        if (!domLoadedDone) arguments.callee.defer(proceed, event);
        proceed(event);
    }));

    addEvent(doc, "dom:loaded",
     createCacheForEvent(doc, "dom:loaded").dispatcher = 
      createDispatcher(2, "dom:loaded").wrap(function(proceed, event) {
        proceed(event);
        domLoadedDone = true;
    }));

    // Support for the DOMContentLoaded event is based on work by Dan Webb, 
    // Matthias Miller, Dean Edwards, John Resig and Diego Perini.

    function clearTimer() {
      timer && global.clearInterval(timer);
    }

    function checkCssAndFire() {
      return !!(isCssLoaded() && fireDomLoadedEvent());
    }

    function cssDoneLoading() {
      return (isCssLoaded = function() { return true })();
    }

    function getCssRules(sheet) {
      try { return sheet.cssRules }
      catch(e) { return [] }
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
        if (!checkCssAndFire()) timer = setInterval(checkCssAndFire, 10);
      }
    };

    var isCssLoaded = function() {
      // one time call to collect the style elements
      var elements = $$('style,link[rel="stylesheet"]');

      // allSheetsEnabled() will cache its current position in the style elements
      // and css rules so that the next time its called it will resume where
      // it left off and not re-iterate over already tested elements/rules.
      var allSheetsEnabled = (function() {
        var sheet, rules, ruleIndexes, elementIndex;

        return function() {
          elementIndex = elementIndex || elements.length;
          elementloop: while (elementIndex--) {
            // Safari 2 will bail on each loop because "sheet" is always null
            sheet = sheet || elements[elementIndex].sheet;
            rules = rules || getCssRules(sheet);
            ruleIndexes = ruleIndexes || [rules.length];

            // sheets that are not loaded will not have rules,
            // so we always refresh the last ruleIndexes if it is 0
            if (!ruleIndexes.last())
              ruleIndexes.splice(-1, 1, rules.length);

            sheetloop: while (sheet) {
              // if sheet is disabled, but not the element attribute,
              // then increment elementIndex so the next time allSheetsEnabled()
              // is called it will begin at the same element.
              if (sheet.disabled && (!sheet.ownerNode ||
                  !sheet.ownerNode.getAttribute('disabled')) && ++elementIndex)
                return false;

              // each iteration decrements the last index in the stack
              ruleloop: while (ruleIndexes[ruleIndexes.length - 1]--) {
                // skip if not an @import rule
                var rule = rules[ruleIndexes.last()];
                if (!rule.styleSheet) continue ruleloop;

                // update vars and add new rules length to the stack
                sheet = rule.styleSheet;
                rules = getCssRules(sheet);
                ruleIndexes.push(rules.length);
                continue sheetloop;
              }

              // walk back down the stack
              sheet = sheet.parentStyleSheet;
              ruleIndexes.pop();
            }

            // clear cached variables
            sheet = rules = ruleIndexes = null;
          }
          return cssDoneLoading();
        };
      })();

      // no style elements, then always return true
      if (!elements.length)
        return cssDoneLoading();

      // Firefox > 2
      try {
        // Safari 2 has the "sheet" property but it's always null 
        var sheet = elements[0].sheet;
        sheet && sheet.cssRules;
      } catch(e) { 
        return !(isCssLoaded = (function() {
          var length = elements.length; // cached
          return function() {
            // Firefox will throw an error if you try to
            // access the cssRules when the stylesheet isn't loaded
            while (length--) {
              try { elements[length].sheet.cssRules } catch(e) {
                if (e.message.indexOf('Security') < 0 && length++) return false; }
            }
            return cssDoneLoading();
          };
        })());
      }

      // Opera
      if (!allSheetsEnabled()) {
        isCssLoaded = function() { return allSheetsEnabled() && cssDoneLoading() };
        return false;
      }

      // Safari < 3
      return (isCssLoaded = function() {
        return doc.styleSheets.length >= elements.length })();
    };

    // IE
    if (Feature('EVENT_USES_ATTACH')) {
      if (global == top) {
        // doScroll() does not error when the document
        // is in an iframe. Fallback on document readyState.
        checkDomLoadedState = function() {
          try { docEl.doScroll("left") } catch(e) { return }
          fireDomLoadedEvent();
        };
      }
      cssDoneLoading(); // skip checking css load state
      respondToReadyState = checkDomLoadedState;
    }

    // worst case fallbacks... 
    timer = global.setInterval(checkDomLoadedState, 10);
    Event.observe(global, "load", fireDomLoadedEvent);

    // remove timer if other options are available
    $w('DOMContentLoaded readystatechange')._each(function(eventName) {
      doc.observe(eventName, respondToReadyState);
    });
  })();

    // define body variable
  doc.observe('dom:loaded', function() { body = Element.extend(doc.body) });
