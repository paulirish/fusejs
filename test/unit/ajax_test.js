var extendDefault = function(options) {
  return Object.extend({
    asynchronous: false,
    method: 'get',
    onException: function(e) { throw e; }
  }, options);
};

new Test.Unit.Runner({
  setup: function() {
    $('content').update('');
    $('content2').update('');
  },
  
  teardown: function() {
    // hack to cleanup responders
    Ajax.Responders.responders = {
      'onCreate':   [ function() { Ajax.activeRequestCount++ } ],
      'onComplete': [ function() { Ajax.activeRequestCount-- } ]
    };
  },
  
  testSynchronousRequest: function() {
    this.assertEqual('', getInnerHTML('content'));
    
    this.assertEqual(0, Ajax.activeRequestCount);
    new Ajax.Request("../fixtures/hello.js", {
      asynchronous: false,
      method: 'GET',
      evalJS: 'force'
    });
    this.assertEqual(0, Ajax.activeRequestCount);
    
    var h2 = $("content").firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));
  },
  
  testAsynchronousRequest: function() {
    this.assertEqual('', getInnerHTML('content'));
    
    new Ajax.Request("../fixtures/hello.js", {
      asynchronous: true,
      method: 'get',
      evalJS: 'force'
    });
    this.wait(1000, function() {
      var h2 = $("content").firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    });
  },
  
  testUpdater: function() {
    this.assertEqual('', getInnerHTML('content'));
    
    new Ajax.Updater("content", "../fixtures/content.html", { method:'get' });
    
    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));
      
      $('content').update('');
      this.assertEqual('', getInnerHTML('content'));
       
      new Ajax.Updater({ success:"content", failure:"content2" },
        "../fixtures/content.html", { method:'get', parameters:{ pet:'monkey' } });
      
      new Ajax.Updater("", "../fixtures/content.html", { method:'get', parameters:"pet=monkey" });
      
      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        this.assertEqual("", getInnerHTML('content2'));
      });
    }); 
  },
  
  testUpdaterWithInsertion: function() {
    $('content').update();
    new Ajax.Updater("content", "../fixtures/content.html", { method:'get', insertion: Insertion.Top });
    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));
      $('content').update();
      new Ajax.Updater("content", "../fixtures/content.html", { method:'get', insertion: 'bottom' });      
      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        
        $('content').update();
        new Ajax.Updater("content", "../fixtures/content.html", { method:'get', insertion: 'after' });      
        this.wait(1000, function() {
          this.assertEqual('five dozen', getInnerHTML($('content').next()));
        });
      });
    });
  },
  
  testUpdaterOptions: function() {
    var options = {
      method: 'get',
      asynchronous: false,
      evalJS: 'force',
      onComplete: Fuse.emptyFunction
    }
    var request = new Ajax.Updater("content", "../fixtures/hello.js", options);
    request.options.onComplete = function() {};
    this.assertIdentical(Fuse.emptyFunction, options.onComplete);
  },
  
  testResponders: function(){
    // check for internal responder
    var count = 0;
    for (var i in Ajax.Responders.responders) count++;
    this.assertEqual(2, count);
    
    var dummyResponder = {
      onComplete: function(req) { /* dummy */ }
    };
    
    Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Ajax.Responders.responders['onComplete'].length);
    
    // don't add twice
    Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Ajax.Responders.responders['onComplete'].length);
    
    Ajax.Responders.unregister(dummyResponder);
    this.assertEqual(1, Ajax.Responders.responders['onComplete'].length);
    
    var responder = {
      onCreate:   function(req){ responderCounter++ },
      onLoading:  function(req){ responderCounter++ },
      onComplete: function(req){ responderCounter++ }
    };
    Ajax.Responders.register(responder);
    
    this.assertEqual(0, responderCounter);
    this.assertEqual(0, Ajax.activeRequestCount);
    new Ajax.Request("../fixtures/content.html", { method:'get', parameters:"pet=monkey" });
    this.assertEqual(1, responderCounter);
    this.assertEqual(1, Ajax.activeRequestCount);
    
    this.wait(1000,function() {
      this.assertEqual(3, responderCounter);
      this.assertEqual(0, Ajax.activeRequestCount);
    });
  },
  
  testEvalResponseShouldBeCalledBeforeOnComplete: function() {
    if (this.isRunningFromRake) {
      this.assertEqual('', getInnerHTML('content'));
    
      this.assertEqual(0, Ajax.activeRequestCount);
      new Ajax.Request("../fixtures/hello.js", extendDefault({
        onComplete: function(response) { this.assertNotEqual('', getInnerHTML('content')) }.bind(this)
      }));
      this.assertEqual(0, Ajax.activeRequestCount);
    
      var h2 = $("content").firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    } else {
      this.info(message);
    }
  },
  
  testContentTypeSetForSimulatedVerbs: function() {
    if (this.isRunningFromRake) {
      new Ajax.Request('/inspect', extendDefault({
        method: 'put',
        contentType: 'application/bogus',
        onComplete: function(response) {
          this.assertEqual('application/bogus; charset=UTF-8', response.responseJSON.headers['content-type']);
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
  },
  
  testOnCreateCallback: function() {
    new Ajax.Request("../fixtures/content.html", extendDefault({
      onCreate: function(transport) { this.assertEqual(0, transport.readyState) }.bind(this),
      onComplete: function(transport) { this.assertNotEqual(0, transport.readyState) }.bind(this)
    }));
  },
  
  testEvalJS: function() {
    if (this.isRunningFromRake) {
      
      $('content').update();
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.js,
        onComplete: function(transport) { 
          var h2 = $("content").firstChild;
          this.assertEqual('hello world!', getInnerHTML(h2));
        }.bind(this)
      }));
      
      $('content').update();
      new Ajax.Request("/response", extendDefault({
        evalJS: false,
        parameters: Fixtures.js,
        onComplete: function(transport) { 
          this.assertEqual('', getInnerHTML('content'));
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
    
    $('content').update();
    new Ajax.Request("../fixtures/hello.js", extendDefault({
      evalJS: 'force',
      onComplete: function(transport) { 
        var h2 = $("content").firstChild;
        this.assertEqual('hello world!', getInnerHTML(h2));
      }.bind(this)
    }));
  },

  testCallbacks: function() {
    var options = extendDefault({
      onCreate: function(transport) { this.assertInstanceOf(Ajax.Response, transport) }.bind(this)
    });
    
    Ajax.Request.Events.each(function(state){
      options['on' + state] = options.onCreate;
    });

    new Ajax.Request("../fixtures/content.html", options);
  },

  testResponseText: function() {
    new Ajax.Request("../fixtures/empty.html", extendDefault({
      onComplete: function(transport) { this.assertEqual('', transport.responseText) }.bind(this)
    }));
    
    new Ajax.Request("../fixtures/content.html", extendDefault({
      onComplete: function(transport) { this.assertEqual(sentence, transport.responseText.toLowerCase()) }.bind(this)
    }));
  },
  
  testResponseXML: function() {
    if (this.isRunningFromRake) {
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.xml,
        onComplete: function(transport) { 
          this.assertEqual('foo', transport.responseXML.getElementsByTagName('name')[0].getAttribute('attr'))
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
  },
      
  testResponseJSON: function() {
    if (this.isRunningFromRake) {
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.json,
        onComplete: function(transport) { this.assertEqual(123, transport.responseJSON.test) }.bind(this)
      }));
      
      new Ajax.Request("/response", extendDefault({
        parameters: {
          'Content-Length': 0,
          'Content-Type': 'application/json'
        },
        onComplete: function(transport) { this.assertNull(transport.responseJSON) }.bind(this)
      }));
      
      new Ajax.Request("/response", extendDefault({
        evalJSON: false,
        parameters: Fixtures.json,
        onComplete: function(transport) { this.assertNull(transport.responseJSON) }.bind(this)
      }));
    
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.jsonWithoutContentType,
        onComplete: function(transport) { this.assertNull(transport.responseJSON) }.bind(this)
      }));
    
      new Ajax.Request("/response", extendDefault({
        sanitizeJSON: true,
        parameters: Fixtures.invalidJson,
        onException: function(request, error) {
          this.assert(error.message.contains('Badly formed JSON string'));
          this.assertInstanceOf(Ajax.Request, request);
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
    
    new Ajax.Request("../fixtures/data.json", extendDefault({
      evalJSON: 'force',
      onComplete: function(transport) { this.assertEqual(123, transport.responseJSON.test) }.bind(this)
    }));
  },
  
  testHeaderJSON: function() {
    function decode(value) {
      return decodeURIComponent(escape(value));
    }
    
    if (this.isRunningFromRake) {
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.headerJson,
        onComplete: function(transport, json) {
          // Normally you should set the proper encoding charset on your page
          // such as charset=ISO-8859-7 and handle decoding on the serverside.
          // PHP server-side ex:
          // $value = utf8_decode($_GET['X-JSON']);
          // or for none superglobals values
          // $value = utf8_decode(urldecode($encoded));
          var expected = 'hello #\u00E9\u00E0 '; // hello #éà
          this.assertEqual(expected, decode(transport.headerJSON.test));
          this.assertEqual(expected, decode(json.test));
        }.bind(this)
      }));
    
      new Ajax.Request("/response", extendDefault({
        onComplete: function(transport, json) { 
          this.assertNull(transport.headerJSON)
          this.assertNull(json)
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
  },
  
  testGetHeader: function() {
    if (this.isRunningFromRake) {
     new Ajax.Request("/response", extendDefault({
        parameters: { 'X-TEST': 'some value' },
        onComplete: function(transport) {
          this.assertEqual('some value', transport.getHeader('X-Test'));
          this.assertNull(transport.getHeader('X-Inexistant'));
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
  },
  
  testParametersCanBeHash: function() {
    if (this.isRunningFromRake) {
      new Ajax.Request("/response", extendDefault({
        parameters: $H({ "one": "two", "three": "four" }),
        onComplete: function(transport) {
          this.assertEqual("two", transport.getHeader("one"));
          this.assertEqual("four", transport.getHeader("three"));
          this.assertNull(transport.getHeader("toObject"));
        }.bind(this)
      }));
    } else {
      this.info(message);
    }
  },
  
  testRequestHeaders: function() {
    if (this.isRunningFromRake) {
      this.assertNothingRaised(function() {
        new Ajax.Request('/response', extendDefault({
          'requestHeaders': ['X-Foo', 'foo', 'X-Bar', 'bar']
        }));
      });

      this.assertNothingRaised(function() {
        new Ajax.Request('/response', extendDefault({
          'requestHeaders': { 'X-Foo':'foo', 'X-Bar':'bar' }
        }));
      });

      this.assertNothingRaised(function() {
        new Ajax.Request('/response', extendDefault({
          'requestHeaders': $H({ 'X-Foo':'foo', 'X-Bar':'bar' })
        }));
      });
    } 
    else this.info(message);
  },
  
  testIsSameOrigin: function() {
    if (this.isRunningFromRake) {
      var isSameOrigin = Object.isSameOrigin;
      Object.isSameOrigin = function() { return false };

      $("content").update('same origin policy');
      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.js,
        onComplete: function(transport) { 
          this.assertEqual('same origin policy', getInnerHTML('content'));
        }.bind(this)
      }));

      new Ajax.Request("/response", extendDefault({
        parameters: Fixtures.invalidJson,
        onException: function(request, error) {
          this.assert(error.message.contains('Badly formed JSON string'));
        }.bind(this)
      }));

      new Ajax.Request("/response", extendDefault({
        parameters: { 'X-JSON': '{});window.attacked = true;({}' },
        onException: function(request, error) {
          this.assert(error.message.contains('Badly formed JSON string'));
        }.bind(this)
      }));

      // restore original method
      Object.isSameOrigin = isSameOrigin;
    }
    else this.info(message);
  }
});