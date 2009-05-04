new Test.Unit.Runner({

  'testObjectEach': function() {
    function klass() { this.toString = 1 }

    var count = 0;
    klass.prototype.toString = 0;
    Fuse.Object.each(new klass(), function() { count++ });
 
    this.assertEqual(1, count,
      'Failed to iterate correctly over the object properties');
  },

  'testSimpleObjectExtend': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    // test empty/null/undefined sources
    this.assertIdentical(object, Fuse.Object._extend(object),
      'Failed when passing no source.');

    this.assertIdentical(object, Fuse.Object._extend(object, null),
      'Failed when passing a null source.');

    this.assertIdentical(object, Fuse.Object._extend(object, undef),
      'Failed when passing an undefined source.');

    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3] }, object);

    this.assertIdentical(object, Fuse.Object._extend(object, { 'bla': 123 }));
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': 123 }, object);
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': null },
      Fuse.Object._extend(object, { 'bla': null }));
  },

  'testObjectExtend': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    // test empty/null/undefined sources
    this.assertIdentical(object, Fuse.Object.extend(object),
      'Failed when passing no source.');

    this.assertIdentical(object, Fuse.Object.extend(object, null),
      'Failed when passing a null source.');

    this.assertIdentical(object, Fuse.Object.extend(object, undef),
      'Failed when passing an undefined source.');

    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3] }, object);

    this.assertIdentical(object, Fuse.Object.extend(object, { 'bla': 123 }));
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': 123 }, object);
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': null },
      Fuse.Object.extend(object, { 'bla': null }));

    // test shadowed `DontEnum` properties
    object = { 'foo': 'foo', 'bar': [1, 2, 3] };
    Fuse.Object.extend(object, { 'valueOf':  function() { return '[Awesome]' } });

    this.assertEqual('[Awesome]', object.valueOf(),
      'Failed to extend shadowed `DontEnum` properties.');
  },

  'testObjectToQueryString': function() {
    this.assertEqual('a=A&b=B&c=C&d=D%23',
      Fuse.Object.toQueryString({ 'a':'A', 'b':'B', 'c':'C', 'd':'D#' }));

    this.assertEqual('a=A&b=B&toString=bar&valueOf=',
      Fuse.Object.toQueryString(Fixtures.mixed_dont_enum));
  },

  'testObjectClone': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    this.assertNotIdentical(object, Fuse.Object.clone(object));
    this.assertHashEqual(object, Fuse.Object.clone(object));

    // test empty/null/undefined objects
    this.assertHashEqual({ }, Fuse.Object.clone(),
      'Failed when passing no value.');

    this.assertHashEqual({ }, Fuse.Object.clone(null),
      'Failed when passing a null value.');

    this.assertHashEqual({ }, Fuse.Object.clone(undef),
      'Failed when passing an undefined value.');

    var clone = Fuse.Object.clone(object);
    delete clone.bar;

    this.assertHashEqual({ 'foo': 'foo' }, clone,
      'Optimizing Fuse.Object.clone perf using prototyping doesn\'t allow properties to be deleted.');
  },

  'testObjectInspect': function() {
    this.assertEqual('undefined', Fuse.Object.inspect());
    this.assertEqual('undefined', Fuse.Object.inspect(undef));
    this.assertEqual('null',      Fuse.Object.inspect(null));
    this.assertEqual('[]',        Fuse.Object.inspect([]));

    this.assertEqual("'foo\\\\b\\\'ar'",  Fuse.Object.inspect('foo\\b\'ar'));
    this.assertNothingRaised(function() { Fuse.Object.inspect(window.Node) });

    // test Object object
    this.assertEqual("{'a': 'A', 'b': 'B', 'c': 'C'}",
      Fuse.Object.inspect({ 'a': 'A', 'b': 'B', 'c': 'C' }), 'Object object');
  },

  'testObjectToHTML': function() {
    this.assertEqual('',    Fuse.Object.toHTML());
    this.assertEqual('',    Fuse.Object.toHTML(''));
    this.assertEqual('',    Fuse.Object.toHTML(null));
    this.assertEqual('0',   Fuse.Object.toHTML(0));
    this.assertEqual('123', Fuse.Object.toHTML(123));

    this.assertEqual('hello world', Fuse.Object.toHTML('hello world'));

    this.assertEqual('hello world',
      Fuse.Object.toHTML({ 'toHTML': function() { return 'hello world' }}));
  },

  'testObjectIsArray': function() {
    this.assert(Fuse.List.isArray([]));
    this.assert(Fuse.List.isArray([0]));
    this.assert(Fuse.List.isArray([0, 1]));
    this.assert(Fuse.List.isArray(Fuse.List()));
    this.assert(Fuse.List.isArray(Fuse.List(0)));
    this.assert(Fuse.List.isArray(Fuse.List(0, 1)));

    this.assert(!Fuse.List.isArray({ }));
    this.assert(!Fuse.List.isArray($('list').childNodes));
    this.assert(!Fuse.List.isArray());
    this.assert(!Fuse.List.isArray(''));
    this.assert(!Fuse.List.isArray('foo'));
    this.assert(!Fuse.List.isArray(0));
    this.assert(!Fuse.List.isArray(1));
    this.assert(!Fuse.List.isArray(null));
    this.assert(!Fuse.List.isArray(true));
    this.assert(!Fuse.List.isArray(false));
    this.assert(!Fuse.List.isArray(undef));
  },

  'testObjectIsHash': function() {
    this.assert(Fuse.Object.isHash($H()));
    this.assert(Fuse.Object.isHash(Fuse.Hash()));

    this.assert(!Fuse.Object.isHash({}));
    this.assert(!Fuse.Object.isHash(null));
    this.assert(!Fuse.Object.isHash());
    this.assert(!Fuse.Object.isHash(''));
    this.assert(!Fuse.Object.isHash(2));
    this.assert(!Fuse.Object.isHash(false));
    this.assert(!Fuse.Object.isHash(true));
    this.assert(!Fuse.Object.isHash([]));
    this.assert(!Fuse.Object.isHash(Fuse.Hash.prototype));

    // falsy variables should not mess up return value type
    this.assertIdentical(false, Fuse.Object.isHash(0));
    this.assertIdentical(false, Fuse.Object.isHash(''));
    this.assertIdentical(false, Fuse.Object.isHash(NaN));
    this.assertIdentical(false, Fuse.Object.isHash(null));
    this.assertIdentical(false, Fuse.Object.isHash(undef));
  },

  'testObjectIsElement': function() {
    this.assert(Fuse.Object.isElement(document.createElement('div')));
    this.assert(Fuse.Object.isElement(new Element('div')));
    this.assert(Fuse.Object.isElement($('testlog')));

    this.assert(!Fuse.Object.isElement(document.createTextNode('bla')));

    // falsy variables should not mess up return value type
    this.assertIdentical(false, Fuse.Object.isElement(0));
    this.assertIdentical(false, Fuse.Object.isElement(''));
    this.assertIdentical(false, Fuse.Object.isElement(NaN));
    this.assertIdentical(false, Fuse.Object.isElement(null));
    this.assertIdentical(false, Fuse.Object.isElement(undef));
  },

  'testObjectIsEmpty': function () {
    var klass = Fuse.Class({ 'foo': 1 }), instance = new klass;
    instance.foo = 1;

    this.assert(Fuse.Object.isEmpty({ }));
    this.assert(Fuse.Object.isEmpty([ ]));
    this.assert(Fuse.Object.isEmpty(new klass));
    this.assert(Fuse.Object.isEmpty(false));
    this.assert(Fuse.Object.isEmpty(true));
    this.assert(Fuse.Object.isEmpty(0));
    this.assert(Fuse.Object.isEmpty(null));
    this.assert(Fuse.Object.isEmpty(undef));

    this.assert(!Fuse.Object.isEmpty({ 'foo': 1 }));
    this.assert(!Fuse.Object.isEmpty(instance));
    this.assert(!Fuse.Object.isEmpty([1, 2, 3]));
  },

  'testObjectIsFunction': function() {
    this.assert(Fuse.Object.isFunction(function() { }));
    this.assert(Fuse.Object.isFunction(Fuse.Class()));

    this.assert(!Fuse.Object.isFunction(/foo/));
    this.assert(!Fuse.Object.isFunction('a string'));
    this.assert(!Fuse.Object.isFunction($('testlog')));
    this.assert(!Fuse.Object.isFunction([ ]));
    this.assert(!Fuse.Object.isFunction({ }));
    this.assert(!Fuse.Object.isFunction(0));
    this.assert(!Fuse.Object.isFunction(false));
    this.assert(!Fuse.Object.isFunction(undef));
  },

  'testObjectHasKey': function() {
    function A() { this.foo = 3 }
    A.prototype = { 'foo': 4 };

    function B() { this.foo = 2 }
    B.prototype = new A;

    function C() { this.foo = 1 }
    C.prototype = new B;

    var c = new C, empty = { }, properties = Fuse.List('constructor',
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
      'toString', 'valueOf');

    this.assert(Fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo as own property.');

    delete c.foo;

    this.assert(!Fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo as inherited property.');

    this.assertEqual(2, c.foo, 'Expected c.foo to equal 2');

    delete C.prototype.foo;

    this.assertEqual(3, c.foo,
      'Expected c.foo to equal 3 after deleting C.prototype.foo.');

    c.foo = undef;

    this.assert(Fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo, value set as undefined, as own property.');

    this.assert(!Fuse.Object.hasKey(C.prototype, 'foo'),
      'Expected C.prototype.foo as inherited property.');

    this.assertEqual(3, C.prototype.foo,
      'Expected C.prototype.foo to equal 3');

    C.prototype.foo = undef;

    this.assert(Fuse.Object.hasKey(A.prototype, 'foo',
      'Expected A.prototype.foo as own property.'));

    properties.each(function(property) {
      this.assert(!Fuse.Object.hasKey(empty, property),
        'Expected "' + property + '" as inherited property');

      // Safari 2 doesn't have many of the properties
      if (Object.prototype[property]) {
        this.assert(Fuse.Object.hasKey(Object.prototype, property),
          'Expected "' + property + '" as own property');
      }
    }, this);

    this.assert(!Fuse.Object.hasKey(0, 'toString'));
    this.assert(!Fuse.Object.hasKey('testing', 'valueOf'));

    // test null/undefined values
    this.assertRaise('TypeError', function() { Fuse.Object.hasKey(null,  '') });
    this.assertRaise('TypeError', function() { Fuse.Object.hasKey(undef, '') });

    // test window object
    this.assert(Fuse.Object.hasKey(window, 'Fuse'));
    this.assert(!Fuse.Object.hasKey(window, 'abc123xyz'));
  },

  'testObjectIsPrimitive': function() {
    this.assert(Fuse.Object.isPrimitive('a string'));
    this.assert(Fuse.Object.isPrimitive(5));
    this.assert(Fuse.Object.isPrimitive(0));
    this.assert(Fuse.Object.isPrimitive(false));
    this.assert(Fuse.Object.isPrimitive(true));
    this.assert(Fuse.Object.isPrimitive(null));
    this.assert(Fuse.Object.isPrimitive(undef));
    this.assert(Fuse.Object.isPrimitive(NaN));
    this.assert(Fuse.Object.isPrimitive(Infinity));

    this.assert(!Fuse.Object.isPrimitive(/foo/));
    this.assert(!Fuse.Object.isPrimitive(new Number(0)));
    this.assert(!Fuse.Object.isPrimitive(new String('a string')));
    this.assert(!Fuse.Object.isPrimitive(function() { }));
    this.assert(!Fuse.Object.isPrimitive(new Boolean(true)));
    this.assert(!Fuse.Object.isPrimitive([ ]));
    this.assert(!Fuse.Object.isPrimitive({ }));
    this.assert(!Fuse.Object.isPrimitive({ 'valueOf': 0 }));
    this.assert(!Fuse.Object.isPrimitive({ 'valueOf': 'a string' }));
  },

  'testObjectIsRegExp': function() {
    this.assert(Fuse.Object.isRegExp(/foo/));
    this.assert(Fuse.Object.isRegExp(new RegExp('foo')));

    this.assert(!Fuse.Object.isRegExp(alert));
    this.assert(!Fuse.Object.isRegExp(0));
    this.assert(!Fuse.Object.isRegExp(function() { }));
    this.assert(!Fuse.Object.isRegExp(' string'));
    this.assert(!Fuse.Object.isRegExp([ ]));
    this.assert(!Fuse.Object.isRegExp({ }));
    this.assert(!Fuse.Object.isRegExp({ 'valueOf': null }));
    this.assert(!Fuse.Object.isRegExp({ 'valueOf': /foo/ }));
    this.assert(!Fuse.Object.isRegExp(false));
    this.assert(!Fuse.Object.isRegExp(undef));
  },

  'testObjectIsSameOrigin': function() {
    var isSameOrigin = Fuse.Object.isSameOrigin,
     domain = 'www.example.com';

    this.assert(Fuse.Object.isSameOrigin(null), 'null');
    this.assert(Fuse.Object.isSameOrigin(), 'undefined');
    this.assert(Fuse.Object.isSameOrigin(''), 'empty string');

    this.assert(Fuse.Object.isSameOrigin('/foo/bar.html'), '/foo/bar.html');
    this.assert(Fuse.Object.isSameOrigin(window.location.href), window.location.href);
    this.assert(!Fuse.Object.isSameOrigin('http://example.com'), 'http://example.com');

    // test typecasting the url argument as a string
    this.assertNothingRaised(function() { Fuse.Object.isSameOrigin(window.location) }, 'Error casting url as a string');
    this.assert(Fuse.Object.isSameOrigin({ 'toString': function() { return window.location.href } }), 'Error casting url as a string');

    // simulate document.domain changes
    Fuse.Object.isSameOrigin = function(url) {
      var parts = String(url).match(/([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^/:$]+)(?:\:(\d+))?/);
      return Fuse.String.Plugin.endsWith.call(parts[2], domain);
    };

    this.assert(!Fuse.Object.isSameOrigin('http://sub.example.com'),
      'domain www.example.com allows http://sub.example.com');

    domain = 'example.com';
    this.assert(Fuse.Object.isSameOrigin('http://sub.example.com'),
      'domain example.com won\'t allow http://sub.example.com');

    Fuse.Object.isSameOrigin = isSameOrigin;
  },

  'testObjectIsString': function() {
    this.assert(Fuse.Object.isString('a string'));
    this.assert(Fuse.Object.isString(new String('a string')));

    this.assert(!Fuse.Object.isString(alert));
    this.assert(!Fuse.Object.isString(function() { }));
    this.assert(!Fuse.Object.isString(0));
    this.assert(!Fuse.Object.isString([ ]));
    this.assert(!Fuse.Object.isString({ }));
    this.assert(!Fuse.Object.isString({ 'valueOf': null }));
    this.assert(!Fuse.Object.isString({ 'valueOf': 3.1415926535 }));
    this.assert(!Fuse.Object.isString(false));
    this.assert(!Fuse.Object.isString(undef));
  },

  'testObjectIsNumber': function() {
    this.assert(Fuse.Object.isNumber(0));
    this.assert(Fuse.Object.isNumber(1.2));
    this.assert(Fuse.Object.isNumber(new Number(5)));

    this.assert(!Fuse.Object.isNumber(alert));
    this.assert(!Fuse.Object.isNumber(2.5E+345));
    this.assert(!Fuse.Object.isNumber(0/0));
    this.assert(!Fuse.Object.isNumber(function() { }));
    this.assert(!Fuse.Object.isNumber('a string'));
    this.assert(!Fuse.Object.isNumber([ ]));
    this.assert(!Fuse.Object.isNumber({ }));
    this.assert(!Fuse.Object.isNumber({ 'valueOf': null }));
    this.assert(!Fuse.Object.isNumber({ 'valueOf': 3.1415926535 }));
    this.assert(!Fuse.Object.isNumber(false));
    this.assert(!Fuse.Object.isNumber(undef));
  },

  'testObjectIsUndefined': function() {
    this.assert(Fuse.Object.isUndefined(undef));

    this.assert(!Fuse.Object.isUndefined(null));
    this.assert(!Fuse.Object.isUndefined(false));
    this.assert(!Fuse.Object.isUndefined(0));
    this.assert(!Fuse.Object.isUndefined(''));
    this.assert(!Fuse.Object.isUndefined(function() { }));
    this.assert(!Fuse.Object.isUndefined([]));
    this.assert(!Fuse.Object.isUndefined({}));
  },

  'testObjectKeys': function() {
    this.assertEnumEqual([],          Fuse.Object.keys({ }));
    this.assertEnumEqual([],          Fuse.Object.keys([ ]));
    this.assertEnumEqual(['a'],       Fuse.Object.keys({ 'a': 'A' }));
    this.assertEnumEqual($w('a b c'), Fuse.Object.keys({ 'a':'A', 'b':'B', 'c':'C' }).sort());

    // ensure functions work
    var result, foo = function() { this.a = 'a' };
    foo.prototype.b = 'b';
    foo.prop = 'blah';

    this.assertNothingRaised(function() { result = Fuse.Object.keys(foo) });
    this.assertEnumEqual(['prop', 'prototype'], result.sort());

    this.assertNothingRaised(function() { result = Fuse.Object.keys(new foo) });
    this.assertEnumEqual(['a'], result);

    // test objects containing shadowed properties
    this.assertEnumEqual($w('a b toString valueOf'),
      Fuse.Object.keys(Fixtures.mixed_dont_enum).sort());

    this.assertRaise('TypeError', function() { Fuse.Object.keys(null) });
    this.assertRaise('TypeError', function() { Fuse.Object.keys(3) });
  },

  'testObjectValues': function() {
    this.assertEnumEqual([],          Fuse.Object.values({ }));
    this.assertEnumEqual([],          Fuse.Object.values([ ]));
    this.assertEnumEqual(['A'],       Fuse.Object.values({ 'a': 'A' }));
    this.assertEnumEqual($w('A B C'), Fuse.Object.values({ 'a':'A', 'b':'B', 'c':'C' }).sort());

    var result = Fuse.Object.values(Fixtures.mixed_dont_enum);
    this.assert(result.length === 4 && result.sort().join('') == 'ABbar');

    this.assertRaise('TypeError', function() { Fuse.Object.values(null) });
    this.assertRaise('TypeError', function() { Fuse.Object.values(3) });
  },

  // sanity check
  'testDoesntExtendObjectFuse': function() {
    var iterations = 0, arr = [1, 2, 3], obj = { 'a': 1, 'b': 2, 'c': 3 };

    // for-in is supported with objects
    for (property in obj) iterations++;
    this.assertEqual(3, iterations);

    // for-in is not effected by Fuse.List.Plugin additions
    iterations = 0;
    for (property in arr) iterations++;
    this.assertEqual(3, iterations);
  }
});