new Test.Unit.Runner({

  'test$A': function() {
    this.assertEnumEqual([], $A(),    'no value');
    this.assertEnumEqual([], $A({ }), 'empty object');

    this.assertEnumEqual(['a', 'b', 'c'], $A(['a', 'b', 'c']), 'simple array');
    this.assertEnumEqual(['a', 'b', 'c'], $A('abc'), 'string value');

    this.assertEnumEqual(['x'],
      $A({ 'toArray': function() { return ['x'] } }),
      'toArray');

    this.assertEnumEqual([document.documentElement],
      $A(document.getElementsByTagName('HTML')),
     'simple nodeList');

    (function(){
      this.assertEnumEqual([1, 2, 3], $A(arguments), 'arguments object');
    }).call(this, 1, 2, 3);

    this.assertEnumEqual(['a', 'b', 'c'], $A(Fuse.String('abc')),
     'Fuse.String value');

    this.assertEnumEqual([0, undef, 2], $A(Fixtures.Object),
      'object with missing indexes');
  },

  'test$w': function() {
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w('a b c d'));
    this.assertEnumEqual([], $w(' '));
    this.assertEnumEqual([], $w(''));
    this.assertEnumEqual([], $w(null));
    this.assertEnumEqual([], $w(undef));
    this.assertEnumEqual([], $w());
    this.assertEnumEqual([], $w(10));
    this.assertEnumEqual(['a'], $w('a'));
    this.assertEnumEqual(['a'], $w('a '));
    this.assertEnumEqual(['a'], $w(' a'));
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w(' a   b\nc\t\nd\n'));
  },

  'testToArrayOnNodeList': function() {
    // direct HTML
    this.assertEqual(3, $A($('test_node').childNodes).length);

    // DOM
    var element = document.createElement('div');
    element.appendChild(document.createTextNode('22'));
    Fuse.Number(2).times(function() {
      element.appendChild(document.createElement('span')) });

    this.assertEqual(3, $A(element.childNodes).length);

    // HTML String
    element = document.createElement('div');
    $(element).update('22<span></span><span></span');
    this.assertEqual(3, $A(element.childNodes).length);
  },

  'testClear': function() {
    this.assertEnumEqual([], Fuse.List().clear(),
      'clear empty list');

    this.assertEnumEqual([], Fuse.List.create(1).clear(),
      'clear list with one undefined value');

    this.assertEnumEqual([], Fuse.List(1, 2).clear(),
      'clear basic list with values');

    this.assertEnumEqual([],
      Fuse.List.plugin.clear.call(Fuse.Object.clone(Fixtures.Object)),
      'called with an object as the `this` value');
  },

  'testClone': function() {
    this.assertEnumEqual([], Fuse.List().clone());
    this.assertEnumEqual([1], Fuse.List.create(1).clone());
    this.assertEnumEqual([1, 2], Fuse.List(1, 2).clone());
    this.assertEnumEqual([0, 1, 2], Fuse.List(0, 1, 2).clone());

    var a = Fuse.List(0, 1, 2), b = a;
    this.assertIdentical(a, b);

    b = a.clone();
    this.assertNotIdentical(a, b);

    this.assert(Fuse.List.plugin.clone.call([]).each,
      'convert regular arrays to Fuse.List');

    this.assertEnumEqual([0, undef, 2], Fuse.List.plugin.clone.call(Fixtures.Object),
      'called with an object as the `this` value');
  },

  'testCompact': function() {
    this.assertEnumEqual([],           Fuse.List().compact());
    this.assertEnumEqual([1, 2, 3],    Fuse.List(1, 2, 3).compact());
    this.assertEnumEqual([0, 1, 2, 3], Fuse.List(0, null, 1, 2, undef, 3).compact());
    this.assertEnumEqual([1, 2, 3],    Fuse.List(0, null, 1, '', 2, undef, 3).compact(true));
    this.assertEnumEqual([1, 2, 3],    Fuse.List(null, 1, 2, 3, null).compact());

    this.assertEnumEqual([0, 2],
      Fuse.List.plugin.compact.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEnumEqual([2],
      Fuse.List.plugin.compact.call(Fixtures.Object, true),
      'called with an object as the `this` value and the `falsy` argument');
  },

  'testConcat': function() {
    // test passing an arguments object to concat
     var self = this;
    (function() {
      self.assertEqual(1, Fuse.List().concat(arguments).length, 'treats arguments as an array');
    })(1, 2);

    var list = Fuse.List('a', 'b', 'c');
    this.assertEnumEqual($w('a b c d e f g h i'),
      list.concat(['d', 'e'], 'f', ['g', 'h'], ['i']), 'failed basic concat test');

    // test falsy values
    var expected = [8, 9, 0, 'a', null, undef, false, 'd'];
    this.assertEnumEqual(expected, Fuse.List.create(8).concat([9, 0], 'a', [null], undef, false, 'd'),
      'failed to concat falsy values');

    // test setting a different `this`
    var array = [3]; array[2] = 4;
    this.assertEnumEqual([Fixtures.Object, 3, undef, 4, 5],
      Fuse.List.plugin.concat.call(Fixtures.Object, array, 5),
      'called with an object as the `this` value');
  },

  'testContains': function() {
    var basic = Fuse.List(1, 2, 3),
     names = Fuse.List('joe', 'john', 'kit');

    this.assert(names.contains('joe'));
    this.assert(!names.contains('dagny'));

    this.assert(basic.contains(2));
    this.assert(!basic.contains('2'));
    this.assert(!basic.contains('4'));

    this.assert(basic.contains(Fuse.Number(2)),
      'Should match Number object instances');

    this.assert(names.contains(Fuse.String('kit')),
      'Should match String object instances');

    this.assert(
      Fuse.List.plugin.contains.call(Fixtures.Object, 2),
      'called with an object as the `this` value');
  },

 'testEach': function() {
   var self = this,
    source = Fuse.List(1, 2, 3, 4, 5),
    thisArg = { 'foo': 'bar' };

   source.each(function(item, index, array) {
     self.assertEqual(1, item);
     self.assertEqual(0, index);
     self.assertEqual(source, array);
     self.assertEqual(thisArg, this);
     throw Fuse.$break;
   }, thisArg);

   var results = Fuse.List();
   Fuse.List.plugin.each.call(Fixtures.Object, function(value) {
     results.push(value)
   });

   this.assertEnumEqual([0, 2], results,
     'called with an object as the `this` value');
 },

  'testEvery': function() {
    this.assert(Fuse.List().every());
    this.assert(Fuse.List(true, true, true).every());
    this.assert(!Fuse.List(true, false, false).every());
    this.assert(!Fuse.List(false, false, false).every());

    this.assert(Fixtures.Basic.every(function(value) {
      return value > 0;
    }));

    this.assert(!Fixtures.Basic.every(function(value) {
      return value > 1;
    }));

    this.assert(Fuse.List.plugin.each.call(Fixtures.Object,
      function(value) { return value != null }),
      'called with an object as the `this` value');
  },

  'testFilter': function() {
    this.assertEqual(Fixtures.Primes.join(', '),
      Fixtures.Z.filter(prime).join(', '));

    // test passing no arguments to filter()
    this.assertEnumEqual($w('a b'),
      Fuse.List('a', 'b', null).filter());

    this.assertEnumEqual($w('a b'),
      Fuse.List('a', 'b', undef).filter());

    this.assertEnumEqual(['a', 'b', 0],
      Fuse.List('a', 'b', 0).filter());

    this.assertEnumEqual([0, 2], Fuse.List.plugin.filter.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEnumEqual([], Fuse.List.plugin.filter.call(Fixtures.Object,
      function(value) { return value == null }),
      'called with an object as the `this` value iterated over an undefined index');
  },

  'testFirst': function() {
    this.assertEnumEqual([],        Fuse.List().first(3));
    this.assertEnumEqual([1, 2],    Fixtures.Basic.first(2));
    this.assertEnumEqual([1],       Fixtures.Basic.first(-3));
    this.assertEnumEqual([1, 2, 3], Fixtures.Basic.first(1000));
    this.assertEnumEqual([],        Fixtures.Basic.first('r0x0r5'));

    this.assertEqual(1, Fixtures.Basic.first());

    this.assertEqual(2,
      Fixtures.Basic.first(function(item) { return item === 2 }));

    this.assertUndefined(Fuse.List().first());

    this.assertUndefined(
      Fuse.List().first(function(item) { return item === 2 }));

    this.assertUndefined(
      Fixtures.Basic.first(function(item) { return item === 4 }));

    this.assertEqual(0, Fuse.List.plugin.first.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEnumEqual([0, undef], Fuse.List.plugin.first.call(Fixtures.Object, 2),
      'called with an object as the `this` value iterated over an undefined index');
  },

  'testFlatten': function() {
    this.assertEnumEqual([],        Fuse.List().flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List(1, 2, 3).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List(1, [[[2, 3]]]).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List([1], [2], [3]).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List([[[[[[1]]]]]], 2, 3).flatten());

    this.assertEnumEqual([0, undef, 2], Fuse.List.plugin.flatten.call(Fixtures.Object),
      'called with an object as the `this` value');
  },

  'testForEach': function() {
    var nicknames = [];
    Fixtures.People.forEach(function(person, index) {
      nicknames.push(person.nickname);
    });

    this.assertEqual(Fixtures.Nicknames.join(', '),
      nicknames.join(', '));

    var results = Fuse.List();
    Fuse.List.plugin.forEach.call(Fixtures.Object, function(value) {
      results.push(value);
    });

    this.assertEnumEqual([0, 2], results,
      'called with an object as the `this` value');
  },

  'testGrep': function() {
    var Selector = Fuse.Class({
      'initialize': function(pattern) {
        this.pattern = pattern;
      },
      'test': function(element) {
        return Fuse.Dom.Selector.match(element, this.pattern);
      }
    });

    // test empty pattern
    this.assertEqual('abc', Fuse.List('a', 'b', 'c').grep('').join(''));
    this.assertEqual('abc', Fuse.List('a', 'b', 'c').grep(new RegExp('')).join(''));

    this.assertEqual('juanbond, jdd',
      Fixtures.Nicknames.grep(/j/).join(', '));

    this.assertEqual('JUANBOND, JDD',
      Fixtures.Nicknames.grep(/j/, function(nickname) {
        return nickname.toUpperCase();
      }).join(', '));

    this.assertEnumEqual($('grepHeader', 'grepCell'),
      $('grepTable', 'grepTBody', 'grepRow', 'grepHeader', 'grepCell').grep(new Selector('.cell')));

    this.assertEnumEqual([0, 2], Fuse.List.plugin.grep.call(Fixtures.Object, /\d/),
      'called with an object as the `this` value');

    this.assertEnumEqual([], Fuse.List.plugin.grep.call(Fixtures.Object, /undefined/),
      'called with an object as the `this` value iterated over an undefined index');
  },

  'testIndexOf': function() {
    this.assertEqual(-1, Fuse.List().indexOf(1));
    this.assertEqual(-1, Fuse.List.create(0).indexOf(1));
    this.assertEqual(0,  Fuse.List.create(1).indexOf(1));
    this.assertEqual(1,  Fuse.List(0, 1, 2).indexOf(1));
    this.assertEqual(0,  Fuse.List(1, 2, 1).indexOf(1));
    this.assertEqual(2,  Fuse.List(1, 2, 1).indexOf(1, -1));
    this.assertEqual(1,  Fuse.List(undef, null).indexOf(null));

    this.assertEqual(2,  Fuse.List.plugin.indexOf.call(Fixtures.Object, 2),
      'called with an object as the `this` value');

    this.assertEqual(-1, Fuse.List.plugin.indexOf.call(Fixtures.Object, undef),
      'iterated over an undefined index');
  },

  'testInject': function() {
    this.assertEqual(1061,
      Fixtures.Primes.inject(0, function(sum, value) {
        return sum + value;
      }));

    // test thisArg
    var Foo = { 'base': 4 };
    this.assertEqual(18, Fixtures.Basic.inject(0, function(sum, value) {
      return this.base + sum + value;
    }, Foo));

    // test undefined/null accumulator
    this.assertEqual(undef, Fixtures.Basic.inject(undef, function(accumulator) {
      return accumulator;
    }));

    this.assertEqual(null, Fixtures.Basic.inject(null, function(accumulator) {
      return accumulator;
    }));

    this.assertEqual(2,  Fuse.List.plugin.inject.call(Fixtures.Object, 0,
      function(sum, value) { return sum + value }),
      'called with an object as the `this` value');
  },

  'testInsert': function() {
    this.assertEnumEqual([0, 1, 2, 4, 5],
      Fuse.List(1, 2, 4, 5).insert(0, 0));

    this.assertEnumEqual([1, 2, 3, 4, 5],
      Fuse.List(1, 2, 4, 5).insert(2, 3));

    this.assertEnumEqual([1, 2, 4, 5, 6, 7, 8],
      Fuse.List(1, 2, 4, 5).insert(-1, 6, 7, 8));

    this.assertEnumEqual([1, 2, 4, 5, undef, undef, 8],
      Fuse.List(1, 2, 4, 5).insert(6, 8));

    this.assertEqual(2, Fuse.List.plugin.inject.call(Fixtures.Object, 0,
      function(sum, value) { return sum + value }),
      'called with an object as the `this` value');
  },

  'testInspect': function() {
    this.assertEqual('[]', Fuse.List().inspect());
    this.assertEqual('[1]', Fuse.List.create(1).inspect());
    this.assertEqual('[\'a\']', Fuse.List('a').inspect());
    this.assertEqual('[\'a\', 1]', Fuse.List('a', 1).inspect());

    this.assertEqual('[0, undefined, 2]',
      Fuse.List.plugin.inspect.call(Fixtures.Object),
      'called with an object as the `this` value');
  },

  'testIntersect': function() {
    this.assertEnumEqual([1, 3], Fuse.List(1, '2', 3).intersect([1, 2, 3]),
      'Should have performed a strict match');

    this.assertEnumEqual([1], Fuse.List(1, 1).intersect([1, 1]),
      'Should only return one match even if the value is at more than one index');

    this.assertEnumEqual([0], Fuse.List(0, 2).intersect([1, 0]),
      'Should have matched the falsy number 0');

    this.assertEnumEqual([], Fuse.List(1, 1, 3, 5).intersect([4]),
      'Should not have matched the number 4');

    this.assertEnumEqual([1, 2, 3],
      $R(1, 10).toArray().intersect([1, 2, 3]),
      'Should match Number object instances');

    this.assertEnumEqual(['B', 'C', 'D'],
      $R('A', 'Z').toArray().intersect($R('B', 'D').toArray()),
      'Should match String object instances');

    this.assertEnumEqual([1, 2, 3],
      Fuse.List(1,2,3, Fuse.Number(2)).intersect([1, 2, 3]),
      'Should return only one entry with a valueOf 2');

    var object = Fuse.Object.clone(Fixtures.Object);
    object['1'] = undef;

    this.assertEnumEqual([0, 2],
      Fuse.List.plugin.intersect.call(Fixtures.Object, object),
      'Failed when called with an object as the `this` value');
  },

  'testInvoke': function() {
    var result = Fuse.List(
      Fuse.List(2, 1, 3),
      Fuse.List(6, 5, 4)
    ).invoke('sort');

    this.assertEqual(2, result.length);
    this.assertEqual('1, 2, 3', result[0].join(', '));
    this.assertEqual('4, 5, 6', result[1].join(', '));

    result = result.invoke('invoke', 'toString', 2);
    this.assertEqual('1, 10, 11', result[0].join(', '));
    this.assertEqual('100, 101, 110', result[1].join(', '));

    var object = { '0':Fuse.Number(0), '2':Fuse.Number(2), 'length':3 };
    this.assertEnumEqual([1, undef, 3],
      Fuse.List.plugin.invoke.call(object, 'succ'),
      'called with an object as the `this` value');
  },

  'testLast': function() {
    var array = Fuse.List();
    array[-1] = 'blah';

    this.assertUndefined(array.last());

    this.assertUndefined(Fuse.List().last());
    this.assertEnumEqual([], Fuse.List().last(3));

    this.assertUndefined(
      Fuse.List().last(function(item) { return item === 2 }));

    this.assertEqual(1, Fuse.List.create(1).last());
    this.assertEqual(2, Fuse.List(1, 2).last());

    this.assertEqual(3, Fixtures.Basic.last());
    this.assertEnumEqual([2, 3], Fixtures.Basic.last(2));

    this.assertEqual(2,
      Fixtures.Basic.last(function(item) { return item === 2 }));

    this.assertUndefined(
      Fixtures.Basic.last(function(item) { return item === 4 }));

    this.assertEnumEqual([3], Fixtures.Basic.last(-3));
    this.assertEnumEqual([1, 2, 3], Fixtures.Basic.last(1000));

    this.assertEnumEqual([], Fixtures.Basic.last('r0x0r5'));

    this.assertEqual(2, Fuse.List.plugin.last.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEnumEqual([undef, 2], Fuse.List.plugin.last.call(Fixtures.Object, 2),
      'should include the undefined index');
  },

  'testLastIndexOf': function() {
    this.assertEqual(-1, Fuse.List().lastIndexOf(1));
    this.assertEqual(-1, Fuse.List.create(0).lastIndexOf(1));
    this.assertEqual(0,  Fuse.List.create(1).lastIndexOf(1));
    this.assertEqual(2,  Fuse.List(0, 2, 4, 6).lastIndexOf(4));
    this.assertEqual(3,  Fuse.List(4, 4, 2, 4, 6).lastIndexOf(4));
    this.assertEqual(3,  Fuse.List(0, 2, 4, 6).lastIndexOf(6, 3));
    this.assertEqual(-1, Fuse.List(0, 2, 4, 6).lastIndexOf(6, 2));
    this.assertEqual(0,  Fuse.List(6, 2, 4, 6).lastIndexOf(6, 2));

    var fixture = Fuse.List(1, 2, 3, 4, 3);
    this.assertEqual(4, fixture.lastIndexOf(3));
    this.assertEnumEqual([1, 2, 3, 4, 3], fixture);

    //tests from http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
    var array = Fuse.List(2, 5, 9, 2);
    this.assertEqual(3,  array.lastIndexOf(2));
    this.assertEqual(-1, array.lastIndexOf(7));
    this.assertEqual(3,  array.lastIndexOf(2, 3));
    this.assertEqual(0,  array.lastIndexOf(2, 2));
    this.assertEqual(0,  array.lastIndexOf(2, -2));
    this.assertEqual(3,  array.lastIndexOf(2, -1));

    this.assertEqual(0,  Fuse.List.plugin.lastIndexOf.call(Fixtures.Object, 0),
      'called with an object as the `this` value');

    this.assertEqual(-1, Fuse.List.plugin.indexOf.call(Fixtures.Object, undef),
      'iterated over an undefined index');
  },

  'testMap': function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.map(function(person) {
        return person.nickname;
      }).join(', '));

    this.assertEqual(26,  Fixtures.Primes.map().length);

    var count = 0;
    var result = Fuse.List.plugin.map.call(Fixtures.Object, function(value) {
      count++;
      return value;
    });

    this.assertEqual(2, count, 'iterated over an undefined index');

    this.assertEnumEqual([0, undef, 2], result,
      'called with an object as the `this` value');
  },

  'testMax': function() {
    this.assertEqual(100, Fixtures.Z.max());
    this.assertEqual(97,  Fixtures.Primes.max());

    this.assertEqual(2,
      Fuse.List(-9, -8, -7, -6, -4, -3, -2,  0, -1,  2).max(),
      'failed with negative and positive numbers');

    this.assertEqual('kangax',
      Fixtures.Nicknames.max(),
      'failed comparing string values'); // ?s > ?U

    this.assertEqual(2, Fuse.List.plugin.max.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEqual('c',
      Fuse.List('a', 'b', 'c', 'd').max(
      function(value) { return value.charCodeAt(0) % 4 }),
      'comparing string with callback');
  },

  'testMin': function() {
    this.assertEqual(1, Fixtures.Z.min());
    this.assertEqual(0, Fuse.List(1, 2, 3, 4, 5, 6, 7, 8, 0, 9).min());

    this.assertEqual('dperini',
      Fixtures.Nicknames.min(),
      'failed comparing string values'); // ?U < ?h

    this.assertEqual(0, Fuse.List.plugin.min.call(Fixtures.Object),
      'called with an object as the `this` value');

    this.assertEqual('d',
      Fuse.List('a', 'b', 'c', 'd').min(
      function(value) { return value.charCodeAt(0) % 4 }),
      'comparing string with callback');
  },

  'testPartition': function() {
    var result = Fixtures.People.partition(function(person) {
      return person.name.length < 13;
    }).invoke('pluck', 'nickname');

    this.assertEqual(2, result.length);
    this.assertEqual('juanbond, dperini', result[0].join(', '));
    this.assertEqual('jdd, kangax', result[1].join(', '));

    result = Fuse.List.plugin.partition.call(Fixtures.Object, function(value) {
      return value != null;
    });

    this.assertEnumEqual([0, 2], result[0],
      'called with an object as the `this` value');

    this.assertEnumEqual([], result[1],
      'iterated over an undefined index');
  },

  'testPluck': function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.pluck('nickname').join(', '));

    var object = {
      '0': { 'name': 'Joe' },
      '2': { 'name': 'John' },
      'length': 3
    };

    this.assertEnumEqual(['Joe', 'John', undef],
      Fuse.List.plugin.pluck.call(object, 'name').sort(),
      'called with an object as the `this` value');
  },

  'testSize': function() {
    this.assertEqual(4, Fuse.List(0, 1, 2, 3).size());
    this.assertEqual(0, Fuse.List().size());
    this.assertEqual(3, Fuse.List.plugin.size.call(Fixtures.Object),
      'called with an object as the `this` value');
  },

  'testSome': function() {
    this.assert(!(Fuse.List().some()));

    this.assert(Fuse.List(true, true, true).some());
    this.assert(Fuse.List(true, false, false).some());
    this.assert(!Fuse.List(false, false, false).some());

    this.assert(Fixtures.Basic.some(function(value) {
      return value > 2;
    }));

    this.assert(!Fixtures.Basic.some(function(value) {
      return value > 5;
    }));

    this.assert(Fuse.List.plugin.some.call(Fixtures.Object,
      function(value) { return value == 2 }),
      'called with an object as the `this` value');

    this.assert(!Fuse.List.plugin.some.call(Fixtures.Object,
      function(value) { return value == null }),
      'iterated over an undefined index');
  },

  'testSortBy': function() {
    this.assertEqual('dperini, jdd, juanbond, kangax',
      Fixtures.People.sortBy(function(value) {
        return value.nickname.toLowerCase();
      }).pluck('nickname').join(', '));

    this.assertEnumEqual([1, 2, 3],
      Fuse.List(3, 1, 2).sortBy(),
      'no callback passed');

    this.assertEnumEqual(Fuse.List(0, undef, 2).sortBy(Fuse.K),
      Fuse.List.plugin.sortBy.call(Fixtures.Object, Fuse.K),
      'called with an object as the `this` value');
  },

  'testUnique': function() {
    this.assertEnumEqual([1], Fuse.List(1, 1, 1).unique());
    this.assertEnumEqual([1], Fuse.List.create(1).unique());
    this.assertEnumEqual([],  Fuse.List().unique());

    this.assertEnumEqual([0, 1, 2, 3],
      Fuse.List(0, 1, 2, 2, 3, 0, 2).unique());

    var object = Fuse.Object.clone(Fixtures.Object);
    object['4'] = 2;
    object.length = 5;

    this.assertEnumEqual([0, 2],
      Fuse.List.plugin.unique.call(object),
      'called with an object as the `this` value');
  },

  'testWithout': function() {
    this.assertEnumEqual([], Fuse.List().without(0));
    this.assertEnumEqual([], Fuse.List.create(0).without(0));
    this.assertEnumEqual([1], Fuse.List(0, 1).without(0));
    this.assertEnumEqual([1, 2], Fuse.List(0, 1, 2).without(0));
    this.assertEnumEqual(['test1', 'test3'], Fuse.List('test1', 'test2', 'test3').without('test2'));

    this.assertEnumEqual([2], Fuse.List.plugin.without.call(Fixtures.Object, 0),
      'called with an object as the `this` value');
  },

  'testZip': function() {
    var result = Fuse.List(1, 2, 3).zip([4, 5, 6], [7, 8, 9]);
    this.assertEqual('[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', result.inspect());

    result = Fuse.List(1, 2, 3).zip([4, 5, 6], [7, 8, 9],
      function(array) { return array.reverse() });

    this.assertEqual('[[7, 4, 1], [8, 5, 2], [9, 6, 3]]', result.inspect());

    var object = Fuse.Object.clone(Fixtures.Object);
    delete object['2'];
    object['0'] = 'a'; object['1'] = 'b';

    this.assertEqual("[[0, \'a\'], [undefined, \'b\'], [2, undefined]]",
       Fuse.List.plugin.zip.call(Fixtures.Object, object).inspect(),
      'called with an object as the `this` value');
  }
});