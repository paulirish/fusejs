new Test.Unit.Runner({

  'setup': function() {
    $('content').update('');
    $('content2').update('');
  },

  'teardown': function() {
    // hack to cleanup responders
    Fuse.Ajax.Responders.responders = {
      'onCreate':   Fuse.List(function() { Fuse.Ajax.activeRequestCount++ } ),
      'onComplete': Fuse.List(function() { Fuse.Ajax.activeRequestCount-- } )
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
    var responseAborted, fired = { };

    Fuse.Ajax.Responders.register({
      'onFailure': function() { fired.failureResponder = true },
      'onSuccess': function() { fired.successResponder = true }
    });

    var request = Fuse.Ajax.Request('../fixtures/hello.js', {
      'method':    'get',
      'evalJS':    'force',
      'onAbort':    function() { fired.abort   = true },
      'onFailure':  function() { fired.failure = true },
      'onSuccess':  function() { fired.success = true },
      'onComplete': function(response) { responseAborted = response.aborted }
    });

    request.abort();

    this.assert(fired.abort,
      'onAbort request event failed to fire');

    this.assert(!fired.failure,
      'onFailure request event should not fire');

    this.assert(!fired.success,
      'onSuccess request should not fire');

    this.assert(!fired.failureResponder,
      'onFailure responder event should not fire');

    this.assert(!fired.successResponder,
      'onSuccess responder should not fire');

    this.assert(responseAborted,
      'failed to set response.aborted flag');
  },

  'testRequestWithNoUrl': function() {
    var test = this,  suceeded = false;
    Fuse.Ajax.Request(null, {
      'asynchronous': true,
      'method':      'get',
      'onSuccess':   function() { suceeded = true }
    });

    this.wait(1000, function() { this.assert(suceeded) });
  },

  'testUpdater': function() {
    Fuse.Ajax.Updater('content', '../fixtures/content.html', { 'method': 'get' });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update('');
      this.assertEqual('', getInnerHTML('content'));

      Fuse.Ajax.Updater({ 'success': 'content', 'failure': 'content2' },
        '../fixtures/content.html', { 'method': 'get', 'parameters': { 'pet': 'monkey' } });

      Fuse.Ajax.Updater('', '../fixtures/content.html',
        { 'method': 'get', 'parameters': 'pet=monkey' });

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
      'evalJS':       'force',
      'onComplete':   Fuse.emptyFunction
    };

    var request = Fuse.Ajax.Updater('content', '../fixtures/content.html', options);
    request.options.onComplete = function() { };
    this.assertIdentical(Fuse.emptyFunction, options.onComplete,
      'failed to clone options object');
  },

  'testResponders': function(){
    var i, count = 0,
     dummyResponder = { 'onComplete': function() { /* dummy */ } };

    // check for internal responder
    for (i in Fuse.Ajax.Responders.responders) count++;
    this.assertEqual(2, count, 'Failed default responders count');

    // ensure register() works
    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length,
      'Failed to register an `onComplete` responder');

    // don't add twice
    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length,
      'Added a duplicate responder');

    // ensure unregister() works
    Fuse.Ajax.Responders.unregister(dummyResponder);
    this.assertEqual(1, Fuse.Ajax.Responders.responders['onComplete'].length,
      'Failed to unregister an `onComplete` responder');


    // ensure responders are called
    var responderCounter = 0,
     increaseCounter = function() { responderCounter++ };

    Fuse.Ajax.Responders.register({
      'onCreate':   increaseCounter,
      'onLoaded':   increaseCounter,
      'onSuccess':  increaseCounter,
      'on200':      increaseCounter,
      'onComplete': increaseCounter
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
    var hashResponder = $H({ 'onComplete': function(req) { /* dummy */ } });

    Fuse.Ajax.Responders.register(hashResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length);
    Fuse.Ajax.Responders.unregister(hashResponder);
  },

  'testEvalResponseShouldBeCalledBeforeOnComplete': function() {
    if (this.isRunningFromRake) {
      this.assertEqual('', getInnerHTML('content'));
      this.assertEqual(0,  Fuse.Ajax.activeRequestCount);

      Fuse.Ajax.Request('../fixtures/hello.js',
        extendDefault({
          'onComplete': Fuse.Function.bind(function(response) {
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
        'onComplete':  Fuse.Function.bind(function(response) {
          this.assertEqual('application/bogus; charset=UTF-8', response.responseJSON.headers['content-type']);
        }, this)
      }));
    }
    else this.info(message);
  },

  'testOnCreateCallback': function() {
    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onCreate': Fuse.Function.bind(
          function(response) { this.assertEqual(0, response.readyState) }, this),
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertNotEqual(0, response.readyState) }, this)
    }));
  },

  'testEvalJS': function() {
    if (this.isRunningFromRake) {
      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
            var h2 = $('content').firstChild;
            this.assertEqual('hello world!', getInnerHTML(h2));
          }, this)
      }));

      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJS':     false,
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('', getInnerHTML('content'));
          }, this)
      }));
    }
    else this.info(message);

    $('content').update();

    Fuse.Ajax.Request('../fixtures/hello.js',
      extendDefault({
        'evalJS':     'force',
        'onComplete': Fuse.Function.bind(function(response) {
          var h2 = $('content').firstChild;
          this.assertEqual('hello world!', getInnerHTML(h2));
        }, this)
    }));
  },

  'testCallbacks': function() {
    var options = extendDefault({
      'onCreate': Fuse.Function.bind(
        function(response) { this.assertInstanceOf(Fuse.Ajax.Response, response) }, this)
    });

    Fuse.Ajax.Request.Events.each(function(state){
      options['on' + state] = options.onCreate;
    });

    Fuse.Ajax.Request('../fixtures/content.html', options);
  },

  'testResponseText': function() {
    Fuse.Ajax.Request('../fixtures/empty.html',
      extendDefault({
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual('', response.responseText) }, this)
    }));

    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual(sentence, response.responseText.toLowerCase()) }, this)
    }));
  },

  'testResponseXML': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.xml,
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('foo', response.responseXML.getElementsByTagName('name')[0].getAttribute('attr'))
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
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertEqual(123, response.responseJSON.test) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': {
            'Content-Length': 0,
            'Content-Type':   'application/json'
          },
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJSON':   false,
          'parameters': Fixtures.json,
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.jsonWithoutContentType,
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
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
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual(123, response.responseJSON.test) }, this)
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
          'onComplete': Fuse.Function.bind(function(response, json) {
            // Normally you should set the proper encoding charset on your page
            // such as charset=ISO-8859-7 and handle decoding on the serverside.
            // PHP server-side ex:
            // $value = utf8_decode($_GET['X-JSON']);
            // or for none superglobals values
            // $value = utf8_decode(urldecode($encoded));
            var expected = 'hello #\u00E9\u00E0 '; // hello #éà
            this.assertEqual(expected, decode(response.headerJSON.test));
            this.assertEqual(expected, decode(json.test));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'onComplete': Fuse.Function.bind(function(response, json) {
            this.assertNull(response.headerJSON)
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
         'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('some value', response.getHeader('X-Test'));
            this.assertNull(response.getHeader('X-Inexistant'));
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
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('two',  response.getHeader('one'));
            this.assertEqual('four', response.getHeader('three'));
            this.assertNull(response.getHeader('toObject'));
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
      var isSameOrigin = Fuse.Object.isSameOrigin;
      Fuse.Object.isSameOrigin = function() { return false };

      $('content').update('same origin policy');

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
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

      // restore original method
      Fuse.Object.isSameOrigin = isSameOrigin;
    }
    else this.info(message);
  },

  'testTimedUpdater': function() {
    var updater = Fuse.Ajax.TimedUpdater('content', '../fixtures/content.html', {
      'method': 'get'
    });

    this.wait(3000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));
      $('content').update();

      this.wait(3000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        updater.stop();
      });
    });
  },

  'testTimedUpdaterDefaultOptions': function() {
    var backup = Fuse.Object.clone(Fuse.Ajax.TimedUpdater.options);
    Fuse.Object.extend(Fuse.Ajax.TimedUpdater.options,  {
      'method': 'get',
      'asynchronous': false,
      'frequency': 3
    });

    var updater = Fuse.Ajax.TimedUpdater('content', '../fixtures/content.html');
    $('content').update();

    this.wait(2500, function() {
      this.assertEqual('', getInnerHTML('content'));

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        $('content').update();
        updater.stop();
      });
    });
    
    // restore
    Fuse.Ajax.TimedUpdater.options = backup;
  }
});