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

    var test = this;
    (function(){
      test.assertEnumEqual([1, 2, 3], $A(arguments), 'arguments object');
    })(1, 2, 3);
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

  'testToArrayOnArguments': function() {
    function toArrayOnArguments(){
      globalArgsTest = $A(arguments);
    }

    toArrayOnArguments();
    this.assertEnumEqual([], globalArgsTest);

    toArrayOnArguments('foo');
    this.assertEnumEqual(['foo'], globalArgsTest);

    toArrayOnArguments('foo', 'bar');
    this.assertEnumEqual(['foo', 'bar'], globalArgsTest);
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
    this.assertEnumEqual([], Fuse.List().clear());
    this.assertEnumEqual([], Fuse.List.create(1).clear());
    this.assertEnumEqual([], Fuse.List(1, 2).clear());
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
  },

  'testCompact': function() {
    this.assertEnumEqual([],           Fuse.List().compact());
    this.assertEnumEqual([1, 2, 3],    Fuse.List(1, 2, 3).compact());
    this.assertEnumEqual([0, 1, 2, 3], Fuse.List(0, null, 1, 2, undef, 3).compact());
    this.assertEnumEqual([1, 2, 3],    Fuse.List(0, null, 1, '', 2, undef, 3).compact(true));
    this.assertEnumEqual([1, 2, 3],    Fuse.List(null, 1, 2, 3, null).compact());
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
  },

  'testContains': function() {
    var names = Fuse.List('joe', 'john', 'zach');
    var basic = Fuse.List(1, 2, 3);
    this.assert(names.contains('joe'));
    this.assert(names.contains('joe', true));
    this.assert(!names.contains('gizmo'));

    this.assert(basic.contains(2));
    this.assert(basic.contains('2'));
    this.assert(!basic.contains('2', true));
    this.assert(!basic.contains('4'));
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
  },

  'testFlatten': function() {
    this.assertEnumEqual([],        Fuse.List().flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List(1, 2, 3).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List(1, [[[2, 3]]]).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List([1], [2], [3]).flatten());
    this.assertEnumEqual([1, 2, 3], Fuse.List([[[[[[1]]]]]], 2, 3).flatten());
  },

  'testForEach': function() {
    var nicknames = [];
    Fixtures.People.forEach(function(person, index) {
      nicknames.push(person.nickname);
    });

    this.assertEqual(Fixtures.Nicknames.join(', '),
      nicknames.join(', '));
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
  },

  'testIndexOf': function() {
    this.assertEqual(-1, Fuse.List().indexOf(1));
    this.assertEqual(-1, Fuse.List.create(0).indexOf(1));
    this.assertEqual(0,  Fuse.List.create(1).indexOf(1));
    this.assertEqual(1,  Fuse.List(0, 1, 2).indexOf(1));
    this.assertEqual(0,  Fuse.List(1, 2, 1).indexOf(1));
    this.assertEqual(2,  Fuse.List(1, 2, 1).indexOf(1, -1));
    this.assertEqual(1,  Fuse.List(undef, null).indexOf(null));
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
  },

  'testInspect': function() {
    this.assertEqual('[]', Fuse.List().inspect());
    this.assertEqual('[1]', Fuse.List.create(1).inspect());
    this.assertEqual('[\'a\']', Fuse.List('a').inspect());
    this.assertEqual('[\'a\', 1]', Fuse.List('a', 1).inspect());
  },

  'testIntersect': function() {
    this.assertEnumEqual([1, 3], Fuse.List(1, 1, 3, 5).intersect([1, 2, 3]));
    this.assertEnumEqual([1],    Fuse.List(1, 1).intersect([1, 1]));
    this.assertEnumEqual([0],    Fuse.List(0, 2).intersect([1, 0]));
    this.assertEnumEqual([],     Fuse.List(1, 1, 3, 5).intersect([4]));
    this.assertEnumEqual([],     Fuse.List.create(1).intersect(['1']));

    this.assertEnumEqual(
      ['B', 'C', 'D'],
      $R('A', 'Z').toArray().intersect($R('B', 'D').toArray())
    );
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
  },

  'testMap': function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.map(function(person) {
        return person.nickname;
      }).join(', '));

    this.assertEqual(26,  Fixtures.Primes.map().length);
  },

  'testMax': function() {
    this.assertEqual(100, Fixtures.Z.max());
    this.assertEqual(97,  Fixtures.Primes.max());

    this.assertEqual(2,
      Fuse.List(-9, -8, -7, -6, -4, -3, -2,  0, -1,  2).max());
    
    this.assertEqual('kangax',
      Fixtures.Nicknames.max()); // ?s > ?U
  },

  'testMin': function() {
    this.assertEqual(1, Fixtures.Z.min());
    this.assertEqual(0, Fuse.List(1, 2, 3, 4, 5, 6, 7, 8, 0, 9).min());
    this.assertEqual('dperini', Fixtures.Nicknames.min()); // ?U < ?h
  },

  'testPartition': function() {
    var result = Fixtures.People.partition(function(person) {
      return person.name.length < 13;
    }).invoke('pluck', 'nickname');

    this.assertEqual(2, result.length);
    this.assertEqual('juanbond, dperini', result[0].join(', '));
    this.assertEqual('jdd, kangax', result[1].join(', '));
  },

  'testPluck': function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.pluck('nickname').join(', '));
  },

  'testSize': function() {
    this.assertEqual(4, Fuse.List(0, 1, 2, 3).size());
    this.assertEqual(0, Fuse.List().size());
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
  },

  'testSortBy': function() {
    this.assertEqual('dperini, jdd, juanbond, kangax',
      Fixtures.People.sortBy(function(value) {
        return value.nickname.toLowerCase();
      }).pluck('nickname').join(', '));
  },

  'testUnique': function() {
    this.assertEnumEqual([1], Fuse.List(1, 1, 1).unique());
    this.assertEnumEqual([1], Fuse.List.create(1).unique());
    this.assertEnumEqual([],  Fuse.List().unique());

    this.assertEnumEqual([0, 1, 2, 3],
      Fuse.List(0, 1, 2, 2, 3, 0, 2).unique());
  },

  'testWithout': function() {
    this.assertEnumEqual([], Fuse.List().without(0));
    this.assertEnumEqual([], Fuse.List.create(0).without(0));
    this.assertEnumEqual([1], Fuse.List(0, 1).without(0));
    this.assertEnumEqual([1, 2], Fuse.List(0, 1, 2).without(0));
    this.assertEnumEqual(['test1', 'test3'], Fuse.List('test1', 'test2', 'test3').without('test2'));
  },

  'testZip': function() {
    var result = Fuse.List(1, 2, 3).zip([4, 5, 6], [7, 8, 9]);
    this.assertEqual('[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', result.inspect());

    result = Fuse.List(1, 2, 3).zip([4, 5, 6], [7, 8, 9],
      function(array) { return array.reverse() });

    this.assertEqual('[[7, 4, 1], [8, 5, 2], [9, 6, 3]]', result.inspect());
  }
});