  /*--------------------------- EVENT: DOM-LOADED ----------------------------*/

  // Support for the "dom:loaded" event is based on work by Dan Webb,
  // Matthias Miller, Dean Edwards, John Resig and Diego Perini.
  (function() {
    function Poller(method) {
      function callback() {
        if (!method() && poller.id != null)
          poller.id = setTimeout(callback, 10);
      }

      var poller = this,
       setTimeout = global.setTimeout;
      this.id = setTimeout(callback, 10);
    }

    Poller.prototype.clear = function() {
      this.id != null && (this.id = global.clearTimeout(this.id));
    };

    function cssDoneLoading() {
      return (isCssLoaded = function() { return true; })();
    }

    function fireDomLoadedEvent() {
      readyStatePoller.clear();
      cssPoller && cssPoller.clear();

      if (docObj.loaded) return;
      return docObj.fire('dom:loaded');
    }

    function checkCssAndFire() {
      if (docObj.loaded) return fireDomLoadedEvent();
      return !!(isCssLoaded() && fireDomLoadedEvent());
    }

    function getSheetElements() {
      var i = 0, link, links = docNode.getElementsByTagName('LINK'),
       results = Fuse.List.fromNodeList(docNode.getElementsByTagName('STYLE'));
      while (link = links[i++])
        if (link.rel.toLowerCase() === 'stylesheet')
          results.push(link);
      return results;
    }

    function getSheetObjects(elements) {
      for (var i = 0, results = [], element, sheet; element = elements[i++]; ) {
        sheet = getSheet(element);
        // bail when sheet is null/undefined on elements
        if (sheet == null) return false;
        if (isSameOrigin(sheet.href)) {
          results.push(sheet);
          if (!addImports(results, sheet))
            return false;
        }
      }
      return results;
    }

    var cssPoller, readyStatePoller,

    docNode = Fuse._doc,

    docObj = Fuse.get(docNode),

    checkDomLoadedState = function(event) {
      // Not sure if readyState is ever `loaded` in Safari 2.x but
      // we check to be on the safe side
      if (docObj.loaded) readyStatePoller.clear();
      else if (event && event.type === 'DOMContentLoaded' ||
          /^(loaded|complete)$/.test(docNode.readyState)) {
        readyStatePoller.clear();
        docObj.stopObserving('readystatechange', checkDomLoadedState);
        if (!checkCssAndFire()) cssPoller = new Poller(checkCssAndFire);
      }
    },

    addImports = function(collection, sheet) {
      return (addImports = isHostObject(sheet, 'imports')
        ? function(collection, sheet) {
            var length = sheet.imports.length;
            while (length--) {
              if (isSameOrigin(sheet.imports[length].href)) {
                collection.push(sheet.imports[length]);
                addImports(collection, sheet.imports[length]);
              }
            }
            return collection;
          }
        : function(collection, sheet) {
            // Catch errors on partially loaded elements. Firefox may also
            // error when accessing css rules of sources using the file:// protocol
            try {
              var ss, rules = getRules(sheet), length = rules.length;
            } catch(e) {
              return false;
            }
            while (length--) {
              // bail when sheet is null on rules
              ss = rules[length].styleSheet;
              if (ss === null) return false;
              if (ss && isSameOrigin(ss.href)) {
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
      return (getStyle = Feature('ELEMENT_COMPUTED_STYLE')
        ? function(element, styleName) {
            var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
            return (style || element.style)[styleName];
          }
        : function(element, styleName) {
            return (element.currentStyle || element.style)[styleName];
          }
      )(element, styleName);
    },

    getSheet = function(element) {
      return (getSheet = isHostObject(element, 'styleSheet')
        ? function(element) { return element.styleSheet; }
        : function(element) { return element.sheet; }
      )(element);
    },

    getRules = function(sheet) {
      return (getRules = isHostObject(sheet, 'rules')
        ? function(sheet) { return sheet.rules; }
        : function(sheet) { return sheet.cssRules; }
      )(sheet);
    },

    addRule = function(sheet, selector, cssText) {
      return (addRule = isHostObject(sheet, 'addRule')
        ? function(sheet, selector, cssText) { return sheet.addRule(selector, cssText); }
        : function(sheet, selector, cssText) { return sheet.insertRule(selector +
            '{' + cssText + '}', getRules(sheet).length); }
      )(sheet, selector, cssText);
    },

    removeRule = function(sheet, index) {
      return (removeRule = isHostObject(sheet, 'removeRule')
        ? function(sheet, index) { return sheet.removeRule(index); }
        : function(sheet, index) { return sheet.deleteRule(index); }
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
                    if (rules[lastIndex].selectorText.indexOf(c.className) > -1) {
                      done = false;

                      // if the styleSheet has only the test rule then skip
                      if (rules.length === 1) continue;

                      if (!c.div) {
                        c.div = docNode.createElement('div');
                        c.div.className = c.className;
                        c.div.style.cssText = 'position:absolute;visibility:hidden;';
                      }

                      docNode.body.appendChild(c.div);

                      // when loaded clear cache entry
                      if (getStyle(c.div, 'marginTop') === '-1234px')
                        cache.splice(length, 1);

                      // cleanup
                      removeRule(c.sheet, lastIndex);
                      docNode.body.removeChild(c.div);
                    }
                  }

                  if (done) {
                    cache = nil;
                    return cssDoneLoading();
                  }
                  return done;
                })();
          })();
    };

    /*------------------------------------------------------------------------*/

    // Ensure the document is not in a frame because
    // doScroll() will not throw an error when the document
    // is framed. Fallback on document readyState.
    if (!Feature('ELEMENT_ADD_EVENT_LISTENER') && Feature('ELEMENT_DO_SCROLL')) {

      // Avoid a potential browser hang when checking global.top (thanks Rich Dougherty)
      // Checking global.frameElement could throw if not accessible.
      var isFramed = true;
      try { isFramed = global.frameElement != null; } catch(e) { }

      // Derived with permission from Diego Perini's IEContentLoaded
      // http://javascript.nwbox.com/IEContentLoaded/
      if (!isFramed)
        checkDomLoadedState = function() {
          if (docObj.loaded) readyStatePoller.clear();
          else {
            if (docNode.readyState === 'complete')
              fireDomLoadedEvent();
            else {
              try { Fuse._div.doScroll(); } catch(e) { return; }
              fireDomLoadedEvent();
            }
          }
        };
    }
    else if (Feature('ELEMENT_ADD_EVENT_LISTENER'))
      docObj.observe('DOMContentLoaded', checkDomLoadedState);

    // readystate and poller are used (first one to complete wins)
    docObj.observe('readystatechange', checkDomLoadedState);
    readyStatePoller = new Poller(checkDomLoadedState);
  })();
