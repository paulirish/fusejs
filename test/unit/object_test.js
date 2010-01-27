new Test.Unit.Runner({

  'testObjectConstructorAsMethod': function() {
    this.assertRespondsTo('max', fuse.Object([0, 1]),
      'convert array to fuse.Array');

    this.assertRespondsTo('floor', fuse.Object(22.8),
      'convert primitive number to fuse.Number');

    this.assertRespondsTo('floor', fuse.Object(Number(22.8)),
      'convert number object to fuse.Number');

    this.assertRespondsTo('capitalize', fuse.Object('x'),
      'convert primitive string to fuse.String');

    this.assertRespondsTo('capitalize', fuse.Object(String('x')),
      'convert string object to fuse.String');
  },

  'testObjectEach': function() {
    function klass() { this.toString = 1 }

    var count = 0;
    klass.prototype.toString = 0;
    fuse.Object.each(new klass(), function() { count++ });

    this.assertEqual(1, count,
      'Failed to iterate correctly over the object properties');
  },

  'testSimpleObjectExtend': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    // test empty/null/undefined sources
    this.assertIdentical(object, fuse.Object._extend(object),
      'Failed when passing no source.');

    this.assertIdentical(object, fuse.Object._extend(object, null),
      'Failed when passing a null source.');

    this.assertIdentical(object, fuse.Object._extend(object, undef),
      'Failed when passing an undefined source.');

    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3] }, object);

    this.assertIdentical(object, fuse.Object._extend(object, { 'bla': 123 }));
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': 123 }, object);
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': null },
      fuse.Object._extend(object, { 'bla': null }));
  },

  'testObjectExtend': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    // test empty/null/undefined sources
    this.assertIdentical(object, fuse.Object.extend(object),
      'Failed when passing no source.');

    this.assertIdentical(object, fuse.Object.extend(object, null),
      'Failed when passing a null source.');

    this.assertIdentical(object, fuse.Object.extend(object, undef),
      'Failed when passing an undefined source.');

    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3] }, object);

    this.assertIdentical(object, fuse.Object.extend(object, { 'bla': 123 }));
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': 123 }, object);
    this.assertHashEqual({ 'foo': 'foo', 'bar': [1, 2, 3], 'bla': null },
      fuse.Object.extend(object, { 'bla': null }));

    // test shadowed `DontEnum` properties
    object = { 'foo': 'foo', 'bar': [1, 2, 3] };
    fuse.Object.extend(object, { 'valueOf':  function() { return '[Awesome]' } });

    this.assertEqual('[Awesome]', object.valueOf(),
      'Failed to extend shadowed `DontEnum` properties.');
  },

  'testObjectToQueryString': function() {
    this.assertEqual('a=A&b=B&c=C&d=D%23',
      fuse.Object.toQueryString({ 'a':'A', 'b':'B', 'c':'C', 'd':'D#' }),
      'Failed with simple object');

    this.assertEqual('a=A&b=B&toString=bar&valueOf=',
      fuse.Object.toQueryString(Fixtures.mixed_dont_enum),
      'Failed to enumerate over shadowed properties like `toString` and `valueOf`');

    this.assertEqual('0=a&1=b&2=c',
      fuse.Object.toQueryString(fuse.Array('a', 'b', 'c')),
      'Enumerated over inherited properties');
  },

  'testObjectClone': function() {
    var object = { 'foo': 'foo', 'bar': [1, 2, 3] };

    this.assertNotIdentical(object, fuse.Object.clone(object));
    this.assertHashEqual(object, fuse.Object.clone(object));

    // test empty/null/undefined objects
    this.assertHashEqual({ }, fuse.Object.clone(),
      'Failed when passing no value.');

    this.assertHashEqual({ }, fuse.Object.clone(null),
      'Failed when passing a null value.');

    this.assertHashEqual({ }, fuse.Object.clone(undef),
      'Failed when passing an undefined value.');

    var clone = fuse.Object.clone(object);
    delete clone.bar;

    this.assertHashEqual({ 'foo': 'foo' }, clone,
      'Optimizing fuse.Object.clone perf using prototyping doesn\'t allow properties to be deleted.');

    this.assertEqual('custom',
      fuse.Object.clone({ 'clone': function() { return 'custom' } }),
      'Custom clone method on object.');
  },

  'testObjectToHTML': function() {
    this.assertEqual('',    fuse.Object.toHTML());
    this.assertEqual('',    fuse.Object.toHTML(''));
    this.assertEqual('',    fuse.Object.toHTML(null));
    this.assertEqual('0',   fuse.Object.toHTML(0));
    this.assertEqual('123', fuse.Object.toHTML(123));

    this.assertEqual('hello world', fuse.Object.toHTML('hello world'));

    this.assertEqual('hello world',
      fuse.Object.toHTML({ 'toHTML': function() { return 'hello world' }}));
  },

  'testObjectIsArray': function() {
    this.assert(fuse.Array.isArray([]));
    this.assert(fuse.Array.isArray([0]));
    this.assert(fuse.Array.isArray([0, 1]));
    this.assert(fuse.Array.isArray(fuse.Array()));
    this.assert(fuse.Array.isArray(fuse.Array(0)));
    this.assert(fuse.Array.isArray(fuse.Array(0, 1)));

    this.assert(!fuse.Array.isArray({ }));
    this.assert(!fuse.Array.isArray($('list').childNodes));
    this.assert(!fuse.Array.isArray());
    this.assert(!fuse.Array.isArray(''));
    this.assert(!fuse.Array.isArray('foo'));
    this.assert(!fuse.Array.isArray(0));
    this.assert(!fuse.Array.isArray(1));
    this.assert(!fuse.Array.isArray(null));
    this.assert(!fuse.Array.isArray(true));
    this.assert(!fuse.Array.isArray(false));
    this.assert(!fuse.Array.isArray(undef));
  },

  'testObjectIsHash': function() {
    this.assertIdentical(true, fuse.Object.isHash($H()));
    this.assertIdentical(true, fuse.Object.isHash(fuse.Hash()));

    this.assertIdentical(false, fuse.Object.isHash({}));
    this.assertIdentical(false, fuse.Object.isHash(null));
    this.assertIdentical(false, fuse.Object.isHash());
    this.assertIdentical(false, fuse.Object.isHash(''));
    this.assertIdentical(false, fuse.Object.isHash(2));
    this.assertIdentical(false, fuse.Object.isHash(false));
    this.assertIdentical(false, fuse.Object.isHash(true));
    this.assertIdentical(false, fuse.Object.isHash([]));
    this.assertIdentical(false, fuse.Object.isHash(fuse.Hash.prototype));

    // falsy variables should not mess up return value type
    this.assertIdentical(false, fuse.Object.isHash(0));
    this.assertIdentical(false, fuse.Object.isHash(''));
    this.assertIdentical(false, fuse.Object.isHash(NaN));
    this.assertIdentical(false, fuse.Object.isHash(null));
    this.assertIdentical(false, fuse.Object.isHash(undef));
  },

  'testObjectIsElement': function() {
    this.assert(fuse.Object.isElement(document.createElement('div')));
    this.assert(fuse.Object.isElement(fuse.dom.Element('div').raw));
    this.assert(fuse.Object.isElement($('testlog').raw));

    this.assert(!fuse.Object.isElement(document.createTextNode('bla')));

    // falsy variables should not mess up return value type
    this.assertIdentical(false, fuse.Object.isElement(0));
    this.assertIdentical(false, fuse.Object.isElement(''));
    this.assertIdentical(false, fuse.Object.isElement(NaN));
    this.assertIdentical(false, fuse.Object.isElement(null));
    this.assertIdentical(false, fuse.Object.isElement(undef));
  },

  'testObjectIsEmpty': function () {
    var klass = fuse.Class({ 'foo': 1 }), instance = new klass;
    instance.foo = 1;

    this.assert(fuse.Object.isEmpty({ }));
    this.assert(fuse.Object.isEmpty([ ]));
    this.assert(fuse.Object.isEmpty(new klass));
    this.assert(fuse.Object.isEmpty(false));
    this.assert(fuse.Object.isEmpty(true));
    this.assert(fuse.Object.isEmpty(0));
    this.assert(fuse.Object.isEmpty(null));
    this.assert(fuse.Object.isEmpty(undef));

    this.assert(!fuse.Object.isEmpty({ 'foo': 1 }));
    this.assert(!fuse.Object.isEmpty(instance));
    this.assert(!fuse.Object.isEmpty([1, 2, 3]));
  },

  'testObjectIsFunction': function() {
    this.assert(fuse.Object.isFunction(function() { }));
    this.assert(fuse.Object.isFunction(fuse.Class()));

    this.assert(!fuse.Object.isFunction(/foo/));
    this.assert(!fuse.Object.isFunction('a string'));
    this.assert(!fuse.Object.isFunction($('testlog')));
    this.assert(!fuse.Object.isFunction([ ]));
    this.assert(!fuse.Object.isFunction({ }));
    this.assert(!fuse.Object.isFunction(0));
    this.assert(!fuse.Object.isFunction(false));
    this.assert(!fuse.Object.isFunction(undef));
  },

  'testObjectHasKey': function() {
    function A() { this.foo = 3 }
    A.prototype = { 'foo': 4 };

    function B() { this.foo = 2 }
    B.prototype = new A;

    function C() { this.foo = 1 }
    C.prototype = new B;

    var c = new C, empty = { }, properties = fuse.Array('constructor',
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
      'toString', 'valueOf');

    this.assert(fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo as own property.');

    delete c.foo;

    this.assert(!fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo as inherited property.');

    this.assertEqual(2, c.foo, 'Expected c.foo to equal 2');

    delete C.prototype.foo;

    this.assertEqual(3, c.foo,
      'Expected c.foo to equal 3 after deleting C.prototype.foo.');

    c.foo = undef;

    this.assert(fuse.Object.hasKey(c, 'foo'),
      'Expected c.foo, value set as undefined, as own property.');

    this.assert(!fuse.Object.hasKey(C.prototype, 'foo'),
      'Expected C.prototype.foo as inherited property.');

    this.assertEqual(3, C.prototype.foo,
      'Expected C.prototype.foo to equal 3');

    C.prototype.foo = undef;

    this.assert(fuse.Object.hasKey(A.prototype, 'foo',
      'Expected A.prototype.foo as own property.'));

    properties.each(function(property) {
      this.assert(!fuse.Object.hasKey(empty, property),
        'Expected "' + property + '" as inherited property');

      // Safari 2 doesn't have many of the properties
      if (Object.prototype[property]) {
        this.assert(fuse.Object.hasKey(Object.prototype, property),
          'Expected "' + property + '" as own property');
      }
    }, this);

    this.assert(!fuse.Object.hasKey(0, 'toString'));
    this.assert(!fuse.Object.hasKey('testing', 'valueOf'));

    // test null/undefined values
    this.assertRaise('TypeError', function() { fuse.Object.hasKey(null,  '') });
    this.assertRaise('TypeError', function() { fuse.Object.hasKey(undef, '') });

    // test window object
    this.assert(fuse.Object.hasKey(window, 'fuse'));
    this.assert(!fuse.Object.hasKey(window, 'abc123xyz'));
  },

  'testObjectIsPrimitive': function() {
    this.assert(fuse.Object.isPrimitive('a string'));
    this.assert(fuse.Object.isPrimitive(5));
    this.assert(fuse.Object.isPrimitive(0));
    this.assert(fuse.Object.isPrimitive(false));
    this.assert(fuse.Object.isPrimitive(true));
    this.assert(fuse.Object.isPrimitive(null));
    this.assert(fuse.Object.isPrimitive(undef));
    this.assert(fuse.Object.isPrimitive(NaN));
    this.assert(fuse.Object.isPrimitive(Infinity));

    this.assert(!fuse.Object.isPrimitive(/foo/));
    this.assert(!fuse.Object.isPrimitive(new Number(0)));
    this.assert(!fuse.Object.isPrimitive(new String('a string')));
    this.assert(!fuse.Object.isPrimitive(function() { }));
    this.assert(!fuse.Object.isPrimitive(new Boolean(true)));
    this.assert(!fuse.Object.isPrimitive([ ]));
    this.assert(!fuse.Object.isPrimitive({ }));
    this.assert(!fuse.Object.isPrimitive({ 'valueOf': 0 }));
    this.assert(!fuse.Object.isPrimitive({ 'valueOf': 'a string' }));
  },

  'testObjectIsRegExp': function() {
    this.assert(fuse.Object.isRegExp(/foo/));
    this.assert(fuse.Object.isRegExp(new RegExp('foo')));

    this.assert(!fuse.Object.isRegExp(alert));
    this.assert(!fuse.Object.isRegExp(0));
    this.assert(!fuse.Object.isRegExp(function() { }));
    this.assert(!fuse.Object.isRegExp(' string'));
    this.assert(!fuse.Object.isRegExp([ ]));
    this.assert(!fuse.Object.isRegExp({ }));
    this.assert(!fuse.Object.isRegExp({ 'valueOf': null }));
    this.assert(!fuse.Object.isRegExp({ 'valueOf': /foo/ }));
    this.assert(!fuse.Object.isRegExp(false));
    this.assert(!fuse.Object.isRegExp(undef));
  },

  'testObjectIsSameOrigin': function() {
    this.assert(fuse.Object.isSameOrigin(null), 'null');
    this.assert(fuse.Object.isSameOrigin(), 'undefined');
    this.assert(fuse.Object.isSameOrigin(''), 'empty string');

    this.assert(fuse.Object.isSameOrigin('/foo/bar.html'), '/foo/bar.html');
    this.assert(fuse.Object.isSameOrigin(window.location.href), window.location.href);
    this.assert(!fuse.Object.isSameOrigin('http://example.com'), 'http://example.com');

    // test typecasting the url argument as a string
    this.assertNothingRaised(
      function() { fuse.Object.isSameOrigin(window.location) },
      'Error casting url as a string');

    this.assert(fuse.Object.isSameOrigin(
      { 'toString': function() { return window.location.href } }),
      'Error casting url as a string');


    // simulate document.domain changes
    var isSameOrigin = fuse.Object.isSameOrigin,
     docDomain       = 'www.example.com',
     port            = 80,
     protocol        = 'http:';

    // redefine method (not pretty but it gets the job done)
    fuse.Object.isSameOrigin = function(url) {
      var domainIndex, urlDomain,
       result       = true,
       defaultPort  = protocol === 'ftp:' ? 21 : protocol === 'https:' ? 443 : 80,
       parts        = String(url).match(/([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/) || [];

      if (parts[0]) {
        urlDomain = parts[2];
        domainIndex = urlDomain.indexOf(docDomain);
        result = parts[1] === protocol &&
          (!domainIndex || urlDomain.charAt(domainIndex -1) == '.') &&
            (parts[3] || defaultPort) === (port || defaultPort);
      }
      return result;
    };

    this.assert(!fuse.Object.isSameOrigin('http://sub.example.com'),
      'domain www.example.com shouldn\'t allow http://sub.example.com');

    docDomain = 'example.com';
    this.assert(fuse.Object.isSameOrigin('http://sub.example.com'),
      'domain example.com won\'t allow http://sub.example.com');

    this.assert(!fuse.Object.isSameOrigin('http://www.prefix-example.com'),
      'domain example.com shouldn\'t allow http://www.prefix-example.com');

    fuse.Object.isSameOrigin = isSameOrigin;
  },

  'testObjectIsString': function() {
    this.assert(fuse.Object.isString('a string'));
    this.assert(fuse.Object.isString(new String('a string')));

    this.assert(!fuse.Object.isString(alert));
    this.assert(!fuse.Object.isString(function() { }));
    this.assert(!fuse.Object.isString(0));
    this.assert(!fuse.Object.isString([ ]));
    this.assert(!fuse.Object.isString({ }));
    this.assert(!fuse.Object.isString({ 'valueOf': null }));
    this.assert(!fuse.Object.isString({ 'valueOf': 3.1415926535 }));
    this.assert(!fuse.Object.isString(false));
    this.assert(!fuse.Object.isString(undef));
  },

  'testObjectIsNumber': function() {
    this.assert(fuse.Object.isNumber(0));
    this.assert(fuse.Object.isNumber(1.2));
    this.assert(fuse.Object.isNumber(new Number(5)));

    this.assert(!fuse.Object.isNumber(alert));
    this.assert(!fuse.Object.isNumber(2.5E+345));
    this.assert(!fuse.Object.isNumber(0/0));
    this.assert(!fuse.Object.isNumber(function() { }));
    this.assert(!fuse.Object.isNumber('a string'));
    this.assert(!fuse.Object.isNumber([ ]));
    this.assert(!fuse.Object.isNumber({ }));
    this.assert(!fuse.Object.isNumber({ 'valueOf': null }));
    this.assert(!fuse.Object.isNumber({ 'valueOf': 3.1415926535 }));
    this.assert(!fuse.Object.isNumber(false));
    this.assert(!fuse.Object.isNumber(undef));
  },

  'testObjectIsUndefined': function() {
    this.assert(fuse.Object.isUndefined(undef));

    this.assert(!fuse.Object.isUndefined(null));
    this.assert(!fuse.Object.isUndefined(false));
    this.assert(!fuse.Object.isUndefined(0));
    this.assert(!fuse.Object.isUndefined(''));
    this.assert(!fuse.Object.isUndefined(function() { }));
    this.assert(!fuse.Object.isUndefined([]));
    this.assert(!fuse.Object.isUndefined({}));
  },

  'testObjectKeys': function() {
    this.assertEnumEqual([],          fuse.Object.keys({ }));
    this.assertEnumEqual([],          fuse.Object.keys([ ]));
    this.assertEnumEqual(['a'],       fuse.Object.keys({ 'a': 'A' }));
    this.assertEnumEqual($w('a b c'), fuse.Object.keys({ 'a':'A', 'b':'B', 'c':'C' }).sort());

    // ensure functions work
    var result, foo = function() { this.a = 'a' };
    foo.prototype.b = 'b';
    foo.prop = 'blah';

    this.assertNothingRaised(function() { result = fuse.Object.keys(foo) });
    this.assertEnumEqual(['prop', 'prototype'], result.sort());

    this.assertNothingRaised(function() { result = fuse.Object.keys(new foo) });
    this.assertEnumEqual(['a'], result);

    // test objects containing shadowed properties
    this.assertEnumEqual($w('a b toString valueOf'),
      fuse.Object.keys(Fixtures.mixed_dont_enum).sort());

    this.assertRaise('TypeError', function() { fuse.Object.keys(null) });
    this.assertRaise('TypeError', function() { fuse.Object.keys(3) });
  },

  'testObjectValues': function() {
    this.assertEnumEqual([],          fuse.Object.values({ }));
    this.assertEnumEqual([],          fuse.Object.values([ ]));
    this.assertEnumEqual(['A'],       fuse.Object.values({ 'a': 'A' }));
    this.assertEnumEqual($w('A B C'), fuse.Object.values({ 'a':'A', 'b':'B', 'c':'C' }).sort());

    var result = fuse.Object.values(Fixtures.mixed_dont_enum);
    this.assert(result.length === 4 && result.sort().join('') == 'ABbar');

    this.assertRaise('TypeError', function() { fuse.Object.values(null) });
    this.assertRaise('TypeError', function() { fuse.Object.values(3) });
  },

  // sanity check
  'testDoesntExtendObjectFuse': function() {
    var iterations = 0, arr = [1, 2, 3], obj = { 'a': 1, 'b': 2, 'c': 3 };

    // for-in is supported with objects
    for (property in obj) iterations++;
    this.assertEqual(3, iterations);

    // for-in is not effected by fuse.Array.plugin additions
    iterations = 0;
    for (property in arr) iterations++;
    this.assertEqual(3, iterations);
  }
});