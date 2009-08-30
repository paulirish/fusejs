new Test.Unit.Runner({

  'setup': function() {
    $('content').update('');
    $('content2').update('');
  },

  'teardown': function() {
    // hack to cleanup responders
    Fuse.Ajax.Responders.responders = {
      'onCreate': Fuse.List(function() { Fuse.Ajax.activeRequestCount++ }),
      'onDone':   Fuse.List(function() { Fuse.Ajax.activeRequestCount-- })
    };
  },

  'testBaseDefaultOptions': function() {
    var backup = Fuse.Object.clone(Fuse.Ajax.Base.options);
    Fuse.Object.extend(Fuse.Ajax.Base.options,  {
      'method': 'get',
      'evalJS': 'force',
      'asynchronous': false
    });

    Fuse.Ajax.Request('../fixtures/hello.js');
    var h2 = $('content').firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));

    // restore
    Fuse.Ajax.Base.options = backup;
  },

  'testSynchronousRequest': function() {
    Fuse.Ajax.Request('../fixtures/hello.js', {
      'asynchronous': false,
      'method':      'GET',
      'evalJS':      'force'
    });

    this.assertEqual(0, Fuse.Ajax.activeRequestCount);

    var h2 = $('content').firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));
  },

  'testAsynchronousRequest': function() {
    Fuse.Ajax.Request('../fixtures/hello.js', {
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

    Fuse.Ajax.Responders.register({
      'onFailure': function() { fired.failureResponder = true },
      'onSuccess': function() { fired.successResponder = true },
      'onAbort':   function() { fired.abortResponder   = true }
    });

    var request = Fuse.Ajax.Request('../fixtures/hello.js', {
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

    Fuse.Ajax.Responders.register({
      'onFailure': function() { fired.failureResponder = true },
      'onSuccess': function() { fired.successResponder = true },
      'onTimeout': function() { fired.timeoutResponder = true }
    });

    var request = Fuse.Ajax.Request('../fixtures/hello.js?delay=1', {
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
    Fuse.Ajax.Request(null, {
      'method': 'get',
      'asynchronous': false,
      'onSuccess': function() { suceeded = true; }
    });

    this.assert(suceeded);
  },

  'testUpdater': function() {
    Fuse.Ajax.Updater('content', '../fixtures/content.html', { 'method': 'get' });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update('');
      this.assertEqual('', getInnerHTML('content'));

      Fuse.Ajax.Updater({ 'success': 'content', 'failure': 'content2' },
        '../fixtures/content.html', { 'method': 'get' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        this.assertEqual('', getInnerHTML('content2'));
      });
    });
  },

  'testUpdaterWithInsertion': function() {
    Fuse.Ajax.Updater('content', '../fixtures/content.html', {
      'method':   'get',
      'insertion': function(element, content) {
        Element.insert(element, { 'top': content });
      }
    });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update();
      Fuse.Ajax.Updater('content','../fixtures/content.html',
        { 'method': 'get', 'insertion': 'bottom' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));

        $('content').update();
        Fuse.Ajax.Updater('content', '../fixtures/content.html',
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
      'onDone':       Fuse.emptyFunction
    };

    var request = Fuse.Ajax.Updater('content', '../fixtures/content.html', options);
    request.options.onDone = function() { };
    this.assertIdentical(Fuse.emptyFunction, options.onDone,
      'failed to clone options object');
  },

  'testResponders': function(){
    var i, count = 0,
     dummyResponder = { 'onDone': Fuse.emptyFunction };

    // check for internal responder
    for (i in Fuse.Ajax.Responders.responders) count++;
    this.assertEqual(2, count, 'Failed default responders count');

    // ensure register() works
    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onDone'].length,
      'Failed to register an `onDone` responder');

    // don't add twice
    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onDone'].length,
      'Added a duplicate responder');

    // ensure unregister() works
    Fuse.Ajax.Responders.unregister(dummyResponder);
    this.assertEqual(1, Fuse.Ajax.Responders.responders['onDone'].length,
      'Failed to unregister an `onDone` responder');


    // ensure responders are called
    var responderCounter = 0,
     increaseCounter = function() { responderCounter++ };

    Fuse.Ajax.Responders.register({
      'onCreate':  increaseCounter,
      'onLoading': increaseCounter,
      'onSuccess': increaseCounter,
      'on200':     increaseCounter,
      'onDone':    increaseCounter
    });

    this.assertEqual(0, responderCounter,
      'Responders executed too soon');

    this.assertEqual(0, Fuse.Ajax.activeRequestCount,
      'There should be no active requests');

    Fuse.Ajax.Request('../fixtures/content.html', {
      'method':     'get',
      'parameters': 'pet=monkey',
      'on200' :      function() { }
    });

    this.assert(responderCounter > 0,
      'The `onCreate` responder failed');

    this.assertEqual(1, Fuse.Ajax.activeRequestCount,
      'There should be only one active request');

    this.wait(1000, function() {
      this.assertEqual(5, responderCounter,
        'Incorrect number of responders fired');

      this.assertEqual(0, Fuse.Ajax.activeRequestCount,
        'activeRequestCount failed clear itself');
    });
  },

  'testRespondersCanBeHash': function(){
    var hashResponder = $H({ 'onDone': Fuse.emptyFunction });

    Fuse.Ajax.Responders.register(hashResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onDone'].length);
    Fuse.Ajax.Responders.unregister(hashResponder);
  },

  'testEvalResponseShouldBeCalledBeforeOnComplete': function() {
    if (this.isRunningFromRake) {
      this.assertEqual('', getInnerHTML('content'));
      this.assertEqual(0,  Fuse.Ajax.activeRequestCount);

      Fuse.Ajax.Request('../fixtures/hello.js',
        extendDefault({
          'onDone': Fuse.Function.bind(function() {
            this.assertNotEqual('', getInnerHTML('content')) }, this)
        }));

      this.assertEqual(0, Fuse.Ajax.activeRequestCount);

      var h2 = $('content').firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    }
    else this.info(message);
  },

  'testContentTypeSetForSimulatedVerbs': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/inspect', extendDefault({
        'method':      'put',
        'contentType': 'application/bogus',
        'onDone':      Fuse.Function.bind(function(request) {
          this.assertEqual('application/bogus; charset=UTF-8', request.responseJSON.headers['content-type']);
        }, this)
      }));
    }
    else this.info(message);
  },

  'testOnCreateCallback': function() {
    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onCreate': Fuse.Function.bind(
          function(request) { this.assertEqual(0, request.readyState) }, this),
        'onDone': Fuse.Function.bind(
          function(request) { this.assertNotEqual(0, request.readyState) }, this)
    }));
  },

  'testEvalJS': function() {
    if (this.isRunningFromRake) {
      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onDone': Fuse.Function.bind(function() {
            var h2 = $('content').firstChild;
            this.assertEqual('hello world!', getInnerHTML(h2));
          }, this)
      }));

      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJS':     false,
          'parameters': Fixtures.js,
          'onDone': Fuse.Function.bind(function() {
            this.assertEqual('', getInnerHTML('content'));
          }, this)
      }));
    }
    else this.info(message);

    $('content').update();

    Fuse.Ajax.Request('../fixtures/hello.js',
      extendDefault({
        'evalJS':     'force',
        'onDone': Fuse.Function.bind(function() {
          var h2 = $('content').firstChild;
          this.assertEqual('hello world!', getInnerHTML(h2));
        }, this)
    }));
  },

  'testCallbacks': function() {
    var options = extendDefault({
      'onCreate': Fuse.Function.bind(
        function(request) { this.assertInstanceOf(Fuse.Ajax.Request, request,
          'request object is not passed to callbacks') }, this)
    });

    Fuse.Ajax.Request.Events.each(function(state){
      options['on' + state] = options.onCreate;
    });

    Fuse.Ajax.Request('../fixtures/content.html', options);
  },

  'testResponseText': function() {
    Fuse.Ajax.Request('../fixtures/empty.html',
      extendDefault({
        'onDone': Fuse.Function.bind(
          function(request) { this.assertEqual('', request.responseText) }, this)
    }));

    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onDone': Fuse.Function.bind(
          function(request) { this.assertEqual(sentence, request.responseText.toLowerCase()) }, this)
    }));
  },

  'testResponseXML': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.xml,
          'onDone': Fuse.Function.bind(function(request) {
            this.assertEqual('foo', request.responseXML.getElementsByTagName('name')[0].getAttribute('attr'))
          }, this)
      }));
    }
    else this.info(message);
  },

  'testResponseJSON': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.json,
          'onDone': Fuse.Function.bind(
            function(request) { this.assertEqual(123, request.responseJSON.test) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': {
            'Content-Length': 0,
            'Content-Type':   'application/json'
          },
          'onDone': Fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJSON':   false,
          'parameters': Fixtures.json,
          'onDone': Fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.jsonWithoutContentType,
          'onDone': Fuse.Function.bind(
            function(request) { this.assertNull(request.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'sanitizeJSON': true,
          'parameters':   Fixtures.invalidJson,
          'onException':  Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
            this.assertInstanceOf(Fuse.Ajax.Request, request);
          }, this)
      }));
    }
    else this.info(message);

    Fuse.Ajax.Request('../fixtures/data.json',
      extendDefault({
        'evalJSON':   'force',
        'onDone': Fuse.Function.bind(
          function(request) { this.assertEqual(123, request.responseJSON.test) }, this)
    }));
  },

  'testHeaderJSON': function() {
    function decode(value) {
      return decodeURIComponent(escape(value));
    }

    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.headerJson,
          'onDone': Fuse.Function.bind(function(request, json) {
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

      Fuse.Ajax.Request('/response',
        extendDefault({
          'onDone': Fuse.Function.bind(function(request, json) {
            this.assertNull(request.headerJSON)
            this.assertNull(json)
          }, this)
      }));
    }
    else this.info(message);
  },

  'testGetHeader': function() {
    if (this.isRunningFromRake) {
     Fuse.Ajax.Request('/response',
       extendDefault({
         'parameters': { 'X-TEST': 'some value' },
         'onDone': Fuse.Function.bind(function(request) {
            this.assertEqual('some value', request.getHeader('X-Test'));
            this.assertNull(request.getHeader('X-Nonexistent'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testParametersCanBeHash': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': $H({ 'one': 'two', 'three': 'four' }),
          'onDone': Fuse.Function.bind(function(request) {
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
        Fuse.Ajax.Request('/response',
          extendDefault({
            'requestHeaders': ['X-Foo', 'foo', 'X-Bar', 'bar']
        }));
      }, 'requestHeaders as array');

      this.assertNothingRaised(function() {
        Fuse.Ajax.Request('/response',
          extendDefault({
            'requestHeaders': { 'X-Foo': 'foo', 'X-Bar': 'bar' }
        }));
      }, 'requestHeaders as object');

      this.assertNothingRaised(function() {
        Fuse.Ajax.Request('/response',
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

      Fuse.Ajax.Request(url,
        extendDefault({
          'parameters': Fixtures.js,
          'onException': function() { /* swallow error */ },
          'onDone': Fuse.Function.bind(function() {
            this.assertEqual('same origin policy', getInnerHTML('content'));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters':  Fixtures.invalidJson,
          'onException': Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters':  { 'X-JSON': '{});window.attacked = true;({}' },
          'onException': Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testTimedUpdater': function() {
    var updater = Fuse.Ajax.TimedUpdater('content', '../fixtures/content.html', {
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
    var updater = Fuse.Ajax.TimedUpdater('content', '../fixtures/content.html', {
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
    var backup = Fuse.Object.clone(Fuse.Ajax.TimedUpdater.options);
    Fuse.Object.extend(Fuse.Ajax.TimedUpdater.options,  {
      'asynchronous': false,
      'method': 'get',
      'frequency': 3
    });

    var updater = Fuse.Ajax.TimedUpdater('content', '../fixtures/content.html');
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
    Fuse.Ajax.TimedUpdater.options = backup;
  }
});