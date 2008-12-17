  /*---------------------------- EVENT: DOM-LOADED ----------------------------*/

  // Support for the "dom:loaded" event is based on work by Dan Webb, 
  // Matthias Miller, Dean Edwards, John Resig and Diego Perini.
  (function() {
    var pollerID, sheetLength, sheetElements = [];

    function createPoller(method) {
      var callback = function() {
        if (!method()) pollerID = callback.defer();
      };
      clearPoller();
      return pollerID = callback.defer();
    }

    function clearPoller() {
      pollerID && global.clearTimeout(pollerID);
    }

    function cssDoneLoading() {
      sheetElements = null;
      return (isCssLoaded = function() { return true })();
    }

    function fireDomLoadedEvent() {
      clearPoller();
      if (doc.loaded) return;
      doc.loaded = true;
      return doc.fire('dom:loaded');
    }

    function checkCssAndFire() {
      return !!(isCssLoaded() && fireDomLoadedEvent());
    }

    var checkDomLoadedState = function(event) {
      if (event && event.type === 'DOMContentLoaded' ||
          /loaded|complete/.test(doc.readyState)) {
        doc.stopObserving('readystatechange', respondToReadyState);
        if (!checkCssAndFire()) createPoller(checkCssAndFire);
      }
    };

    var respondToReadyState = function(event) {
      clearPoller();
      checkDomLoadedState(event);
    };

   /*--------------------------------------------------------------------------*/

   var HAS_IMPORTS_COLLECTION,
    cache = { },
    prop = { 'cssRules':'cssRules', 'ownerNode':'ownerNode', 'sheet':'sheet' };

   // stylesheet property tests
   (function() {
      var styleElement = doc.createElement('style');
      docEl.insertBefore(styleElement, docEl.firstChild);

      // translate "sheet"
      if (isHostObject(styleElement, 'styleSheet'))
        prop.sheet = 'styleSheet';

      var styleSheet = styleElement[prop.sheet];
      if (styleSheet) {
        HAS_IMPORTS_COLLECTION = isHostObject(styleSheet, 'imports');

        // translate "ownerNode"
        if (isHostObject(styleSheet, 'owningElement'))
          prop.ownerNode = 'owningElement';

        // translate "rules"
        if (isHostObject(styleSheet, 'rules'))
          prop.cssRules = 'rules';
      }
      
      docEl.removeChild(styleElement);
      styleElement = styleSheet = null;
    })();

    // allSheetsEnabled() will cache its current position in the style elements
    // and css rules so that the next time its called it will resume where
    // it left off and not re-iterate over already tested elements/rules.
    function allSheetsEnabled() {
      // Safari 2 will bail on each loop because "sheet" is always null
      cache.sheetIndex = cache.sheetIndex || sheetLength;

      elementloop: while (cache.sheetIndex--) {
        cache.styleSheet = cache.styleSheet || sheetElements[cache.sheetIndex][prop.sheet];
        cache.itemList   = getItemList();
        cache.indexList  = cache.indexList  || [cache.itemList.length];

        // sheets that are not loaded will not have rules,
        // so we always refresh the last ruleIndexes if it is 0
        if (!cache.indexList.last())
          cache.indexList.splice(-1, 1, cache.itemList.length);

        sheetloop: while (cache.styleSheet) {
          // if sheet is disabled, but not the element attribute,
          // then increment sheetIndex so the next time allSheetsEnabled()
          // is called it will begin at the same element.
          if (cache.styleSheet.disabled && (!cache.styleSheet[prop.ownerNode] ||
              cache.styleSheet[prop.ownerNode].disabled) && ++cache.sheetIndex) {
            return false;
          }

          // each iteration decrements the last index in the stack
          itemloop: while (cache.indexList[cache.indexList.length - 1]--) {
            var result = checkImports();
            if (result === true)  continue sheetloop;
            if (result === false) continue itemloop;
          }

          // walk back down the stack
          cache.styleSheet = cache.styleSheet.parentStyleSheet;
          cache.indexList.pop();
        }

        // clear cached variables and exit sheetloop
        cache = { };
      }
      return true;
    }

    function getCssRules(styleSheet) {
      try { return styleSheet[prop.cssRules] }
      catch(e) { return [] }
    }

    var getItemList = (function() {
      return HAS_IMPORTS_COLLECTION
        ? function() { return cache.itemList || cache.styleSheet.imports }
        : function() { return cache.itemList || getCssRules(cache.styleSheet) };
    })();

    var checkImports = (function() {
      return HAS_IMPORTS_COLLECTION ?
        function() {
          cache.styleSheet = cache.styleSheet.imports[cache.indexList.last()][sheet];
          cache.itemList   = cache.styleSheet.imports;
          cache.indexList.push(cache.itemList.length);
          return true;
        } :
        function() {
          // skip if not an @import rule
          var rule = cache.itemList[cache.indexList.last()];
          if (!rule.styleSheet) return false;

          // update cache and add new rules length to the stack
          cache.styleSheet = rule.styleSheet;
          cache.itemList   = getCssRules(cache.styleSheet);
          cache.indexList.push(cache.itemList.length);
          return true;
        };
    })();

    var isCssLoaded = function() {
      // one time call to collect the style elements
      sheetElements = $$('style,link[rel="stylesheet"]');
      sheetLength   = sheetElements.length;

      // if no sheet elements, then always return true
      if (!sheetLength) return cssDoneLoading();

      // Firefox > 2
      try {
        // Safari 2 has the "sheet" property but it's always null 
        var sheet = sheetElements[0][prop.sheet];
        sheet && sheet.cssRules;
      } catch(e) {
        isCssLoaded = function() {
          // Firefox will throw an error if you try to
          // access the cssRules when the stylesheet isn't loaded
          while (sheetLength--) {
            try { sheetElements[sheetLength][prop.sheet][prop.cssRules] } catch(e) {
              if (e.message.indexOf('Security') < 0 && sheetLength++) return false;
            }
          }
          return cssDoneLoading();
        };

        return false;
      }
      // Opera
      if (!allSheetsEnabled()) {
        isCssLoaded = function () { return allSheetsEnabled() && cssDoneLoading() };
        return false;
      }
      // Default and Safari < 3
      if (Feature('DOCUMENT_STYLE_SHEETS_COLLECTION')) {
        return (isCssLoaded = function() {
          return doc.styleSheets.length >= sheetLength })();
      }
      // skip css check as fallback
      return cssDoneLoading();
    };

   /*--------------------------------------------------------------------------*/

    // IE
    // Ensure the document is not in a frame because
    // doScroll() will not throw an error when the document
    // is framed. Fallback on document readyState.
    if (!Feature('ELEMENT_ADD_EVENT_LISTENER') &&
        Feature('ELEMENT_DO_SCROLL') && global == global.top) {
      checkDomLoadedState = function() {
        try { docEl.doScroll('left') } catch(e) { return }
        fireDomLoadedEvent();
      };
    }

    // worst case fallbacks... 
    createPoller(checkDomLoadedState);
    Event.observe(global, 'load', fireDomLoadedEvent);

    // remove poller if other options are available
    $w('DOMContentLoaded readystatechange')._each(function(eventName) {
      doc.observe(eventName, respondToReadyState);
    });
  })();

  /*--------------------------------------------------------------------------*/

  // define private body and root variables
  doc.observe('dom:loaded', function() {
    body = Element.extend(doc.body);
    root = Bug('BODY_ACTING_AS_ROOT') ? body : docEl;
  });
