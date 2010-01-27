var documentLoaded = $(document).loaded;

/*--------------------------------------------------------------------------*/

$(document).observe('dom:loaded', function(event) {
  var body = $(document.body);

  eventResults.contentLoaded = {
    'endOfDocument':      eventResults.endOfDocument,
    'windowLoad':         eventResults.windowLoad,
    'cssLoadCheck':       $('css_load_check').getStyle('height') == '100px',
    'eventTarget':        event.target,
    'eventCurrentTarget': event.currentTarget,
    'eventElement':       false
  };

  fuse.Object.extend(eventResults.eventElement, {
    'imageOnLoadBug':   false,
    'imageOnErrorBug':  false,
    'contentLoadedBug': false
  });

  body.insert('<img id="img_load_test">');

  $('img_load_test').observe('load', function(e) {
    if (e.element() !== this)
      eventResults.eventElement.imageOnLoadBug = true;
  }).setAttribute('src', '../fixtures/logo.gif');

  body.insert('<img id="img_error_test">');

  $('img_error_test').observe('error', function(e) {
    if (e.element() !== this)
      eventResults.eventElement.imageOnErrorBug = true;
  }).setAttribute('src', 'http://www.fusejs.com/xyz.gif');

  try {
    eventResults.contentLoaded.eventElement = event.element();
  } catch(e) {
    eventResults.eventElement.contentLoadedBug = true;
  }
});

/*--------------------------------------------------------------------------*/

Event.observe(window, 'load', function(event) {
  eventResults.windowLoad = {
    'endOfDocument':      eventResults.endOfDocument,
    'contentLoaded':      eventResults.contentLoaded,
    'eventCurrentTarget': event.currentTarget,
    'eventTarget':        event.target,
    'eventElement':       false
  };

  try {
    eventResults.windowLoad.eventElement = event.element();
    eventResults.eventElement.windowOnLoadBug = false;
  } catch(e) {
    eventResults.eventElement.windowOnLoadBug = true;
  }
});