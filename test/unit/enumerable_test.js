new Test.Unit.Runner({

  'testEachBreak': function() {
    var result = 0;
    Fixtures.Basic.each(function(value) {
      if ((result = value) == 2) throw Fuse.$break;
    });

    this.assertEqual(2, result);
  },

  'testEachReturnActsAsContinue': function() {
    var results = [];
    Fixtures.Basic.each(function(value) {
      if (value == 2) return;
      results.push(value);
    });

    this.assertEqual('1, 3', results.join(', '));
  },

  'testEachCallbackArguments': function() {
    var self = this;
    Fixtures.Basic.each(function(item, index, iterable) {
      self.assertEqual(1, item);
      self.assertEqual(0, index);
      self.assertEqual(Fixtures.Basic, iterable);
      throw Fuse.$break;
    });
  },

  'testEachChaining': function() {
    this.assertEqual(Fixtures.Primes, Fixtures.Primes.each(Fuse.emptyFunction));
    this.assertEqual(3, Fixtures.Basic.each(Fuse.emptyFunction).size());
  },

  'testEnumContext': function() {
    var results = [];
    Fixtures.Basic.each(function(value) {
      results.push(value * this.i);
    }, { 'i': 2 });

    this.assertEqual('2 4 6', results.join(' '));

    this.assert(Fixtures.Basic.every(function(value){
      return value >= this.min && value <= this.max;
    }, { 'min': 1, 'max': 3 }));

    this.assert(!Fixtures.Basic.every(function(value){
      return value >= this.min && value <= this.max;
    }));

    this.assert(Fixtures.Basic.some(function(value){
      return value == this.target_value;
    }, { 'target_value': 2 }));
  },

  'testContains': function() {
    this.assert(Fixtures.Nicknames.contains('sam-'));
    this.assert(Fixtures.Nicknames.contains('noradio'));
    this.assert(Fixtures.Basic.contains(2));

    this.assert(!Fixtures.Nicknames.contains('gmosx'));
    this.assert(!Fixtures.Basic.contains('2'));
    this.assert(!Fixtures.Basic.contains('4'));

    this.assert(Fixtures.Basic.contains(Fuse.Number(2)),
      'Should match Number object instances');

    this.assert(Fixtures.Nicknames.contains(Fuse.String('sam-')),
      'Should match String object instances');
  },

  'testEvery': function() {
    this.assert(new EnumObject([]).every());
    this.assert(new EnumObject([true, true, true]).every());

    this.assert(!new EnumObject([true, false, false]).every());
    this.assert(!new EnumObject([false, false, false]).every());

    this.assert(Fixtures.Basic.every(function(value) {
      return value > 0;
    }));

    this.assert(!Fixtures.Basic.every(function(value) {
      return value > 1;
    }));
  },

  'testEachSlice': function() {
    this.assertEnumEqual([],  new EnumObject([]).eachSlice(2));
    this.assertEqual(1,       new EnumObject([1]).eachSlice(1).length);
    this.assertEnumEqual([1], new EnumObject([1]).eachSlice(1)[0]);

    this.assertEqual(2, Fixtures.Basic.eachSlice(2).length);

    this.assertEnumEqual(
      [3, 2, 1, 11, 7, 5, 19, 17, 13, 31, 29, 23, 43, 41, 37, 59, 53, 47, 71, 67, 61, 83, 79, 73, 97, 89],
      Fixtures.Primes.eachSlice( 3, function(slice){ return slice.reverse() }).flatten()
    );

    this.assertEnumEqual(Fixtures.Basic,    Fixtures.Basic.eachSlice(-10));
    this.assertEnumEqual(Fixtures.Basic,    Fixtures.Basic.eachSlice(0));
    this.assertNotIdentical(Fixtures.Basic, Fixtures.Basic.eachSlice(0));
  },

  'testEachWithIndex': function() {
    var nicknames = [], indexes = [];
    Fixtures.People.each(function(person, index) {
      nicknames.push(person.nickname);
      indexes.push(index);
    });

    this.assertEqual(Fixtures.Nicknames.toArray().join(', '),
      nicknames.join(', '));
    this.assertEqual('0, 1, 2, 3', indexes.join(', '));
  },

  'testFilter': function() {
    this.assertEqual(Fixtures.Primes.toArray().join(', '),
      Fixtures.Z.filter(prime).toArray().join(', '));

    // test passing no arguments to filter()
    this.assertEqual(2, Fixtures.NullValues.filter().toArray().length);
    this.assertEqual(2, Fixtures.UndefinedValues.filter().toArray().length);
    this.assertEqual(3, Fixtures.ZeroValues.filter().toArray().length);
  },

  'testFirst': function() {
    this.assertUndefined(Fixtures.Empty.first());
    this.assertUndefined(Fixtures.Empty.first(function(item) { return item === 2 }));
    this.assertUndefined(Fixtures.Basic.first(function(item) { return item === 4 }));
    
    this.assertEqual(2, Fixtures.Basic.first(function(item) { return item === 2 }));
    this.assertEqual(1, Fixtures.Basic.first());
    this.assertEqual('Marcel Molina Jr.', Fixtures.People.first(function(person) {
      return person.nickname.match(/no/);
    }).name);

    this.assertEnumEqual([],      Fixtures.Empty.first(3));
    this.assertEnumEqual([1,2],   Fixtures.Basic.first(2));
    this.assertEnumEqual([1],     Fixtures.Basic.first(-3));
    this.assertEnumEqual([1,2,3], Fixtures.Basic.first(1000));
    this.assertEnumEqual([],      Fixtures.Basic.first('r0x0r5'));
  },

  'testInGroupsOf': function() {
    this.assertEnumEqual([], new EnumObject([]).inGroupsOf(3));

    var arr = new EnumObject([1, 2, 3, 4, 5, 6]).inGroupsOf(3);
    this.assertEqual(2, arr.length);
    this.assertEnumEqual(new EnumObject([1, 2, 3]), arr[0]);
    this.assertEnumEqual(new EnumObject([4, 5, 6]), arr[1]);

    arr = new EnumObject([1, 2, 3, 4, 5, 6]).inGroupsOf(4);
    this.assertEqual(2, arr.length);
    this.assertEnumEqual([1, 2, 3, 4], arr[0]);
    this.assertEnumEqual([5, 6, null, null], arr[1]);

    var basic = Fixtures.Basic;
    arr = basic.inGroupsOf(4,'x');

    this.assertEqual(1, arr.length);
    this.assertEnumEqual([1, 2, 3, 'x'], arr[0]);
    this.assertEnumEqual([1,2,3,'a'], basic.inGroupsOf(2, 'a').flatten());

    arr = basic.inGroupsOf(5, '');
    this.assertEqual(1, arr.length);
    this.assertEnumEqual([1, 2, 3, '', ''], arr[0]);

    this.assertEnumEqual([1,2,3,0],     basic.inGroupsOf(2, 0).flatten());
    this.assertEnumEqual([1,2,3,false], basic.inGroupsOf(2, false).flatten());
  },

  'testInject': function() {
    this.assertEqual(1061,
      Fixtures.Primes.inject(0, function(sum, value) {
        return sum + value;
      }));
  },
  
  'testInvoke': function() {
    var result = new EnumObject([
      new EnumObject([2, 1, 3]),
      new EnumObject([6, 5, 4])
    ]).invoke('sortBy', function(n) { return n });

    this.assertEqual(2, result.length);
    this.assertEqual('1, 2, 3', result[0].join(', '));
    this.assertEqual('4, 5, 6', result[1].join(', '));

    result = result.invoke('invoke', 'toString', 2);
    this.assertEqual('1, 10, 11', result[0].join(', '));
    this.assertEqual('100, 101, 110', result[1].join(', '));
  },

  'testInvokeOfNativeElementMethods': function() {
    var elements = new EnumObject([
      Fuse('<div title="foo"></div>'),
      Fuse('<span title="bar"></span>'),
      Fuse('<a title="baz"></a>')
    ]);

    this.assertEnumEqual(['foo', 'bar', 'baz'],
      elements.invoke('getAttribute', 'title'),
      'Should have called `getAttribute` on each decorated element.');

    // must attach input element to document before calling focus()
    elements = new EnumObject([ Fuse('<input type="text">') ]);
    document.body.appendChild(elements.first().raw);
    this.assert(Fuse.Array.isArray(elements.invoke('focus')),
      'Should return an array.');
  },

  'testLast': function() {
    this.assertUndefined(Fixtures.Empty.last());
    this.assertUndefined(Fixtures.Empty.last(function(item) { return item === 2 }));
    this.assertUndefined(Fixtures.Basic.last(function(item) { return item === 4 }));

    this.assertEqual(3, Fixtures.Basic.last());
    this.assertEqual(2, Fixtures.Basic.last(function(item) { return item === 2 }));
    this.assertEqual('Marcel Molina Jr.',
      Fixtures.People.last(function(person) { return person.nickname.match(/no/) }).name);

    this.assertEnumEqual([],      Fixtures.Empty.last(3));
    this.assertEnumEqual([2,3],   Fixtures.Basic.last(2));
    this.assertEnumEqual([3],     Fixtures.Basic.last(-3));
    this.assertEnumEqual([1,2,3], Fixtures.Basic.last(1000));
    this.assertEnumEqual([],      Fixtures.Basic.last('r0x0r5'));
  },

  'testMap': function() {
    this.assertEqual(Fixtures.Nicknames.toArray().join(', '),
      Fixtures.People.map(function(person) {
        return person.nickname;
      }).toArray().join(', '));

    this.assertEqual(26,  Fixtures.Primes.map().size());
  },

  'testMax': function() {
    this.assertEqual(100, Fixtures.Z.max());
    this.assertEqual(97,  Fixtures.Primes.max());

    this.assertEqual(2,
      new EnumObject([-9, -8, -7, -6, -4, -3, -2,  0, -1,  2]).max(),
      'failed with negative and positive numbers');

    this.assertEqual('sam-',
      Fixtures.Nicknames.max(),
      'failed comparing string values'); // ?s > ?U

    this.assertEqual('c',
      new EnumObject(['a', 'b', 'c', 'd']).max(
      function(value) { return value.charCodeAt(0) % 4 }),
      'comparing string with callback');
  },

  'testMin': function() {
    this.assertEqual(1, Fixtures.Z.min());
    this.assertEqual(0, new EnumObject([1, 2, 3, 4, 5, 6, 7, 8, 0, 9]).min());

    this.assertEqual('Ulysses',
      Fixtures.Nicknames.min(),
      'failed comparing string values'); // ?U < ?h

    this.assertEqual('d',
       new EnumObject(['a', 'b', 'c', 'd']).min(
      function(value) { return value.charCodeAt(0) % 4 }),
      'comparing string with callback');
  },

  'testPartition': function() {
    var result = Fixtures.People.partition(function(person) {
      return person.name.length < 15;
    }).invoke('pluck', 'nickname');

    this.assertEqual(2, result.length);
    this.assertEqual('sam-, htonl', result[0].join(', '));
    this.assertEqual('noradio, Ulysses', result[1].join(', '));
  },

  'testPluck': function() {
    this.assertEqual(Fixtures.Nicknames.toArray().join(', '),
      Fixtures.People.pluck('nickname').toArray().join(', '));
  },

  'testSize': function() {
    this.assertEqual(4,  Fixtures.People.size());
    this.assertEqual(4,  Fixtures.Nicknames.size());
    this.assertEqual(26, Fixtures.Primes.size());
    this.assertEqual(0,  new EnumObject([]).size());
  },

  'testSome': function() {
    this.assert(new EnumObject([true, true, true]).some());
    this.assert(new EnumObject([true, false, false]).some());

    this.assert(!new EnumObject([]).some());
    this.assert(!new EnumObject([false, false, false]).some());

    this.assert(Fixtures.Basic.some(function(value) {
      return value > 2;
    }));

    this.assert(!Fixtures.Basic.some(function(value) {
      return value > 5;
    }));
  },

  'testSortBy': function() {
    this.assertEqual('htonl, noradio, sam-, Ulysses',
      Fixtures.People.sortBy(function(value) {
        return value.nickname.toLowerCase();
      }).pluck('nickname').join(', '));
  },

  'testToArray': function() {
    var result = Fixtures.Nicknames.toArray();
    // they're different objects...
    this.assert(result != Fixtures.Nicknames);
    // but the values are the same
    this.assertEnumEqual(['sam-', 'noradio', 'htonl', 'Ulysses'], result);
  },

  'testZip': function() {
    var result = new EnumObject([1, 2, 3]).zip([4, 5, 6], [7, 8, 9]);
    this.assertEqual('[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', result.inspect());

    result = new EnumObject([1, 2, 3]).zip([4, 5, 6], [7, 8, 9],
      function(array) { return array.reverse() });

    this.assertEqual('[[7, 4, 1], [8, 5, 2], [9, 6, 3]]', result.inspect());
  }
});