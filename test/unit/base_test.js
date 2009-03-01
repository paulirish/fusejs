new Test.Unit.Runner({
  testFunctionArgumentNames: function() {
    this.assertEnumEqual([], (function() {}).argumentNames());
    this.assertEnumEqual(["one"], (function(one) {}).argumentNames());
    this.assertEnumEqual(["one", "two", "three"], (function(one, two, three) {}).argumentNames());
    this.assertEnumEqual(["one", "two", "three"], (function(  one  , two 
      , three   ) {}).argumentNames());
      
    this.assertEqual("$fuse", (function($fuse) {}).argumentNames().first());
    
    function named1() {};
    this.assertEnumEqual([], named1.argumentNames());
    function named2(one) {};
    this.assertEnumEqual(["one"], named2.argumentNames());
    function named3(one, two, three) {};
    this.assertEnumEqual(["one", "two", "three"], named3.argumentNames());
    
    function named4(/*foo*/ foo, /* bar */ bar, /*****/ baz) {}
    this.assertEnumEqual($w("foo bar baz"), named4.argumentNames());
    
    function named5(
      /*foo*/ foo, 
      /**/bar,
      /* baz */ /* baz */ baz,
      // Skip a line just to screw with the regex...
      /* thud */ thud) {}    
     this.assertEnumEqual($w("foo bar baz thud"), named5.argumentNames());
  },
  
  testFunctionBind: function() {
    function methodWithoutArguments() { return this.hi };
    function methodWithArguments()    { return this.hi + ',' + $A(arguments).join(',') };
    var func = Fuse.emptyFunction;

    this.assertIdentical(func, func.bind());
    this.assertIdentical(func, func.bind(undefined));
    this.assertNotIdentical(func, func.bind(null));

    this.assertEqual('without', methodWithoutArguments.bind({ hi: 'without' })());
    this.assertEqual('with,arg1,arg2', methodWithArguments.bind({ hi: 'with' })('arg1','arg2'));
    this.assertEqual('withBindArgs,arg1,arg2',
      methodWithArguments.bind({ hi: 'withBindArgs' }, 'arg1', 'arg2')());
    this.assertEqual('withBindArgsAndArgs,arg1,arg2,arg3,arg4',
      methodWithArguments.bind({ hi: 'withBindArgsAndArgs' }, 'arg1', 'arg2')('arg3', 'arg4'));
  },
  
  testFunctionCurry: function() {
    var split = function(delimiter, string) { return string.split(delimiter); };
    var splitOnColons = split.curry(":");
    this.assertNotIdentical(split, splitOnColons);
    this.assertEnumEqual(split(":", "0:1:2:3:4:5"), splitOnColons("0:1:2:3:4:5"));
    this.assertIdentical(split, split.curry());
  },
  
  testFunctionDelay: function() {
    window.delayed = undefined;
    var delayedFunction = function() { window.delayed = true; };
    var delayedFunctionWithArgs = function() { window.delayedWithArgs = $A(arguments).join(' '); };
    delayedFunction.delay(0.8);
    delayedFunctionWithArgs.delay(0.8, 'hello', 'world');
    this.assertUndefined(window.delayed);
    this.wait(1000, function() {
      this.assert(window.delayed);
      this.assertEqual('hello world', window.delayedWithArgs);
    });
  },
  
  testFunctionWrap: function() {
    function sayHello(){
      return 'hello world';
    };
    
    this.assertEqual('HELLO WORLD', sayHello.wrap(function(proceed) {
      return proceed().toUpperCase();
    })());
    
    var temp = String.prototype.capitalize;
    String.prototype.capitalize = String.prototype.capitalize.wrap(function(proceed, eachWord) {
      if (eachWord && this.include(' ')) return this.split(' ').map(function(str){
        return str.capitalize();
      }).join(' ');
      return proceed();
    });
    this.assertEqual('Hello world', 'hello world'.capitalize());
    this.assertEqual('Hello World', 'hello world'.capitalize(true));
    this.assertEqual('Hello', 'hello'.capitalize());
    String.prototype.capitalize = temp;
  },
  
  testFunctionDefer: function() {
    window.deferred = undefined;
    var deferredFunction = function() { window.deferred = true; };
    deferredFunction.defer();
    this.assertUndefined(window.deferred);      
    this.wait(50, function() {
      this.assert(window.deferred);
      
      window.deferredValue = 0;
      var deferredFunction2 = function(arg) { window.deferredValue = arg; };
      deferredFunction2.defer('test');
      this.wait(50, function() {
        this.assertEqual('test', window.deferredValue);
      });
    });
  },
  
  testFunctionMethodize: function() {
    var Foo = { bar: function(baz) { return baz } };
    var baz = { quux: Foo.bar.methodize() };
    
    this.assertEqual(Foo.bar.methodize(), baz.quux);
    this.assertEqual(baz, Foo.bar(baz));
    this.assertEqual(baz, baz.quux());
  },

  testObjectExtend: function() {
    var object = {foo: 'foo', bar: [1, 2, 3]};
    this.assertIdentical(object, Object.extend(object));
    this.assertHashEqual({foo: 'foo', bar: [1, 2, 3]}, object);
    this.assertIdentical(object, Object.extend(object, {bla: 123}));
    this.assertHashEqual({foo: 'foo', bar: [1, 2, 3], bla: 123}, object);
    this.assertHashEqual({foo: 'foo', bar: [1, 2, 3], bla: null},
      Object.extend(object, {bla: null}));
  },
  
  testObjectToQueryString: function() {
    this.assertEqual('a=A&b=B&c=C&d=D%23', Object.toQueryString({ 'a':'A', 'b':'B', 'c':'C', 'd':'D#' }));
    this.assertEqual('a=A&b=B&toString=bar&valueOf=', 
      Object.toQueryString(Fixtures.mixed_dont_enum));
  },
  
  testObjectClone: function() {
    var object = {foo: 'foo', bar: [1, 2, 3]};
    this.assertNotIdentical(object, Object.clone(object));
    this.assertHashEqual(object, Object.clone(object));
    this.assertHashEqual({}, Object.clone());
    var clone = Object.clone(object);
    delete clone.bar;
    this.assertHashEqual({foo: 'foo'}, clone, 
      "Optimizing Object.clone perf using prototyping doesn't allow properties to be deleted.");
  },

  testObjectInspect: function() {
    this.assertEqual('undefined', Object.inspect());
    this.assertEqual('undefined', Object.inspect(undefined));
    this.assertEqual('null', Object.inspect(null));
    this.assertEqual("'foo\\\\b\\\'ar'", Object.inspect('foo\\b\'ar'));
    this.assertEqual('[]', Object.inspect([]));
    this.assertNothingRaised(function() { Object.inspect(window.Node) });
  },
  
  testObjectToJSON: function() {
    var undef;
    
    this.assertUndefined(Object.toJSON(undef));
    this.assertUndefined(Object.toJSON(Fuse.K));
    
    this.assertEqual('""', Object.toJSON(''));
    this.assertEqual('[]', Object.toJSON([]));
    this.assertEqual('["a"]', Object.toJSON(['a']));
    this.assertEqual('["a", 1]', Object.toJSON(['a', 1]));
    this.assertEqual('["a", {"b": null}]', Object.toJSON(['a', {'b': null}]));
    this.assertEqual('{"a": "hello!"}', Object.toJSON({a: 'hello!'}));
    this.assertEqual('{}', Object.toJSON({ }));
    this.assertEqual('{}', Object.toJSON({ 'a':undef, 'b':undef, 'c':Fuse.K }));

    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      Object.toJSON({ 'b': [undef, false, true, undef], 'c': {'a':'hello!' } }));
      
    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      Object.toJSON($H({ 'b': [undef, false, true, undef], 'c': { 'a': 'hello!' } })));
      
    this.assertEqual('true',  Object.toJSON(true));
    this.assertEqual('false', Object.toJSON(false));
    this.assertEqual('null',  Object.toJSON(null));
    
    var sam = new Fixtures.Person('sam');
    this.assertEqual('-sam', Object.toJSON(sam));
    this.assertEqual('-sam', sam.toJSON());
    
    var element = $('test');
    this.assertUndefined(Object.toJSON(element));
    
    element.toJSON = function(){ return 'I\'m a div with id test' };
    this.assertEqual('I\'m a div with id test', Object.toJSON(element));
    
    this.assertEqual('{"a": "A", "b": "B", "toString": "bar", "valueOf": ""}',
      Object.toJSON(Fixtures.mixed_dont_enum));
  },
  
  testObjectToHTML: function() {
    this.assertIdentical('', Object.toHTML());
    this.assertIdentical('', Object.toHTML(''));
    this.assertIdentical('', Object.toHTML(null));
    this.assertIdentical('0', Object.toHTML(0));
    this.assertIdentical('123', Object.toHTML(123));
    this.assertEqual('hello world', Object.toHTML('hello world'));
    this.assertEqual('hello world', Object.toHTML({toHTML: function() { return 'hello world' }}));
  },
  
  testObjectIsArray: function() {
    this.assert(Object.isArray([]));
    this.assert(Object.isArray([0]));
    this.assert(Object.isArray([0, 1]));
    this.assert(!Object.isArray({}));
    this.assert(!Object.isArray($('list').childNodes));
    this.assert(!Object.isArray());
    this.assert(!Object.isArray(''));
    this.assert(!Object.isArray('foo'));
    this.assert(!Object.isArray(0));
    this.assert(!Object.isArray(1));
    this.assert(!Object.isArray(null));
    this.assert(!Object.isArray(true));
    this.assert(!Object.isArray(false));
    this.assert(!Object.isArray(undefined));
  },
  
  testObjectIsHash: function() {
    this.assert(Object.isHash($H()));
    this.assert(Object.isHash(new Hash()));
    this.assert(!Object.isHash({}));
    this.assert(!Object.isHash(null));
    this.assert(!Object.isHash());
    this.assert(!Object.isHash(''));
    this.assert(!Object.isHash(2));
    this.assert(!Object.isHash(false));
    this.assert(!Object.isHash(true));
    this.assert(!Object.isHash([]));
    
    // falsy variables should not mess up return value type
    this.assertIdentical(false, Object.isHash(0));
    this.assertIdentical(false, Object.isHash(''));
    this.assertIdentical(false, Object.isHash(NaN));
    this.assertIdentical(false, Object.isHash(null));
    this.assertIdentical(false, Object.isHash(undefined));
  },
  
  testObjectIsElement: function() {
    this.assert(Object.isElement(document.createElement('div')));
    this.assert(Object.isElement(new Element('div')));
    this.assert(Object.isElement($('testlog')));
    this.assert(!Object.isElement(document.createTextNode('bla')));

    // falsy variables should not mess up return value type
    this.assertIdentical(false, Object.isElement(0));
    this.assertIdentical(false, Object.isElement(''));
    this.assertIdentical(false, Object.isElement(NaN));
    this.assertIdentical(false, Object.isElement(null));
    this.assertIdentical(false, Object.isElement(undefined));
  },
  
  testObjectIsFunction: function() {
    this.assert(Object.isFunction(function() { }));
    this.assert(Object.isFunction(Class.create()));
    this.assert(!Object.isFunction(/foo/));
    this.assert(!Object.isFunction("a string"));
    this.assert(!Object.isFunction($("testlog")));
    this.assert(!Object.isFunction([]));
    this.assert(!Object.isFunction({}));
    this.assert(!Object.isFunction(0));
    this.assert(!Object.isFunction(false));
    this.assert(!Object.isFunction(undefined));
  },
  
  testObjectHasKey: function() {
    function A() { this.foo = 3 }
    A.prototype = { 'foo': 4 };

    function B() { this.foo = 2 }
    B.prototype = new A;

    function C() { this.foo = 1 }
    C.prototype = new B;
    
    var undef, c = new C, empty = { },
     properties = ['constructor', 'hasOwnProperty', 'isPrototypeOf',
       'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

    this.assert(Object.hasKey(c, 'foo'), 'Expected c.foo as own property.');

    delete c.foo;
    this.assert(!Object.hasKey(c, 'foo'), 'Expected c.foo as inherited property.');
    this.assertEqual(2, c.foo, 'Expected c.foo to equal 2');

    delete C.prototype.foo;
    this.assertEqual(3, c.foo, 'Expected c.foo to equal 3 after deleting C.prototype.foo.');

    c.foo = undef;
    this.assert(Object.hasKey(c, 'foo'), 'Expected c.foo, value set as undefined, as own property.');
    this.assert(!Object.hasKey(C.prototype, 'foo'), 'Expected C.prototype.foo as inherited property.');
    this.assertEqual(3, C.prototype.foo, 'Expected C.prototype.foo to equal 3');

    C.prototype.foo = undef;
    this.assert(Object.hasKey(A.prototype, 'foo', 'Expected A.prototype.foo as own property.'));

    properties.each(function(property) {
      this.assert(!Object.hasKey(empty, property),
        'Expected "' + property + '" as inherited property');
      
      // Safari 2 doesn't have many of the properties
      if (Object.prototype[property]) {
        this.assert(Object.hasKey(Object.prototype, property),
          'Expected "' + property + '" as own property');
      }
    }, this);

    this.assert(!Object.hasKey(0, 'toString'));
    this.assert(!Object.hasKey('testing', 'valueOf'));

    // test null/undefined values
    this.assertRaise('TypeError', function() { Object.hasKey(null,  '') });
    this.assertRaise('TypeError', function() { Object.hasKey(undef, '') });
    
    // test window object
    this.assert(Object.hasKey(window, 'Fuse'));
    this.assert(!Object.hasKey(window, 'abc123xyz'));
  },
  
  testObjectIsPrimitive: function() {
    var undef;
    this.assert(Object.isPrimitive('a string'));
    this.assert(Object.isPrimitive(5));
    this.assert(Object.isPrimitive(0));
    this.assert(Object.isPrimitive(false));
    this.assert(Object.isPrimitive(true));
    this.assert(Object.isPrimitive(null));
    this.assert(Object.isPrimitive(undef));
    this.assert(Object.isPrimitive(NaN));
    this.assert(Object.isPrimitive(Infinity));
    this.assert(!Object.isPrimitive(/foo/));
    this.assert(!Object.isPrimitive(new Number(0)));
    this.assert(!Object.isPrimitive(new String('a string')));
    this.assert(!Object.isPrimitive(function() { }));
    this.assert(!Object.isPrimitive(new Boolean(true)));
    this.assert(!Object.isPrimitive([ ]));
    this.assert(!Object.isPrimitive({ }));
    this.assert(!Object.isPrimitive({ valueOf: 0 }));
    this.assert(!Object.isPrimitive({ valueOf: 'a string' }));
  },
  
  testObjectIsRegExp: function() {
    this.assert(Object.isRegExp(/foo/));
    this.assert(Object.isRegExp(new RegExp('foo')));
    this.assert(!Object.isRegExp(alert));
    this.assert(!Object.isRegExp(0));
    this.assert(!Object.isRegExp(function() { }));
    this.assert(!Object.isRegExp("a string"));
    this.assert(!Object.isRegExp([ ]));
    this.assert(!Object.isRegExp({ }));
    this.assert(!Object.isRegExp({ valueOf: null }));
    this.assert(!Object.isRegExp({ valueOf: /foo/ }));
    this.assert(!Object.isRegExp(false));
    this.assert(!Object.isRegExp(undefined));
  },
  
  testObjectIsSameOrigin: function() {
    var isSameOrigin = Object.isSameOrigin,
     domain = 'www.example.com';

    this.assert(Object.isSameOrigin(null), 'null');
    this.assert(Object.isSameOrigin(), 'undefined');
    this.assert(Object.isSameOrigin(''), 'empty string');

    this.assert(Object.isSameOrigin('/foo/bar.html'), '/foo/bar.html');
    this.assert(Object.isSameOrigin(window.location.href), window.location.href);
    this.assert(!Object.isSameOrigin('http://example.com'), 'http://example.com');

    // test typecasting the url argument as a string
    this.assertNothingRaised(function() { Object.isSameOrigin(window.location) }, 'Error casting url as a string');
    this.assert(Object.isSameOrigin({ 'toString': function() { return window.location.href } }), 'Error casting url as a string');

    // simulate document.domain changes
    Object.isSameOrigin = function(url) {
      return url.match(/([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^/:$]+)(?:\:(\d+))?/)[2]
        .endsWith(domain);
    };

    this.assert(!Object.isSameOrigin('http://sub.example.com'),
      'domain www.example.com allows http://sub.example.com');

    domain = 'example.com';
    this.assert(Object.isSameOrigin('http://sub.example.com'),
      'domain example.com won\'t allow http://sub.example.com');

    Object.isSameOrigin = isSameOrigin;
  },
  
  testObjectIsString: function() {
    this.assert(Object.isString("a string"));
    this.assert(Object.isString(new String("a string")));
    this.assert(!Object.isString(alert));
    this.assert(!Object.isString(function() { }));
    this.assert(!Object.isString(0));
    this.assert(!Object.isString([ ]));
    this.assert(!Object.isString({ }));
    this.assert(!Object.isString({ valueOf: null }));
    this.assert(!Object.isString({ valueOf: 3.1415926535 }));
    this.assert(!Object.isString(false));
    this.assert(!Object.isString(undefined));
  },
  
  testObjectIsNumber: function() {
    this.assert(Object.isNumber(0));
    this.assert(Object.isNumber(1.2));
    this.assert(Object.isNumber(new Number(5)));
    this.assert(!Object.isNumber(alert));
    this.assert(!Object.isNumber(2.5E+345));
    this.assert(!Object.isNumber(0/0));
    this.assert(!Object.isNumber(function() { }));
    this.assert(!Object.isNumber("a string"));
    this.assert(!Object.isNumber([ ]));
    this.assert(!Object.isNumber({ }));
    this.assert(!Object.isNumber({ valueOf: null }));
    this.assert(!Object.isNumber({ valueOf: 3.1415926535 }));
    this.assert(!Object.isNumber(false));
    this.assert(!Object.isNumber(undefined));
  },
  
  testObjectIsUndefined: function() {
    this.assert(Object.isUndefined(undefined));
    this.assert(!Object.isUndefined(null));
    this.assert(!Object.isUndefined(false));
    this.assert(!Object.isUndefined(0));
    this.assert(!Object.isUndefined(""));
    this.assert(!Object.isUndefined(function() { }));
    this.assert(!Object.isUndefined([]));
    this.assert(!Object.isUndefined({}));
  },
  
  testObjectKeys: function() {
    this.assertEnumEqual([],          Object.keys({ }));
    this.assertEnumEqual([],          Object.keys([ ]));
    this.assertEnumEqual(['a'],       Object.keys({ 'a': 'A' }));
    this.assertEnumEqual($w('a b c'), Object.keys({ 'a':'A', 'b':'B', 'c':'C' }).sort());

    // ensure function objects work
    var result, foo = function() { this.a = 'a' };
    foo.prototype.b = 'b';
    foo.prop = 'blah';

    this.assertNothingRaised(function() { result = Object.keys(foo) });
    this.assertEnumEqual(['prop', 'prototype'], result.sort());
    this.assertNothingRaised(function() { result = Object.keys(new foo) });
    this.assertEnumEqual(['a'], result);

    // test objects containing shadowed properties
    this.assertEnumEqual($w('a b toString valueOf'),
      Object.keys(Fixtures.mixed_dont_enum).sort());

    this.assertRaise('TypeError', function() { Object.keys(null) });
    this.assertRaise('TypeError', function() { Object.keys(3) });
  },
  
  testObjectValues: function() {
    this.assertEnumEqual([],          Object.values({ }));
    this.assertEnumEqual([],          Object.values([ ]));
    this.assertEnumEqual(['A'],       Object.values({ 'a': 'A' }));
    this.assertEnumEqual($w('A B C'), Object.values({ 'a':'A', 'b':'B', 'c':'C' }).sort());
    
    var result = Object.values(Fixtures.mixed_dont_enum);
    this.assert(result.length === 4 && result.sort().join('') === 'ABbar');

    this.assertRaise('TypeError', function() { Object.values(null) });
    this.assertRaise('TypeError', function() { Object.values(3) });
  },
  
  // sanity check
  testDoesntExtendObjectFuse: function() {
    // for-in is supported with objects
    var iterations = 0, obj = { a: 1, b: 2, c: 3 };
    for (property in obj) iterations++;
    this.assertEqual(3, iterations);
    
    // for-in is not supported with arrays
    iterations = 0;
    var arr = [1,2,3];
    for (property in arr) iterations++;
    this.assert(iterations > 3);
  },
  
  testTimerStop: function() {
    var timerEventCount = 0;
    function timerEventFired(timer) {
      if (++timerEventCount > 2) timer.stop();
    }
    
    // timerEventFired will stop the Timer after 3 callbacks
    new Timer(timerEventFired, 0.05).start();
    
    this.wait(600, function() {
      this.assertEqual(3, timerEventCount);
    });
  },

  testTimerException: function() {
    function timerEventFired(timer) {
      timer.stop();
      throw "error";
    }
    
    var timer = new Timer(timerEventFired, 0.05).start();
    this.wait(100, function() {
      this.assertEqual(false, timer.executing);
    });
  },
  
  testBindAsEventListener: function() {
    for ( var i = 0; i < 10; ++i ) {
      var div = document.createElement('div');
      div.setAttribute('id','test-'+i);
      document.body.appendChild(div);
      var tobj = new TestObj();
      var eventTest = { test: true };
      var call = tobj.assertingEventHandler.bindAsEventListener(tobj,
        this.assertEqual.bind(this, eventTest),
        this.assertEqual.bind(this, arg1),
        this.assertEqual.bind(this, arg2),
        this.assertEqual.bind(this, arg3), arg1, arg2, arg3 );
      call(eventTest);
    }
  },
  
  testDateToJSON: function() {
    this.assertEqual('\"1970-01-01T00:00:00Z\"', new Date(Date.UTC(1970, 0, 1)).toJSON());
  },
  
  testRegExpEscape: function() {
    this.assertEqual('word', RegExp.escape('word'));
    this.assertEqual('\\/slashes\\/', RegExp.escape('/slashes/'));
    this.assertEqual('\\\\backslashes\\\\', RegExp.escape('\\backslashes\\'));
    this.assertEqual('\\\\border of word', RegExp.escape('\\border of word'));
    
    this.assertEqual('\\(\\?\\:non-capturing\\)', RegExp.escape('(?:non-capturing)'));
    this.assertEqual('non-capturing', new RegExp(RegExp.escape('(?:') + '([^)]+)').exec('(?:non-capturing)')[1]);
    
    this.assertEqual('\\(\\?\\=positive-lookahead\\)', RegExp.escape('(?=positive-lookahead)'));
    this.assertEqual('positive-lookahead', new RegExp(RegExp.escape('(?=') + '([^)]+)').exec('(?=positive-lookahead)')[1]);
    
    this.assertEqual('\\(\\?<\\=positive-lookbehind\\)', RegExp.escape('(?<=positive-lookbehind)'));
    this.assertEqual('positive-lookbehind', new RegExp(RegExp.escape('(?<=') + '([^)]+)').exec('(?<=positive-lookbehind)')[1]);
    
    this.assertEqual('\\(\\?\\!negative-lookahead\\)', RegExp.escape('(?!negative-lookahead)'));
    this.assertEqual('negative-lookahead', new RegExp(RegExp.escape('(?!') + '([^)]+)').exec('(?!negative-lookahead)')[1]);
    
    this.assertEqual('\\(\\?<\\!negative-lookbehind\\)', RegExp.escape('(?<!negative-lookbehind)'));
    this.assertEqual('negative-lookbehind', new RegExp(RegExp.escape('(?<!') + '([^)]+)').exec('(?<!negative-lookbehind)')[1]);
    
    this.assertEqual('\\[\\\\w\\]\\+', RegExp.escape('[\\w]+'));
    this.assertEqual('character class', new RegExp(RegExp.escape('[') + '([^\\]]+)').exec('[character class]')[1]);      
    
    this.assertEqual('<div>', new RegExp(RegExp.escape('<div>')).exec('<td><div></td>')[0]);      
    
    this.assertEqual('false', RegExp.escape(false));
    this.assertEqual('undefined', RegExp.escape());
    this.assertEqual('null', RegExp.escape(null));
    this.assertEqual('42', RegExp.escape(42));
    
    this.assertEqual('\\\\n\\\\r\\\\t', RegExp.escape('\\n\\r\\t'));
    this.assertEqual('\n\r\t', RegExp.escape('\n\r\t'));
    this.assertEqual('\\{5,2\\}', RegExp.escape('{5,2}'));
    
    this.assertEqual(
      '\\/\\(\\[\\.\\*\\+\\?\\^\\=\\!\\:\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\\/\\\\\\\\\\]\\)\\/g',
      RegExp.escape('/([.*+?^=!:${}()|[\\]\\/\\\\])/g')
    );
  },
  
  testBrowserDetection: function() {
    var results = Object.values(Fuse.Browser.Agent)
      .partition(function(agent){ return agent === true });
    var trues = results[0], falses = results[1];
    
    this.info('User agent string is: ' + navigator.userAgent);

    this.assert(trues.length === 0 || trues.length === 1, 
      'There should be only one or no browser detected.');
    
    // we should have definite trues or falses here
    trues.each(function(result) {
      this.assert(result === true);
    }, this);

    falses.each(function(result) {
      this.assert(result === false);
    }, this);
    
    if (navigator.userAgent.indexOf('AppleWebKit/') > -1) {
      this.info('Running on WebKit');
      this.assert(Fuse.Browser.Agent.WebKit);
    }

    if (!!window.opera) {
      this.info('Running on Opera');
      this.assert(Fuse.Browser.Agent.Opera);
    }
    
    if (!!(window.attachEvent && !window.opera)) {
      this.info('Running on IE');
      this.assert(Fuse.Browser.Agent.IE);
    }
    
    if (navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1) {
      this.info('Running on Gecko');
      this.assert(Fuse.Browser.Agent.Gecko);
    }
  },
  
  testClassCreate: function() { 
    this.assert(Object.isFunction(Fixtures.Animal), 'Fixtures.Animal is not a constructor');
    this.assertEnumEqual([Fixtures.Cat, Fixtures.Mouse, Fixtures.Dog, Fixtures.Ox], Fixtures.Animal.subclasses);
    Fixtures.Animal.subclasses.each(function(subclass) {
      this.assertEqual(Fixtures.Animal, subclass.superclass);
    }, this);

    var Bird = Class.create(Fixtures.Animal);
    this.assertEqual(Bird, Fixtures.Animal.subclasses.last());
    
    this.assertEnumEqual(Object.keys(new Fixtures.Animal).sort(), Object.keys(new Bird).sort());
    
    // Safari 3.1+ mistakes regular expressions as typeof `function`
    var klass = function() { }, regexp = /foo/;
    this.assertNothingRaised(function() {
      klass = Class.create(Fixtures.Animal, { '_regexp': regexp });
    }, 'Class creation failed when the subclass contains a regular expression as a property.');

    this.assertEqual(regexp, new klass()._regexp, 'The regexp property should exist.');
  },

  testClassInstantiation: function() { 
    var pet = new Fixtures.Animal("Nibbles");
    this.assertEqual("Nibbles", pet.name, "property not initialized");
    this.assertEqual('Nibbles: Hi!', pet.say('Hi!'));
    this.assertEqual(Fixtures.Animal, pet.constructor, "bad constructor reference");
    this.assertUndefined(pet.superclass);

    var Empty = Class.create();
    this.assert('object', typeof new Empty);
  },

  testConstructorExplicitReturn: function() {
    var $decorator = Class.create({
      initialize: function(element) {
        if (element.constructor === $decorator)
          return element;
        this.id = 'decorator_id_' + $decorator.idCounter++;
        this._element = $(element);
      }
    });

    $decorator.idCounter = 0;

    var decorated = new $decorator('test');
    this.assertEqual('decorator_id_0', decorated.id);
    this.assertEqual('decorator_id_0', new $decorator(decorated).id, 'Constructor is not returning a value.');
  },

  testInheritance: function() {
    var tom = new Fixtures.Cat('Tom');
    this.assertEqual(Fixtures.Cat, tom.constructor, "bad constructor reference");
    this.assertEqual(Fixtures.Animal, tom.constructor.superclass, 'bad superclass reference');
    this.assertEqual('Tom', tom.name);
    this.assertEqual('Tom: meow', tom.say('meow'));
    this.assertEqual('Tom: Yuk! I only eat mice.', tom.eat(new Fixtures.Animal));
  },

  testSuperclassMethodCall: function() {
    var tom = new Fixtures.Cat('Tom');
    this.assertEqual('Tom: Yum!', tom.eat(new Fixtures.Mouse));

    // augment the constructor and test
    var Dodo = Class.create(Fixtures.Animal, {
      initialize: function(name) {
        this._super(name);
        this.extinct = true;
      },
      
      say: function(message) {
        return this._super(message) + " honk honk";
      },
      
      speed: 4
    });

    var gonzo = new Dodo('Gonzo');
    this.assertEqual('Gonzo', gonzo.name);
    this.assert(gonzo.extinct, 'Dodo birds should be extinct');
    this.assertEqual("Gonzo: hello honk honk", gonzo.say("hello"));
    
    // test against super that is not a method
    var Twit = Class.create(Dodo, {
      initialize: function() { },
      speed: function() {
        if (this._super && !Object.isFunction(this._super))
          throw new TypeError;
      }
    });

    this.assertNothingRaised(function() { new Twit().speed() });
  },

  testClassAddMethods: function() {
    var tom   = new Fixtures.Cat('Tom');
    var jerry = new Fixtures.Mouse('Jerry');
    
    Fixtures.Animal.addMethods({
      sleep: function() {
        return this.say('ZZZ');
      }
    });
    
    Fixtures.Mouse.addMethods({
      sleep: function() {
        return this._super() + " ... no, can't sleep! Gotta steal cheese!";
      },
      escape: function(cat) {
        return this.say('(from a mousehole) Take that, ' + cat.name + '!');
      }
    });
    
    this.assertEqual('Tom: ZZZ', tom.sleep(), "added instance method not available to subclass");
    this.assertEqual("Jerry: ZZZ ... no, can't sleep! Gotta steal cheese!", jerry.sleep());
    this.assertEqual("Jerry: (from a mousehole) Take that, Tom!", jerry.escape(tom));
    // insure that a method has not propagated *up* the prototype chain:
    this.assertUndefined(tom.escape);
    this.assertUndefined(new Fixtures.Animal().escape);
    
    Fixtures.Animal.addMethods({
      sleep: function() {
        return this.say('zZzZ');
      }
    });
    
    this.assertEqual("Jerry: zZzZ ... no, can't sleep! Gotta steal cheese!", jerry.sleep());
  },
  
  testBaseClassWithMixin: function() {
    var grass = new Fixtures.Plant('grass', 3);
    this.assertRespondsTo('getValue', grass);      
    this.assertEqual('#<Plant: grass>', grass.inspect());
  },
  
  testSubclassWithMixin: function() {
    var snoopy = new Fixtures.Dog('Snoopy', 12, 'male');
    this.assertRespondsTo('reproduce', snoopy);      
  },
 
  testSubclassWithMixins: function() {
    var cow = new Fixtures.Ox('cow', 400, 'female');
    this.assertEqual('#<Ox: cow>', cow.inspect());
    this.assertRespondsTo('reproduce', cow);
    this.assertRespondsTo('getValue', cow);
  },
 
  testClassWithToStringAndValueOfMethods: function() {
    var Foo = Class.create({
      'toString': function() { return "toString" },
      'valueOf': function() { return "valueOf" }
    });
    
    var Parent = Class.create({
      'm1': function(){ return 'm1' },
      'm2': function(){ return 'm2' }
    });
    var Child = Class.create(Parent, {
      'm1': function() { return this._super() + ' child' },
      'm2': function() { return this._super() + ' child' }
    });
 
    if (Fuse.Browser.Feature('FUNCTION_TO_STRING_RETURNS_SOURCE'))
      this.assert(new Child().m1.toString().indexOf(' child') > -1);

    this.assertEqual('toString', new Foo().toString());
    this.assertEqual('valueOf',  new Foo().valueOf());
  }
});