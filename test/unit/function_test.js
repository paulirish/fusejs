new Test.Unit.Runner({

  'testFunctionArgumentNames': function() {
    function named1() { };
    function named2(one) { };
    function named3(one, two, three) { };
    function named4(/*foo*/ foo, /* bar */ bar, /*****/ baz) { }
    function named5(
      /*foo*/ foo,
      /**/bar,
      /* baz */ /* baz */ baz,
      // Skip a line just to screw with the regex...
      /* thud */ thud) { }

    var argumentNames = Fuse.Function.argumentNames;

    this.assertEnumEqual([],
      argumentNames(function() { }));

    this.assertEnumEqual(['one'],
      argumentNames(function(one) { }));
 
    this.assertEnumEqual(['one', 'two', 'three'],
      argumentNames(function(one, two, three) { }));

    this.assertEnumEqual(['one', 'two', 'three'],
      argumentNames(function(  one  , two
      , three   ) {}));

    this.assertEqual('$fuse', argumentNames(function($fuse) { }).first());

    this.assertEnumEqual([], argumentNames(named1));
    this.assertEnumEqual(['one'], argumentNames(named2));
    this.assertEnumEqual(['one', 'two', 'three'], argumentNames(named3));
    this.assertEnumEqual($w('foo bar baz'), argumentNames(named4));
    this.assertEnumEqual($w('foo bar baz thud'), argumentNames(named5));
  },

  'testFunctionBind': function() {
    function methodWithoutArguments() { return this.hi };
    function methodWithArguments() { return this.hi + ',' + $A(arguments).join(',') };

    var bind = Fuse.Function.bind, func = Fuse.emptyFunction;

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
    var bound =  bind(methodWithArguments, { 'hi': 'with' }, 'arg1', 'arg2');
    bound('arg3', 'arg4');
    this.assertEqual('with,arg1,arg2', bound());
  },

  'testFunctionBindAsEventListener': function() {
    var call, div, eventTest, i, tobj,
     bind = Fuse.Function.bind,
     bindAsEventListener = Fuse.Function.bindAsEventListener;

    for (i = 0; i < 10; ++i) {
      div = document.createElement('div');
      div.id = 'test-' + i;
      document.body.appendChild(div);

      tobj = new TestObj();
      eventTest = { 'test': true };

      call = bindAsEventListener(tobj.assertingEventHandler, tobj,
        bind(this.assertEqual, this, eventTest),
        bind(this.assertEqual, this, arg1),
        bind(this.assertEqual, this, arg2),
        bind(this.assertEqual, this, arg3),
        arg1, arg2, arg3);

      call(eventTest);
    }
  },

  'testFunctionCurry': function() {
    function split(delimiter, string) { return string.split(delimiter) };
    function methodWithArguments()    { return $A(arguments).join(',') };

    var curry = Fuse.Function.curry,
     splitOnColons = curry(split, ':'),
     curried = curry(methodWithArguments, 'arg1');

    this.assertNotIdentical(split, splitOnColons);
    this.assertEnumEqual(split(':', '0:1:2:3:4:5'), splitOnColons('0:1:2:3:4:5'));
    this.assertIdentical(split, curry(split));

    // ensure private arg array is reset
    curried('arg2', 'arg3');
    this.assertEqual('arg1', curried());
  },

  'testFunctionDelay': function() {
    function delayedFunction() { window.delayed = true; };
    function delayedFunctionWithArgs() { window.delayedWithArgs = $A(arguments).join(' '); };

    var delay = Fuse.Function.delay;
    window.delayed = undef;

    delay(delayedFunction, 0.8);
    delay(delayedFunctionWithArgs, 0.8, 'hello', 'world');

    this.assertUndefined(window.delayed);

    this.wait(1000, function() {
      this.assert(window.delayed);
      this.assertEqual('hello world', window.delayedWithArgs);
    });
  },

  'testFunctionWrap': function() {
    function sayHello() { return 'hello world' }

    var wrap = Fuse.Function.wrap;
    this.assertEqual('HELLO WORLD', wrap(sayHello, function(proceed) {
      return proceed().toUpperCase();
    })());

    var temp = Fuse.String.Plugin.capitalize;
    Fuse.String.Plugin.capitalize = wrap(
      Fuse.String.Plugin.capitalize,
      function(proceed, eachWord) {
        if (eachWord && this.contains(' '))
          return this.split(' ').map(function(str){ return str.capitalize() }).join(' ');
        return proceed();
    });

    this.assertEqual('Hello world', Fuse.String('hello world').capitalize());
    this.assertEqual('Hello World', Fuse.String('hello world').capitalize(true));
    this.assertEqual('Hello',       Fuse.String('hello').capitalize());

    Fuse.String.Plugin.capitalize = temp;
  },

  'testFunctionDefer': function() {
    function deferredFunction() { window.deferred = true }

    var defer = Fuse.Function.defer;
    window.deferred = undef;

    defer(deferredFunction);
    this.assertUndefined(window.deferred);

    this.wait(50, function() {
      function deferredFunction2(arg) { window.deferredValue = arg };

      this.assert(window.deferred);
      window.deferredValue = 0;

      defer(deferredFunction2, 'test');
      this.wait(50, function() {
        this.assertEqual('test', window.deferredValue);
      });
    });
  },

  'testFunctionMethodize': function() {
    var methodize = Fuse.Function.methodize;

    var Foo = { 'bar': function(baz) { return baz } };
    var baz = { 'quux': methodize(Foo.bar) };

    this.assertEqual(methodize(Foo.bar), baz.quux);
    this.assertEqual(baz, Foo.bar(baz));
    this.assertEqual(baz, baz.quux());
  }
});