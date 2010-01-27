new Test.Unit.Runner({

  'setup': function() {
    $('content').update('');
    $('content2').update('');
  },

  'teardown': function() {
    // hack to cleanup responders
    fuse.ajax.Responders.responders = {
      'onCreate': fuse.Array(function() { fuse.ajax.activeRequestCount++ }),
      'onDone':   fuse.Array(function() { fuse.ajax.activeRequestCount-- })
    };
  },

  'testBaseDefaultOptions': function() {
    var backup = fuse.Object.clone(fuse.ajax.Base.options);
    fuse.Object.extend(fuse.ajax.Base.options,  {
      'method': 'get',
      'evalJS': 'force',
      'asynchronous': false
    });

    fuse.ajax.Request('../fixtures/hello.js');
    var h2 = $('content').firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));

    // restore
    fuse.ajax.Base.options = backup;
  },

  'testSynchronousRequest': function() {
    fuse.ajax.Request('../fixtures/hello.js', {
      'asynchronous': false,
      'method':      'GET',
      'evalJS':      'force'
    });

    this.assertEqual(0, fuse.ajax.activeRequestCount);

    var h2 = $('content').firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));
  },

  'testAsynchronousRequest': function() {
    fuse.ajax.Request('../fixtures/hello.js', {
      'asynchronous': true,
      'method':      'get',
      'evalJS':      'force'
    });

    this.wait(1000, function() {
      var h2 = $('content').firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    });
  },

  'testRequestAbort': function() {
    var abortedFlag, fired = { };

    fuse.ajax.Responders.register({
      'onFailure': function() { fired.failureResponder = true },
      'onSuccess': function() { fired.successResponder = true },
      'onAbort':   function() { fired.abortResponder   = true }
    });

    var request = fuse.ajax.Request('../fixtures/hello.js', {
      'method':    'get',
      'evalJS':    'force',
      'onAbort':   function() { fired.abort   = true },
      'onFailure': function() { fired.failure = true },
      'onSuccess': function() { fired.success = true },
      'onDone':    function(request) { abortedFlag = request.aborted }
    });

    request.abort();

    this.assert(fired.abort,
      'onAbort request event failed to fire');

    this.assert(!fired.failure,
      'onFailure request event should not fire');

    this.assert(!fired.success,
      'onSuccess request should not fire');

    this.assert(fired.abortResponder,
      'onAbort responder event failed to fire');

    this.assert(!fired.failureResponder,
      'onFailure responder event should not fire');

    this.assert(!fired.successResponder,
      'onSuccess responder should not fire');

    this.assert(abortedFlag,
      'failed to set request.aborted flag');
  },

  'testRequestTimeout': function() {
    var timedoutFlag, fired = { };

    fuse.ajax.Responders.register({
      'onFailure': function() { fired.failureResponder = true },
      'onSuccess': function() { fired.successResponder = true },
      'onTimeout': function() { fired.timeoutResponder = true }
    });

    var request = fuse.ajax.Request('../fixtures/hello.js?delay=1', {
      'method':    'get',
      'timerMultiplier': 1,
      'timeout':   10, // ms
      'onTimeout': function() { fired.timeout = true },
      'onDone':    function(request) { timedoutFlag = request.timedout }
    });

    this.wait(50, function() {
      this.assert(fired.timeout,
        'onTimeout request event failed to fire');

      this.assert(!fired.failure,
        'onFailure request event should not fire');

      this.assert(!fired.success,
        'onSuccess request should not fire');

      this.assert(fired.timeoutResponder,
        'onTimeout responder event failed to fire');

      this.assert(!fired.failureResponder,
        'onFailure responder event should not fire');

      this.assert(!fired.successResponder,
        'onSuccess responder should not fire');

      this.assert(timedoutFlag,
        'failed to set request.timedout flag');

      // test timerMultiplier
      request.abort();
      fired.timeout = false;

      request.request('../fixtures/hello.js?delay=3', {
        'method':    'get',
        'timeout':   0.5, // seconds
        'onTimeout': function() { fired.timeout = true }
      });

      this.wait(50, function() {
        this.assert(!fired.timeout,
          'options.timerMultiplier was ignored onTimeout request event shouldn\'t have fired yet');

        this.wait(500, function() {
          this.assert(fired.timeout,
            'options.timerMultiplier was ignored onTimeout request event never fired');

          request.abort();
        });
      });
    });
  },

  'testRequestWithNoUrl': function() {
    var suceeded = false;
    fuse.ajax.Request(null, {
      'method': 'get',
      'asynchronous': false,
      'onSuccess': function() { suceeded = true; }
    });

    this.assert(suceeded);
  },

  'testUpdater': function() {
    fuse.ajax.Updater('content', '../fixtures/content.html', { 'method': 'get' });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update('');
      this.assertEqual('', getInnerHTML('content'));

      fuse.ajax.Updater({ 'success': 'content', 'failure': 'content2' },
        '../fixtures/content.html', { 'method': 'get' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        this.assertEqual('', getInnerHTML('content2'));
      });
    });
  },

  'testUpdaterWithInsertion': function() {
    fuse.ajax.Updater('content', '../fixtures/content.html', {
      'method':   'get',
      'insertion': function(element, content) {
        Element.insert(element, { 'top': content });
      }
    });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update();
      fuse.ajax.Updater('content','../fixtures/content.html',
        { 'method': 'get', 'insertion': 'bottom' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));

        $('content').update();
        fuse.ajax.Updater('content', '../fixtures/content.html',
          { 'method': 'get', 'insertion': 'after' });

        this.wait(1000, function() {
          this.assertEqual('five dozen', getInnerHTML($('content').next()));
        });
      });
    });
  },

  'testUpdaterOptions': function() {
    var options = {
      'method':       'get',
      'asynchronous': false,
      'onDone':       fuse.emptyFunction
    };

    var request = fuse.ajax.Updater('content', '../fixtures/content.html', options);
    request.options.onDone = function() { };
    this.assertIdentical(fuse.emptyFunction, options.onDone,
      'failed to clone options object');
  },

  'testResponders': function(){
    var i, count = 0,
     dummyResponder = { 'onDone': fuse.emptyFunction };

    // check for internal responder
    for (i in fuse.ajax.Responders.responders) count++;
    this.assertEqual(2, count, 'Failed default responders count');

    // ensure register() works
    fuse.ajax.Responders.register(dummyResponder);
    this.assertEqual(2, fuse.ajax.Responders.responders['onDone'].length,
      'Failed to register an `onDone` responder');

    // don't add twice
    fuse.ajax.Responders.register(dummyResponder);
    this.assertEqual(2, fuse.ajax.Responders.responders['onDone'].length,
      'Added a duplicate responder');

    // ensure unregister() works
    fuse.ajax.Responders.unregister(dummyResponder);
    this.assertEqual(1, fuse.ajax.Responders.responders['onDone'].length,
      'Failed to unregister an `onDone` responder');


    // ensure responders are called
    var responderCounter = 0,
     increaseCounter = function() { responderCounter++ };

    fuse.ajax.Responders.register({
      'onCreate':  increaseCounter,
      'onLoading': increaseCounter,
      'onSuccess': increaseCounter,
      'on200':     increaseCounter,
      'onDone':    increaseCounter
    });

    this.assertEqual(0, responderCounter,
      'Responders executed too soon');

    this.assertEqual(0, fuse.ajax.activeRequestCount,
      'There should be no active requests');

    fuse.ajax.Request('../fixtures/content.html', {
      'method':     'get',
      'parameters': 'pet=monkey',
      'on200' :      function() { }
    });

    this.assert(responderCounter > 0,
      'The `onCreate` responder failed');

    this.assertEqual(1, fuse.ajax.activeRequestCount,
      'There should be only one active request');

    this.wait(1000, function() {
      this.assertEqual(5, responderCounter,
        'Incorrect number of responders fired');

      this.assertEqual(0, fuse.ajax.activeRequestCount,
        'activeRequestCount failed clear itself');
    });
  },

  'testRespondersCanBeHash': function(){
    var hashResponder = $H({ 'onDone': fuse.emptyFunction });

    fuse.ajax.Responders.register(hashResponder);
    this.assertEqual(2, fuse.ajax.Responders.responders['onDone'].length);
    fuse.ajax.Responders.unregister(hashResponder);
  },

  'testEvalResponseShouldBeCalledBeforeOnComplete': function() {
    if (this.isRunningFromRake) {
      this.assertEqual('', getInnerHTML('content'));
      this.assertEqual(0,  fuse.ajax.activeRequestCount);

      fuse.ajax.Request('../fixtures/hello.js',
        extendDefault({
          'onDone': fuse.Function.bind(function() {
            this.assertNotEqual('', getInnerHTML('content')) }, this)
        }));

      this.assertEqual(0, fuse.ajax.activeRequestCount);

      var h2 = $('content').firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    }
    else this.info(message);
  },

  'testContentTypeSetForSimulatedVerbs': function() {
    if (this.isRunningFromRake) {
      fuse.ajax.Request('/inspect', extendDefault({
        'method':      'put',
        'contentType': 'application/bogus',
        'onDone':      fuse.Function.bind(function(request) {
          this.assertEqual('application/bogus; charset=UTF-8', request.responseJSON.headers['content-type']);
        }, this)
      }));
    }
    else this.info(message);
  },

  'testOnCreateCallback': function() {
    fuse.ajax.Request('../fixtures/content.html',
      extendDefault({
        'onCreate': fuse.Function.bind(
          function(request) { this.assertEqual(0, request.readyState) }, this),
        'onDone': fuse.Function.bind(
          function(request) { this.assertNotEqual(0, request.readyState) }, this)
    }));
  },

  'testEvalJS': function() {
    if (this.isRunningFromRake) {
      $('content').update();

      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onDone': fuse.Function.bind(function() {
            var h2 = $('content').firstChild;
            this.assertEqual('hello world!', getInnerHTML(h2));
          }, this)
      }));

      $('content').update();

      fuse.ajax.Request('/response',
        extendDefault({
          'evalJS':     false,
          'parameters': Fixtures.js,
          'onDone': fuse.Function.bind(function() {
            this.assertEqual('', getInnerHTML('content'));
          }, this)
      }));
    }
    else this.info(message);

    $('content').update();

    fuse.ajax.Request('../fixtures/hello.js',
      extendDefault({
        'evalJS':     'force',
        'onDone': fuse.Function.bind(function() {
          var h2 = $('content').firstChild;
          this.assertEqual('hello world!', getInnerHTML(h2));
        }, this)
    }));
  },

  'testCallbacks': function() {
    var options = extendDefault({
      'onCreate': fuse.Function.bind(
        function(request) { this.assertInstanceOf(fuse.ajax.Request, request,
          'request object is not passed to callbacks') }, this)
    });

    fuse.ajax.Request.Events.each(function(state){
      options['on' + state] = options.onCreate;
    });

    fuse.ajax.Request('../fixtures/content.html', options);
  },

  'testResponseText': function() {
    fuse.ajax.Request('../fixtures/empty.html',
      extendDefault({
        'onDone': fuse.Function.bind(
          function(request) { this.assertEqual('', request.responseText) }, this)
    }));

    fuse.ajax.Request('../fixtures/content.html',
      extendDefault({
        'onDone': fuse.Function.bind(
          function(request) { this.assertEqual(sentence, request.responseText.toLowerCase()) }, this)
    }));
  },

  'testResponseXML': function() {
    if (this.isRunningFromRake) {
      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.xml,
          'onDone': fuse.Function.bind(function(request) {
            this.assertEqual('foo', request.responseXML.getElementsByTagName('name')[0].getAttribute('attr'))
          }, this)
      }));
    }
    else this.info(message);
  },

  'testResponseJSON': function() {
    if (this.isRunningFromRake) {
      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.json,
          'onDone': fuse.Function.bind(
            function(request) { this.assertEqual(123, request.responseJSON.test) }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': {
            'Content-Length': 0,
            'Content-Type':   'application/json'
          },
          'onDone': fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'evalJSON':   false,
          'parameters': Fixtures.json,
          'onDone': fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.jsonWithoutContentType,
          'onDone': fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'sanitizeJSON': true,
          'parameters':   Fixtures.invalidJson,
          'onException':  fuse.Function.bind(function(request, error) {
            this.assert(fuse.String.contains(error.message, 'Badly formed JSON string'));
            this.assertInstanceOf(fuse.ajax.Request, request);
          }, this)
      }));
    }
    else this.info(message);

    fuse.ajax.Request('../fixtures/data.json',
      extendDefault({
        'evalJSON':   'force',
        'onDone': fuse.Function.bind(
          function(request) { this.assertEqual(123, request.responseJSON.test) }, this)
    }));
  },

  'testHeaderJSON': function() {
    function decode(value) {
      return decodeURIComponent(escape(value));
    }

    if (this.isRunningFromRake) {
      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.headerJson,
          'onDone': fuse.Function.bind(function(request, json) {
            // Normally you should set the proper encoding charset on your page
            // such as charset=ISO-8859-7 and handle decoding on the serverside.
            // PHP server-side ex:
            // $value = utf8_decode($_GET['X-JSON']);
            // or for none superglobals values
            // $value = utf8_decode(urldecode($encoded));
            var expected = 'hello #\u00E9\u00E0 '; // hello #éà
            this.assertEqual(expected, decode(request.headerJSON.test));
            this.assertEqual(expected, decode(json.test));
          }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'onDone': fuse.Function.bind(function(request, json) {
            this.assertNull(request.headerJSON)
            this.assertNull(json)
          }, this)
      }));
    }
    else this.info(message);
  },

  'testGetHeader': function() {
    if (this.isRunningFromRake) {
     fuse.ajax.Request('/response',
       extendDefault({
         'parameters': { 'X-TEST': 'some value' },
         'onDone': fuse.Function.bind(function(request) {
            this.assertEqual('some value', request.getHeader('X-Test'));
            this.assertNull(request.getHeader('X-Nonexistent'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testParametersCanBeHash': function() {
    if (this.isRunningFromRake) {
      fuse.ajax.Request('/response',
        extendDefault({
          'parameters': $H({ 'one': 'two', 'three': 'four' }),
          'onDone': fuse.Function.bind(function(request) {
            this.assertEqual('two',  request.getHeader('one'));
            this.assertEqual('four', request.getHeader('three'));
            this.assertNull(request.getHeader('toObject'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testRequestHeaders': function() {
    if (this.isRunningFromRake) {
      this.assertNothingRaised(function() {
        fuse.ajax.Request('/response',
          extendDefault({
            'requestHeaders': ['X-Foo', 'foo', 'X-Bar', 'bar']
        }));
      }, 'requestHeaders as array');

      this.assertNothingRaised(function() {
        fuse.ajax.Request('/response',
          extendDefault({
            'requestHeaders': { 'X-Foo': 'foo', 'X-Bar': 'bar' }
        }));
      }, 'requestHeaders as object');

      this.assertNothingRaised(function() {
        fuse.ajax.Request('/response',
          extendDefault({
            'requestHeaders': $H({ 'X-Foo': 'foo', 'X-Bar': 'bar' })
        }));
      }, 'requestHeaders as hash object');
    }
    else this.info(message);
  },

  'testIsSameOrigin': function() {
    if (this.isRunningFromRake) {
      var loc = window.location, 
       url = loc.protocol + '//127.0.0.1' + loc.port + '/response';

      $('content').update('same origin policy');

      fuse.ajax.Request(url,
        extendDefault({
          'parameters': Fixtures.js,
          'onException': function() { /* swallow error */ },
          'onDone': fuse.Function.bind(function() {
            this.assertEqual('same origin policy', getInnerHTML('content'));
          }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'parameters':  Fixtures.invalidJson,
          'onException': fuse.Function.bind(function(request, error) {
            this.assert(fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));

      fuse.ajax.Request('/response',
        extendDefault({
          'parameters':  { 'X-JSON': '{});window.attacked = true;({}' },
          'onException': fuse.Function.bind(function(request, error) {
            this.assert(fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testTimedUpdater': function() {
    var updater = fuse.ajax.TimedUpdater('content', '../fixtures/content.html', {
      'asynchronous': false,
      'method': 'get',
      'frequency': 0.5
    });

    // clear after initial synchronous request
    $('content').update();

    this.wait(600, function() {
      this.assertEqual(sentence, getInnerHTML('content'),
        'updater.decay of 1 failed');
      $('content').update();

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'),
          'updater.decay of 2 failed');
        updater.stop();
      });
    });
  },

  'testTimedUpdaterMaxDecay': function() {
    var updater = fuse.ajax.TimedUpdater('content', '../fixtures/content.html', {
      'asynchronous': false,
      'method': 'get',
      'decay': 2,
      'frequency': 0.5,
      'maxDecay': 4
    });

    $('content').update();

    // decay 1 * 0.5
    this.wait(600, function() {
      this.assertEqual(sentence, getInnerHTML('content'),
        'updater.decay of 1 failed');
      $('content').update();

      // decay 2 * 0.5
      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'),
          'updater.decay of 2 failed');
        $('content').update();

        // decay 4 * 0.5 (max)
        this.wait(2000, function() {
          this.assertEqual(sentence, getInnerHTML('content'),
            'updater.decay of 4 failed');
          $('content').update();

          // decay 4 * 0.5 (2 seconds before decay of 8)
          this.wait(2000, function() {
            this.assertEqual(sentence, getInnerHTML('content'),
              'updater.maxDecay of 4 was not enforced');
            updater.stop();
          });
        });
      });
    });
  },

  'testTimedUpdaterDefaultOptions': function() {
    var backup = fuse.Object.clone(fuse.ajax.TimedUpdater.options);
    fuse.Object.extend(fuse.ajax.TimedUpdater.options,  {
      'asynchronous': false,
      'method': 'get',
      'frequency': 3
    });

    var updater = fuse.ajax.TimedUpdater('content', '../fixtures/content.html');
    $('content').update();

    this.wait(2100, function() {
      this.assertEqual('', getInnerHTML('content'),
        'default updater.frequency of 3 was not used');

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'),
          'default updater.frequency of 3 failed');
        updater.stop();
      });
    });

    // restore
    fuse.ajax.TimedUpdater.options = backup;
  }
});