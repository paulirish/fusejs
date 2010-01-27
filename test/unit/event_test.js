new Test.Unit.Runner({

  // test firing an event and observing it on the element it's fired from
  'testCustomEventFiring': function() {
    var span = $('span'), fired = false;

    var observer = fuse.Function.bind(function(event) {
      this.assertEqual(span, event.element());
      this.assertEqual(1, event.memo.index);
      fired = true;
    }, this);

    span.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened', { 'index': 1 });
    this.assert(fired);

    fired = false;
    span.fire('test:somethingElseHappened');
    this.assert(!fired);

    span.stopObserving('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(!fired);
  },

  // test firing an event and observing it on a containing element
  'testCustomEventBubbling': function() {
    var span = $('span'), outer = $('outer'), fired = false;
    var observer = fuse.Function.bind(function(event) {
      this.assertEqual(span, event.element());
      fired = true;
    }, this);

    outer.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(fired);

    fired = false;
    span.fire('test:somethingElseHappened');
    this.assert(!fired);

    outer.stopObserving('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(!fired);
  },

  'testCustomEventCanceling': function() {
    function outerObserver(event) {
      fired = span == event.element();
    }

    function innerObserver(event) {
      event.stop();
      stopped = true;
    }

    var span = $('span'), outer = $('outer'), inner = $('inner');
    var fired = false, stopped = false;

    inner.observe('test:somethingHappened', innerObserver);
    outer.observe('test:somethingHappened', outerObserver);
    span.fire('test:somethingHappened');

    this.assert(stopped);
    this.assert(!fired);

    fired = stopped = false;
    inner.stopObserving('test:somethingHappened', innerObserver);
    span.fire('test:somethingHappened');

    this.assert(!stopped);
    this.assert(fired);

    outer.stopObserving('test:somethingHappened', outerObserver);
  },

  'testEventAddMethods': function() {
    Event.addMethods({ 'hashBrowns': function() { return 'hash browns' } });
    var event = $('span').fire('test:somethingHappened');
    this.assertRespondsTo('hashBrowns', event);

    // only test `toString` addition if events don't have it
    if (!Event.prototype || !fuse.Object.hasKey(Event.prototype, 'toString')) {

      Event.addMethods({ 'toString': function() { return '[Fuse Event]' } });
      event = $('span').fire('test:somethingHappened');

      this.assertEqual('[Fuse Event]', event.toString(),
        'Failed to extend element with a toString method.');

      // remove toString addition
      if (fuse.env.Feature('ELEMENT_SPECIFIC_EXTENSIONS'))
        delete Event.prototype.toString;
      delete Event.Methods.toString;
      Event.addMethods();
    }
  },

  'testEventObjectIsExtended': function() {
    var span = $('span'), event, observedEvent,
     observer = function(e) { observedEvent = e };

    span.observe('test:somethingHappened', observer);
    event = span.fire('test:somethingHappened');

    this.assertRespondsTo('stop', event, 'Failed to extend event object.');
    span.stopObserving('test:somethingHappened', observer);

    event = span.fire('test:somethingHappenedButNoOneIsListening');
    this.assertRespondsTo('stop', event, 'Failed to extend event with no observers');
  },

  'testEventObserversAreBoundToTheObservedElement': function() {
    var target, 
     span = $('span'),
     observer = function() { target = this };

    span.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    span.stopObserving('test:somethingHappened', observer);

    this.assertEqual(span, target);
    target = null;

    var outer = $('outer');
    outer.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    outer.stopObserving('test:somethingHappened', observer);

    this.assertEqual(outer, target);
  },

  'testMultipleCustomEventObserversWithTheSameHandler': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.fire('test:somethingHappened');

    this.assertEqual(1, count);
    span.fire('test:somethingElseHappened');

    this.assertEqual(2, count);
    span.stopObserving('test:somethingHappened', observer);
    span.stopObserving('test:somethingElseHappened', observer);
  },

  'testStopObservingWithoutArguments': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.stopObserving();
    span.fire('test:somethingHappened');

    this.assertEqual(0, count);

    span.fire('test:somethingElseHappened');
    this.assertEqual(0, count);

    this.assertEqual(window, Event.stopObserving(window));

    // test element with no observers
    this.assertNothingRaised(function() { $(document.body).stopObserving() });
  },

  'testStopObservingWithNoneStringEventName': function() {
    this.assertNothingRaised(function() {
      fuse.Array($('span'), $('outer')).each(Event.stopObserving);
    });
  },

  'testStopObservingWithoutHandlerArgument': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.stopObserving('test:somethingHappened');
    span.fire('test:somethingHappened');

    this.assertEqual(0, count);
    span.fire('test:somethingElseHappened');

    this.assertEqual(1, count);
    span.stopObserving('test:somethingElseHappened');
    span.fire('test:somethingElseHappened');

    this.assertEqual(1, count);

    // test element with no observers
    this.assertNothingRaised(
      function() { $(document.body).stopObserving('test:somethingHappened') });
  },

  'testStopObservingRemovesHandlerFromCache': function() {
    var data, events, fuseId,
     span = $('span'), observer = function() { };

    span.observe('test:somethingHappened', observer);

    fuseId = span.getFuseId();
    data   = fuse.dom.Data[fuseId];
    events = data.events;

    this.assert(data);
    this.assert(fuse.Array.isArray(events['test:somethingHappened'].handlers));

    this.assertEqual(1, events['test:somethingHappened'].handlers.length);

    span.stopObserving('test:somethingHappened', observer);
    this.assert(!events['test:somethingHappened']);
  },

  'testObserveAndStopObservingAreChainable': function() {
    var span = $('span'), observer = function() { };

    try {
    this.assertEqual(span, span.observe('test:somethingHappened', observer));
    }
    catch (e) { console.log(e) }
    this.assertEqual(span, span.stopObserving('test:somethingHappened', observer));

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.stopObserving('test:somethingHappened'));

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.stopObserving());
    this.assertEqual(span, span.stopObserving()); // assert it again, after there are no observers

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.observe('test:somethingHappened', observer)); // try to reuse the same observer
    span.stopObserving();
  },

  'testObserveInsideHandlers': function() {
    var fired = false, observer = function(event) { fired = true };

    // first observer should execute and attach a new observer
    // the added observer should not be executed this time around.
    $(document).observe('test:somethingHappened', function() {
      $(document).observe('test:somethingHappened', observer);
    });

    // if there is a bug then this observer will be skipped
    $(document).observe('test:somethingHappened', fuse.emptyFunction);

    $(document).fire('test:somethingHappened');
    this.assert(!fired, 'observer should NOT have fired');

    $(document).fire('test:somethingHappened');
    this.assert(fired, 'observer should have fired');
    $(document).stopObserving('test:somethingHappened');
  },

  'testStopObservingInsideHandlers': function() {
    var fired = false, observer = function(event) { fired = true };

    // first observer should execute and stopObserving should not
    // effect this round of execution.
    $(document).observe('test:somethingHappened', function() {
      $(document).stopObserving('test:somethingHappened', observer);
    }).observe('test:somethingHappened', observer);

    // Gecko and WebKit will fail this test at the moment (1.02.09)
    $(document).fire('test:somethingHappened');

    this.assert(fired, 'observer should NOT have been stopped');

    fired = false;
    $(document).fire('test:somethingHappened');
    $(document).stopObserving('test:somethingHappened');

    this.assert(!fired, 'observer should have been stopped');
  },

  'testDocumentLoaded': function() {
    this.assert(!documentLoaded);
    this.assert($(document).loaded);
  },

  'testCssLoadedBeforeDocumentContentLoadedFires': function() {
    this.assert(eventResults.contentLoaded.cssLoadCheck);
  },

  'testDocumentContentLoadedEventFiresBeforeWindowLoad': function() {
    this.assert(eventResults.contentLoaded, 'contentLoaded');
    this.assert(eventResults.contentLoaded.endOfDocument,
      'contentLoaded.endOfDocument');

    this.assert(eventResults.windowLoad, 'windowLoad');
    this.assert(eventResults.windowLoad.endOfDocument,
      'windowLoad.endOfDocument');
    this.assert(eventResults.windowLoad.contentLoaded,
      'windowLoad.contentLoaded');

    this.assert(!eventResults.contentLoaded.windowLoad,
      '!contentLoaded.windowLoad');
  },

  'testEventStopped': function() {
    var span = $('span'), event;

    span.observe('test:somethingHappened', function() { });
    event = span.fire('test:somethingHappened');

    this.assert(!event.stopped,
      'event.stopped should be false with an empty observer');

    span.stopObserving('test:somethingHappened');
    span.observe('test:somethingHappened', function(e) { e.stop() });
    event = span.fire('test:somethingHappened');

    this.assert(event.stopped,
      'event.stopped should be true for an observer that calls stop');

    span.stopObserving('test:somethingHappened');
  },

  'testEventElement': function() {
    this.assert(eventResults.windowLoad.eventElement,
      'window `onload` event.element() should not be null. (some WebKit versions may return null)');

    this.assert(eventResults.contentLoaded.eventElement,
      'document `dom:loaded` event.element() should not be null. (some WebKit versions may return null)');

    //this.assertIdentical(window, eventResults.windowLoad.eventElement,
      //'window `onload` event.element() should be `window`');

    // This bug would occur in IE on any windows event because it
    // doesn't have a event.srcElement.
    this.assertEqual(false, eventResults.eventElement.windowOnLoadBug,
      'Event.element() window onload bug.');

    // This bug would occur in Firefox on window an document events because the
    // event.currentTarget does not have a tagName.
    this.assertEqual(false, eventResults.eventElement.contentLoadedBug,
      'Event.element() contentLoaded bug.');

    // This bug would occur in Firefox on image onload/onerror event
    // because the event.target is wrong and should use event.currentTarget.
    this.assertEqual(false, eventResults.eventElement.imageOnErrorBug,
      'Event.element() image onerror bug.');

    this.wait(1000, function() {
      this.assertEqual(false, eventResults.eventElement.imageOnLoadBug,
        'Event.element() image onload bug.');
    });
  },

  'testEventCurrentTarget': function() {
    this.assert(eventResults.windowLoad.eventCurrentTarget,
      'window `onload` event.currentTarget should not be null. (some WebKit versions may return null)');

    this.assert(eventResults.contentLoaded.eventCurrentTarget,
      'document `dom:loaded` event.currentTarget should not be null. (some WebKit versions may return null)');

    //this.assertIdentical(window, eventResults.windowLoad.eventCurrentTarget,
      //'window `onload` event.currentTarget should be `window`');
  },

  'testEventTarget': function() {
    this.assert(eventResults.windowLoad.eventTarget,
      'window `onload` event.target should not be null. (some WebKit versions may return null)');

    this.assert(eventResults.contentLoaded.eventTarget,
      'document `dom:loaded` event.target should not be null. (some WebKit versions may return null)');

    //this.assertIdentical(window, eventResults.windowLoad.eventTarget,
      //'window `onload` event.target should be `window`');
  },

  'testEventFindElement': function() {
    var event, span = $('span');
    event = span.fire('test:somethingHappened');

    this.assertElementMatches(event.findElement(),
      'span#span');

    this.assertElementMatches(event.findElement('span'),
      'span#span');

    this.assertElementMatches(event.findElement('p'),
      'p#inner');

    this.assertElementMatches(event.findElement('.does_not_exist, span'),
      'span#span');

    this.assertEqual(null, event.findElement('div.does_not_exist'));
  },

  'testFuseIdDuplication': function() {
    var element = $('container').down();
    element.observe('test:somethingHappened', fuse.emptyFunction);

    var fuseId = element.getFuseId(),
     clone = $(element.raw.cloneNode(true));
     cloneId = clone.getFuseId();

    this.assertNotEqual(fuseId, cloneId);

    $('container').raw.innerHTML += $('container').raw.innerHTML;

    this.assertNotEqual(fuseId, $('container').down());
    this.assertNotEqual(fuseId, $('container').down(1));
  },

  'testDocumentAndWindowFuseId': function() {
    fuse.Array(document, window).each(function(object) {
      Event.observe(object, 'test:somethingHappened', fuse.emptyFunction);

      this.assertUndefined(object.getFuseId);

      Event.stopObserving(object, 'test:somethingHappened');
    }, this);
  },

  'testObserverExecutionOrder': function() {
    var span = $('span'), result = '';
    fuse.Array('a', 'b', 'c', 'd').each(function(n) {
      span.observe('test:somethingHappened', function() { result += n })
    });

    span.fire('test:somethingHappened');
    span.stopObserving('test:somethingHappened');

    this.assertEqual('abcd', result);
  }
});