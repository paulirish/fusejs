new Test.Unit.Runner({

  'testConstruct': function() {
    var object = Fuse.Object.clone(Fixtures.one);
    var h = Fuse.Hash(object), h2 = $H(object);

    this.assertInstanceOf(Fuse.Hash, h);
    this.assertInstanceOf(Fuse.Hash, h2);

    this.assertHashEqual({}, Fuse.Hash());
    this.assertHashEqual(object, h);
    this.assertHashEqual(object, h2);

    h.set('foo', 'bar');
    this.assertHashNotEqual(object, h);

    var clone = $H(h);
    this.assertInstanceOf(Fuse.Hash, clone);
    this.assertHashEqual(h, clone);

    h.set('foo', 'foo');
    this.assertHashNotEqual(h, clone);
    this.assertIdentical($H, Fuse.Hash.from);
  },

  'testAbilityToContainAnyKey': function() {
    var h = $H({ '_each': 'E', 'map': 'M', 'keys': 'K', 'pluck': 'P', 'unset': 'U' });

    this.assertEnumEqual($w('_each keys map pluck unset'), h.keys().sort());
    this.assertHashEqual({ '_each': 'E', 'map': 'M', 'keys': 'K', 'pluck': 'P' },
      h.unset('unset'));
  },

  'testHashUsedInTemplate': function() {
    var template = Fuse.Template('#{a} #{b}'), hash = $H({ 'a': 'hello', 'b': 'world' });

    this.assertEqual('hello world', template.evaluate(hash.toObject()));
    this.assertEqual('hello world', template.evaluate(hash));

    this.assertEqual('hello', Fuse.String.interpolate('#{a}', hash));
  },

  'testPreventIterationOverShadowedProperties': function() {
    // redundant now that object is systematically cloned.
    function FooMaker(value) {
      this.key = value;
    }

    FooMaker.prototype.key = 'foo';

    var foo = new FooMaker('bar');
    this.assertEqual("key=bar", Fuse.Hash(foo).toQueryString());
    this.assertEqual("key=bar", Fuse.Hash(Fuse.Hash(foo)).toQueryString());
  },

  'testClear': function() {
    this.assertHashEqual(Fuse.Hash(), $H(Fixtures.one).clear());
    this.assertInstanceOf(Fuse.Hash,  $H(Fixtures.one).clear());
  },

  'testClone': function() {
    var h = $H(Fixtures.many);
    this.assertHashEqual(h, h.clone());
    this.assertInstanceOf(Fuse.Hash, h.clone());
    this.assertNotIdentical(h, h.clone());
  },

  'testContains': function() {
    this.assert($H(Fixtures.one).contains('A#'));
    this.assert($H(Fixtures.many).contains('A'));
    this.assert($H(Fixtures.mixed_dont_enum).contains('bar'));

    this.assert(!$H(Fixtures.many).contains('Z'));
    this.assert(!$H().contains('foo'));
  },

  'testFilter': function() {
    this.assertHashEqual({ 'a':'A', 'b':'B' },
      $H(Fixtures.many).filter(function(value, key) {
        return /[ab]/.test(key);
      }));

    this.assertHashEqual({ 'toString':'bar', 'valueOf':'' },
      $H(Fixtures.mixed_dont_enum).filter(function(value, key) {
        return /^(bar|)$/.test(value);
      }));

    // test passing no arguments to filter()
    this.assertHashEqual({ 'a':'b' },
      $H(Fixtures.value_undefined).filter());

    this.assertHashEqual({ 'a':'b' },
      $H(Fixtures.value_null).filter());

    this.assertHashEqual(Fixtures.value_zero,
      $H(Fixtures.value_zero).filter());
  },

  'testFirst': function() {
    var results;

    this.assertUndefined($H().first());

    this.assertUndefined($H().first(
      function(value, key) { return value === 'C' }));

    this.assertEnumEqual(['c', 'C'], $H(Fixtures.many).first(
      function(value, key) { return value === 'C' })
    );

    this.assertEnumEqual([], $H().first(3));
    this.assertEnumEqual(['a', 'A'], $H(Fixtures.many).first());

    results = $H(Fixtures.many).first(2);
    this.assertEnumEqual(['a', 'A'], results[0]);
    this.assertEnumEqual(['b', 'B'], results[1]);

    this.assertUndefined($H(Fixtures.many).first(
      function(value, key) { return value === 'Z' })
    );

    results = $H(Fixtures.many).first(-3);
    this.assertEnumEqual(['a', 'A'],  results[0]);

    results = $H(Fixtures.many).first(1000);
    this.assertEnumEqual(['a', 'A'],  results[0]);
    this.assertEnumEqual(['b', 'B'],  results[1]);
    this.assertEnumEqual(['c', 'C'],  results[2]);
    this.assertEnumEqual(['d', 'D#'], results[3]);

    this.assertEnumEqual([], $H(Fixtures.many).first('r0x0r5'));
  },

  'testGet': function() {
    var h = $H({ 'a': 'A' }), empty = $H({ }),
     properties = Fuse.List('constructor', 'hasOwnProperty', 'isPrototypeOf',
       'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf');

    this.assertEqual('A', h.get('a'));
    this.assertUndefined(h.a);
    this.assertUndefined(empty.get('a'));

    // ensure Hash#get only returns the objects own properties
    properties.each(function(property) {
      this.assertUndefined(empty.get(property),
        'Returned the "' + property + '" property of its prototype.');
    }, this);
  },

  'testGrep': function() {
    // test empty pattern
    this.assertHashEqual(Fixtures.many, $H(Fixtures.many).grep(''));
    this.assertHashEqual(Fixtures.many, $H(Fixtures.many).grep(new RegExp('')));

    this.assert(/(ab|ba)/.test($H(Fixtures.many).grep(/[AB]/).keys().join('')));
    this.assert(/(CCD#D#|D#D#CC)/.test($H(Fixtures.many).grep(/[CD]/, function(v) {
      return v + v;
    }).values().join('')));

    this.assert('toString' == $H(Fixtures.mixed_dont_enum).grep(/bar/, function(v) {
      return v;
    }).keys().join(''));
  },

  'testHasKey': function() {
    this.assert($H(Fixtures.mixed_dont_enum).hasKey('valueOf'),
      'Failed to find key `valueOf`.');

    this.assert($H(Fixtures.many).hasKey('a'),
      'Failed to find key `a`.');

    this.assert(!$H(Fixtures.many).hasKey('valueOf'),
      '`valueOf` is not a key.');

    this.assert(!$H(Fixtures.mixed_dont_enum).hasKey('e'),
      '`e` is not a key.');
  },

  'testInspect': function() {
    this.assertEqual('#<Hash:{}>', $H({}).inspect());

    this.assertEqual("#<Hash:{'a': 'A#'}>",
      $H(Fixtures.one).inspect());

    this.assertEqual("#<Hash:{'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D#'}>",
      $H(Fixtures.many).inspect());

    this.assertEqual("#<Hash:{'a': 'A', 'b': 'B', 'toString': 'bar', 'valueOf': ''}>",
      $H(Fixtures.mixed_dont_enum).inspect());
  },

  'testKeyOf': function() {
    this.assert('a', $H(Fixtures.one).keyOf('A#'));
    this.assert('a', $H(Fixtures.many).keyOf('A'));

    this.assertEqual(-1, $H().keyOf('foo'));
    this.assertEqual(-1, $H(Fixtures.many).keyOf('Z'));

    var hash = $H({ 'a':1, 'b':'2', 'c':1, 'toString':'foo', 'valueOf':'' });
    this.assert(Fuse.List('a','c').contains(hash.keyOf(1)));
    this.assertEqual('toString', hash.keyOf('foo'));
    this.assertEqual('valueOf', hash.keyOf(''));

    this.assertEqual(-1, hash.keyOf('1'));
  },

  'testKeys': function() {
    this.assertEnumEqual([],               $H({ }).keys());
    this.assertEnumEqual(['a'],            $H(Fixtures.one).keys());
    this.assertEnumEqual($w('a b c d'),    $H(Fixtures.many).keys().sort());
    this.assertEnumEqual($w('plus quad'),  $H(Fixtures.functions).keys().sort());
  },

  'testLast': function() {
    var results;
    this.assertUndefined($H().last());
    this.assertEnumEqual([], $H().last(3));
    this.assertUndefined($H().last(function(value, key) { return value === 'C' }));
    this.assertEnumEqual(['d', 'D#'], $H(Fixtures.many).last());

    results = $H(Fixtures.many).last(2);
    this.assertEnumEqual(['c', 'C'], results[0]);
    this.assertEnumEqual(['d', 'D#'], results[1]);

    this.assertEnumEqual(['c', 'C'], $H(Fixtures.many).last(
      function(value, key) { return value === 'C' })
    );

    this.assertUndefined($H(Fixtures.many).last(
      function(value, key) { return value === 'Z' })
    );

    results = $H(Fixtures.many).last(-3);
    this.assertEnumEqual(['d', 'D#'], results[0]);

    results = $H(Fixtures.many).last(1000);
    this.assertEnumEqual(['a', 'A'],  results[0]);
    this.assertEnumEqual(['b', 'B'],  results[1]);
    this.assertEnumEqual(['c', 'C'],  results[2]);
    this.assertEnumEqual(['d', 'D#'], results[3]);

    this.assertEnumEqual([], $H(Fixtures.many).last('r0x0r5'));
  },

  'testMerge': function() {
    var h = $H(Fixtures.many);

    this.assertNotIdentical(h, h.merge());
    this.assertNotIdentical(h, h.merge({ }));

    this.assertInstanceOf(Fuse.Hash, h.merge());
    this.assertInstanceOf(Fuse.Hash, h.merge({ }));

    this.assertHashEqual(h, h.merge());
    this.assertHashEqual(h, h.merge({ }));
    this.assertHashEqual(h, h.merge($H()));

    this.assertHashEqual({ 'a':'A', 'b':'B', 'c':'C', 'd':'D#', 'aaa':'AAA' },
      h.merge({ 'aaa': 'AAA'} ));

    this.assertHashEqual({ 'a':'A#', 'b':'B', 'c':'C', 'd':'D#' },
      h.merge(Fixtures.one));
  },

  'testPartition': function() {
    var result = $H(Fixtures.many).partition(function(value) {
      return /[AB]/.test(value);
    });

    this.assertHashEqual({ 'a':'A', 'b':'B' }, result[0]);
    this.assertHashEqual({ 'c':'C', 'd':'D#' }, result[1]);

    result = $H(Fixtures.mixed_dont_enum).partition(function(value) {
      return /[AB]/.test(value);
    });

    this.assertHashEqual({ 'a':'A', 'b':'B' }, result[0]);
    this.assertHashEqual({ 'toString':'bar', 'valueOf':'' }, result[1]);
  },

  'testSet': function() {
    var h = $H({a: 'A'});

    this.assertHashEqual({ 'a': 'A', 'b': 'B' }, h.set('b', 'B'));
    this.assertHashEqual({ 'a': 'A', 'b': 'B', 'c': undef }, h.set('c'));
    this.assertHashEqual({ 'a': 'A', 'b': 'B', 'c': undef, 'd': 'D', 'z': 'Z' },
      h.set({ 'd': 'D', 'z': 'Z' })
    );
  },

  'testSize': function() {
    this.assertEqual(1, $H(Fixtures.one).size());
    this.assertEqual(4, $H(Fixtures.many).size());
    this.assertEqual(4, $H(Fixtures.mixed_dont_enum).size());
    this.assertEqual(0, $H().size());
  },

  'testToArray': function() {
    var expected = [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D#']];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.many).toArray().inspect(),
      'Fixtures.many');

    expected = [['a', 'A'], ['b', 'B'], ['toString', 'bar'], ['valueOf', '']];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.mixed_dont_enum).toArray().inspect(),
      'Fixtures.mixed_dont_enum');

    expected = [['quad', function(n) { return n * n }], ['plus', function(n) { return n + n }]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.functions).toArray().inspect(),
      'Fixtures.functions');

    expected = [['color', ['r', 'g', 'b']]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.multiple).toArray().inspect(),
      'Fixtures.multiple');

    expected = [['color', ['r', null, 'g', undef, 0]]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.multiple_nil).toArray().inspect(),
      'Fixtures.multiple_nil');

    expected = [['color', [null, undef]]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.multiple_all_nil).toArray().inspect(),
      'Fixtures.multiple_all_nil');

    expected = [['color', []]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.multiple_empty).toArray().inspect(),
      'Fixtures.multiple_empty');

    expected = [['stuff[]', ['$', 'a', ';']]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.multiple_special).toArray().inspect(),
      'Fixtures.multiple_special');

    expected = [['a', 'b'], ['c', undef]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.value_undefined).toArray().inspect(),
      'Fixtures.value_undefined');

    expected = [['a', 'b'], ['c', null]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.value_null).toArray().inspect(),
      'Fixtures.value_null');

    expected = [['a', 'b'], ['c', 0]];
    this.assertEqual(Fuse.List.inspect(expected),
      $H(Fixtures.value_zero).toArray().inspect(),
      'Fixtures.value_zero');
  },

  'testToObject': function() {
    var hash = $H(Fixtures.many), object = hash.toObject();
    this.assertInstanceOf(Fuse.Object, object);
    this.assertHashEqual(Fixtures.many, object);
    this.assertNotIdentical(Fixtures.many, object);

    hash.set('foo', 'bar');
    this.assertHashNotEqual(object, hash.toObject());
  },

  'testToQueryString': function() {
    this.assertEqual('',                   $H({ }).toQueryString());
    this.assertEqual('a%23=A',             $H({'a#': 'A'}).toQueryString());
    this.assertEqual('a=A%23',             $H(Fixtures.one).toQueryString());
    this.assertEqual('a=A&b=B&c=C&d=D%23', $H(Fixtures.many).toQueryString());
    this.assertEqual('a=b&c',              $H(Fixtures.value_undefined).toQueryString());
    this.assertEqual('a=b&c',              $H(Fuse.String.toQueryParams('a=b&c')).toQueryString());
    this.assertEqual('a=b&c=',             $H(Fixtures.value_null).toQueryString());
    this.assertEqual('a=b&c=0',            $H(Fixtures.value_zero).toQueryString());

    this.assertEqual('color=r&color=g&color=b',
      $H(Fixtures.multiple).toQueryString());

    this.assertEqual('color=r&color=&color=g&color&color=0',
      $H(Fixtures.multiple_nil).toQueryString());

    this.assertEqual('color=&color',
      $H(Fixtures.multiple_all_nil).toQueryString());

    this.assertEqual('', $H(Fixtures.multiple_empty).toQueryString());
    this.assertEqual('', $H({ 'foo':{ }, 'bar':{ } }).toQueryString());

    this.assertEqual('stuff%5B%5D=%24&stuff%5B%5D=a&stuff%5B%5D=%3B',
      $H(Fixtures.multiple_special).toQueryString());

    this.assertHashEqual(Fixtures.multiple_special,
      $H(Fixtures.multiple_special).toQueryString().toQueryParams());

    this.assertEqual('a=A&b=B&toString=bar&valueOf=',
      $H(Fixtures.mixed_dont_enum).toQueryString());
  },

  'testUnset': function() {
    var hash = $H(Fixtures.many);
    this.assertHashEqual({ 'a':'A', 'c': 'C', 'd':'D#' }, hash.unset('b'));
    this.assertHashEqual({ 'a':'A', 'c': 'C', 'd':'D#' }, hash.unset('z'));
    this.assertHashEqual({ 'd':'D#' }, hash.unset('a', 'c'));

    hash = $H(Fixtures.many);
    this.assertHashEqual({ 'b': 'B', 'd':'D#' }, hash.unset(['a', 'c']));
  },

  'testValues': function() {
    this.assertEnumEqual([],             $H({ }).values());
    this.assertEnumEqual(['A#'],         $H(Fixtures.one).values());
    this.assertEnumEqual($w('A B C D#'), $H(Fixtures.many).values().sort());

    this.assertEnumEqual($w('function function'),
      $H(Fixtures.functions).values().map(function(i){ return typeof i }));

    this.assertEqual(9, $H(Fixtures.functions).get('quad')(3));
    this.assertEqual(6, $H(Fixtures.functions).get('plus')(3));
  },

  'testZip': function() {
    var jq = $H({ 'name':'jquery',    'size':'18kb' }),
     proto = $H({ 'name':'prototype', 'size':'28kb' }),
     fuse  = $H({ 'name': 'fusejs',   'size':'29kb' });

    var result = jq.zip(proto, fuse);
    this.assertHashEqual({ 'name':['jquery', 'prototype', 'fusejs'], 'size':['18kb', '28kb', '29kb'] },
      result);

    result = jq.zip(proto, fuse, function(values) { return values.join(', ') })
    this.assertHashEqual({ 'name':'jquery, prototype, fusejs', 'size':'18kb, 28kb, 29kb' },
      result);
  }
});