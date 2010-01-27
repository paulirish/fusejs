new Test.Unit.Runner({

  'testFunctionBind': function() {
    function methodWithoutArguments() { return this.hi };
    function methodWithArguments() { return this.hi + ',' + $A(arguments).join(',') };

    var bind = fuse.Function.bind, func = fuse.emptyFunction;

    this.assertIdentical(func, bind(func));
    this.assertIdentical(func, bind(func, undef));
    this.assertNotIdentical(func, bind(func, null));

    this.assertEqual('without',
      bind(methodWithoutArguments, { 'hi': 'without' })());

    this.assertEqual('with,arg1,arg2',
      bind(methodWithArguments, { 'hi': 'with' })('arg1','arg2'));

    this.assertEqual('withBindArgs,arg1,arg2',
       bind(methodWithArguments, { 'hi': 'withBindArgs' }, 'arg1', 'arg2')());

    this.assertEqual('withBindArgsAndArgs,arg1,arg2,arg3,arg4',
       bind(methodWithArguments, { 'hi': 'withBindArgsAndArgs' }, 'arg1', 'arg2')('arg3', 'arg4'));

    // ensure private arg array is reset
    var bound =  bind(methodWithArguments, { 'hi': 'withBindArgs' }, 'arg1', 'arg2');
    bound('arg3', 'arg4');
    this.assertEqual('withBindArgs,arg1,arg2', bound());

    // test lazy defined syntax support
    var lazy = { 'test': function() { return 'old' } };
    bound = bind(['test', lazy], { 'hi': 'withBindArgsAndArgs' }, 'arg1', 'arg2');
    lazy.test = methodWithArguments;

    this.assertEqual('withBindArgsAndArgs,arg1,arg2,arg3,arg4',
      bound('arg3', 'arg4'), 'lazy defined method');
    },

  'testFunctionBindAsEventListener': function() {
    var bind = fuse.Function.bind,
     bindAsEventListener = fuse.Function.bindAsEventListener;

    var tobj = new TestObj();
    var eventTest = { 'test': true };

    var call = bindAsEventListener(tobj.assertingEventHandler, tobj,
      bind(this.assertEqual, this, eventTest),
      bind(this.assertEqual, this, arg1),
      bind(this.assertEqual, this, arg2),
      bind(this.assertEqual, this, arg3),
      arg1, arg2, arg3);

    call(eventTest);

    var lazy = {
      'test': bind(function() { 
        this.assert(false, 'lazy bindAsEventListener');
      }, this)
    };

    var bound = bindAsEventListener(['test', lazy], this, 'arg1', 'arg2');
    lazy.test = function(event, arg1, arg2) {
      this.assert(event);
      this.assertEqual('arg1', arg1);
      this.assertEqual('arg2', arg2);
    };

    bound(true);
  },

  'testFunctionCurry': function() {
    function split(delimiter, string) { return string.split(delimiter) };
    function methodWithArguments()    { return $A(arguments).join(',') };

    var curry = fuse.Function.curry,
     splitOnColons = curry(split, ':'),
     curried = curry(methodWithArguments, 'arg1');

    this.assertNotIdentical(split, splitOnColons);
    this.assertEnumEqual(split(':', '0:1:2:3:4:5'), splitOnColons('0:1:2:3:4:5'));
    this.assertIdentical(split, curry(split));

    // ensure private arg array is reset
    curried('arg2', 'arg3');
    this.assertEqual('arg1', curried());

    // test lazy defined syntax support
    var lazy = { 'test': function() { return 'old' } };
    curried = curry(['test', lazy], 'arg1', 'arg2');
    lazy.test = methodWithArguments;

    this.assertEqual('arg1,arg2,arg3,arg4',
      curried('arg3', 'arg4'), 'lazy defined method');
  },

  'testFunctionDelay': function() {
    function delayedFunction() { window.delayed = true };
    function delayedFunctionWithArgs() { window.delayedWithArgs = $A(arguments).join(' ') };
    function lazyDelayedFunctionWithArgs() { window.lazyDelayed = $A(arguments).join(' ') };

    var delay = fuse.Function.delay;
    window.delayed = window.lazyDelayed = undef;

    delay(delayedFunction, 0.8);
    delay(delayedFunctionWithArgs, 0.8, 'hello', 'world');

    // test lazy defined syntax support
    var lazy = { 'test': function() { window.lazyDelayed = 'old' } };
    delay(['test', lazy], 0.8, 'lazy', 'delayed');
    lazy.test = lazyDelayedFunctionWithArgs;

    // still undefined after calling delay
    this.assertUndefined(window.delayed);
    this.assertUndefined(window.lazyDelayed);

    this.wait(1000, function() {
      this.assert(window.delayed,
        'with no arguments');

      this.assertEqual('hello world', window.delayedWithArgs,
        'with arguments');

      this.assertEqual('lazy delayed', lazyDelayed,
        'lazy defined method');
    });
  },

  'testFunctionWrap': function() {
    function sayHello() { return 'hello world' }

    var wrap = fuse.Function.wrap;
    this.assertEqual('HELLO WORLD', wrap(sayHello, function(proceed) {
      return proceed().toUpperCase();
    })());

    var temp = fuse.String.plugin.capitalize;
    fuse.String.plugin.capitalize = wrap(
      fuse.String.plugin.capitalize,
      function(proceed, eachWord) {
        if (eachWord && this.contains(' '))
          return this.split(' ').map(function(str){ return str.capitalize() }).join(' ');
        return proceed();
    });

    this.assertEqual('Hello world', fuse.String('hello world').capitalize());
    this.assertEqual('Hello World', fuse.String('hello world').capitalize(true));
    this.assertEqual('Hello',       fuse.String('hello').capitalize());

    fuse.String.plugin.capitalize = temp;

    // test lazy defined syntax support
    var lazy = { 'test': function() { window.lazyDelayed = 'old' } };
    var wrapped = wrap(['test', lazy], function(proceed) {
      return proceed().toUpperCase();
    });

    lazy.test = sayHello;
    this.assertEqual('HELLO WORLD', wrapped(), 'lazy defined method');
  },

  'testFunctionDefer': function() {
    function deferredFunction() { window.deferred = true }
    function deferredFunctionWithArgs() { window.deferredWithArgs = $A(arguments).join(' ') };
    function lazyDefferedFunctionWithArgs() { window.lazyDeffered = $A(arguments).join(' ') };

    var defer = fuse.Function.defer;
    window.deferred = window.lazyDeferred = undef;

    defer(deferredFunction);

    // test lazy defined syntax support
    var lazy = { 'test': function() { window.lazyDeferred = 'old' } };
    defer(['test', lazy], 0.8, 'lazy', 'deffered');
    lazy.test = lazyDefferedFunctionWithArgs;

    // still undefined after calling defer
    this.assertUndefined(window.deferred);
    this.assertUndefined(window.lazyDeferred);

    this.wait(50, function() {
      function deferredFunction2(arg) { window.deferredValue = arg };

      this.assert(window.deferred,
        'with no arguments');

      this.assertEqual('lazy delayed', lazyDelayed,
        'lazy defined method');

      window.deferredValue = 0;

      defer(deferredFunction2, 'test');
      this.wait(50, function() {
        this.assertEqual('test', window.deferredValue);
      });
    });
  },

  'testFunctionMethodize': function() {
    var methodize = fuse.Function.methodize;

    var Foo = { 'bar': function(baz) { return baz } };
    var baz = { 'quux': methodize(Foo.bar) };

    this.assertEqual(baz.quux, methodize(Foo.bar));
    this.assertEqual(baz, Foo.bar(baz));
    this.assertEqual(baz, baz.quux());

    // test lazy defined syntax support
    var lazy = { 'test': function() { return 'old' } };
    lazy.methodized = methodize(['test', lazy]);
    lazy.test = fuse.K;

    this.assertEqual(lazy, lazy.methodized(), 'lazy defined method');
  }
});