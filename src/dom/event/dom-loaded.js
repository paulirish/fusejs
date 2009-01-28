  /*---------------------------- EVENT: DOM-LOADED ----------------------------*/

  // Support for the "dom:loaded" event is based on work by Dan Webb, 
  // Matthias Miller, Dean Edwards, John Resig and Diego Perini.
  (function() {
    function createPoller(method) {
      var callback = function() {
        if (!method()) pollerID = callback.defer();
      };
      clearPoller();
      return pollerID = callback.defer();
    }

    function clearPoller() {
      pollerID != null && global.clearTimeout(pollerID);
    }

    function cssDoneLoading() {
      return (isCssLoaded = function() { return true })();
    }

    function fireDomLoadedEvent() {
      clearPoller();
      if (doc.loaded) return;
      return Event.fire(doc, 'dom:loaded');
    }

    function checkCssAndFire() {
      return !!(isCssLoaded() && fireDomLoadedEvent());
    }

    function getSheetElements() {
      var i = 0, link, links = doc.getElementsByTagName('LINK'),
       results = nodeListSlice(doc.getElementsByTagName('STYLE'));
      while (link = links[i++]) results.push(link);
      return results;
    }
    
    function getSheetObjects(elements) {
      for (var i = 0, results = [], element, sheet; element = elements[i++]; ) {
        sheet = getSheet(element);
        // bail when sheet is null/undefined on elements
        if (sheet == null) return false;
        if (isSheetAccessible(sheet)) {
          results.push(sheet);
          if (!addImports(results, sheet))
            return false;
        }
      }
      return results;
    }
    
    function isSheetAccessible(sheet) {
      try { return !!getRules(sheet) } catch(e) {
        return !/(security|denied)/i.test(e.message);
      }
    }

    var pollerID,

    checkDomLoadedState = function(event) {
      if (doc.loaded) clearPoller();
      else if (event && event.type === 'DOMContentLoaded' ||
          /loaded|complete/.test(doc.readyState)) {
        doc.stopObserving('readystatechange', respondToReadyState);
        if (!checkCssAndFire()) createPoller(checkCssAndFire);
      }
    },

    respondToReadyState = function(event) {
      clearPoller();
      checkDomLoadedState(event);
    },

    addImports = function(collection, sheet) {
      return (addImports = isHostObject(sheet, 'imports')
        ? function(collection, sheet) {
            var length = sheet.imports.length;
            while (length--) {
              if (isSheetAccessible(sheet.imports[length])) {
                collection.push(sheet.imports[length]);
                addImports(collection, sheet.imports[length])
              }
            }
            return collection;
          }
        : function(collection, sheet) {
            var ss, rules = getRules(sheet), length = rules.length;
            while (length--) {
              ss = rules[length].styleSheet;
              // bail when sheet is null on rules
              if (ss === null) return false;
              if (ss && isSheetAccessible(ss)) {
                collection.push(ss);
                if (!addImports(collection, ss))
                  return false;
              }
            }
            return collection;
          }
      )(collection, sheet);
    },

    getStyle = function(element, styleName) {
      return (getStyle = Feature('ELEMENT_CURRENT_STYLE')
        ? function(element, styleName) { return element.currentStyle[styleName] }
        : function(element, styleName) { return element.ownerDocument.defaultView
            .getComputedStyle(element, null)[styleName] }
      )(element, styleName);
    },

    getSheet = function(element) {
      return (getSheet = isHostObject(element, 'styleSheet')
        ? function(element) { return element.styleSheet }
        : function(element) { return element.sheet }
      )(element);
    },

    getRules = function(sheet) {
      return (getRules = isHostObject(sheet, 'rules')
        ? function(sheet) { return sheet.rules }
        : function(sheet) { return sheet.cssRules }
      )(sheet);
    },

    addRule = function(sheet, selector, cssText) {
      return (addRule = isHostObject(sheet, 'addRule')
        ? function(sheet, selector, cssText) { return sheet.addRule(selector, cssText) }
        : function(sheet, selector, cssText) { return sheet.insertRule(selector +
            '{' + cssText + '}', getRules(sheet).length) }
      )(sheet, selector, cssText);
    },

    removeRule = function(sheet, index) {
      return (removeRule = isHostObject(sheet, 'removeRule')
        ? function(sheet, index) { return sheet.removeRule(index) }
        : function(sheet, index) { return sheet.deleteRule(index) }
      )(sheet, index);
    },

    isCssLoaded = function() {
      var sheetElements = getSheetElements();
      return !sheetElements.length
        ? cssDoneLoading()
        : (isCssLoaded = function() {
            var cache = [];
            return !(function() {
              var sheets = getSheetObjects(sheetElements);
              if (!sheets) return false;

              var className, length = sheets.length;
              while (length--) {
                className = 'fuse_css_loaded_' + cache.length;
                cache.push({ 'className': className, 'sheet': sheets[length] });
                addRule(sheets[length], '.' + className, 'margin-top: -1234px!important;');
              }
              return true;
            })()
              ? false
              : (isCssLoaded = function() {
                  var c, lastIndex, rules, length = cache.length, done = true;
                  while (length--) {
                    c = cache[length];
                    rules = getRules(c.sheet);
                    lastIndex = rules.length && rules.length - 1;

                    // if styleSheet was still loading when test rule
                    // was added it will have removed the rule.
                    if (rules[lastIndex].cssText.indexOf(c.className) > -1) {
                      done = false;

                      // if the styleSheet has only the test rule then skip
                      if (rules.length === 1) continue;

                      if (!c.div) {
                        c.div = doc.createElement('div');
                        c.div.className = c.className;
                        c.div.style.cssText = 'position:absolute;visibility:hidden;';
                      }

                      doc.body.appendChild(c.div);

                      // when loaded clear cache entry
                      if (getStyle(c.div, 'marginTop') === '-1234px')
                        cache.splice(length, 1);

                      // cleanup
                      removeRule(c.sheet, lastIndex);
                      doc.body.removeChild(c.div);
                    }
                  }

                  if (done) {
                    cache = null;
                    return cssDoneLoading();
                  }
                  return done;
                })();
          })();
    };

    /*--------------------------------------------------------------------------*/

    // Ensure the document is not in a frame because
    // doScroll() will not throw an error when the document
    // is framed. Fallback on document readyState.
    if (!Feature('ELEMENT_ADD_EVENT_LISTENER') &&
        Feature('ELEMENT_DO_SCROLL') && global == global.top) {
      // Diego Perini's IEContentLoaded
      // http://javascript.nwbox.com/IEContentLoaded/
      checkDomLoadedState = function() {
        try { docEl.doScroll('left') } catch(e) { return }
        fireDomLoadedEvent();
      };
    }
    else if (Feature('ELEMENT_ADD_EVENT_LISTENER'))
      doc.observe('DOMContentLoaded', respondToReadyState);

    // remove poller if other options are available
    doc.observe('readystatechange', respondToReadyState);

    // stop poller onunload because it may reference cleared variables
    Event.observe(global, 'unload', clearPoller);

    // worst case create poller and window onload observer
    createPoller(checkDomLoadedState);
  })();
