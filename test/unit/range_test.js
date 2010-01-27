new Test.Unit.Runner({

  'testInclude': function() {
    this.assert($R(0, 5, true).contains(0));
    this.assert($R(0, 5, true).contains(4));

    this.assert($R(0, 0, false).contains(0));
    this.assert($R(0, 5, false).contains(0));
    this.assert($R(0, 5, false).contains(5));

    this.assert(!$R(0, 0, true).contains(0));
    this.assert(!$R(0, 5, true).contains(5));
    this.assert(!$R(0, 5, false).contains(6));
  },

  'testEach': function() {
    var results = [];
    $R(0, 0, true).each(function(value) {
      results.push(value);
    });

    this.assertEnumEqual([], results);

    results = [];
    $R(0, 3, false).each(function(value) {
      results.push(value);
    });

    this.assertEnumEqual([0, 1, 2, 3], results);
  },

  'testAny': function() {
    this.assert(!$R(1, 1, true).some());
    this.assert($R(0, 3, false).some(function(value) {
      return value == 3;
    }));
  },

  'testAll': function() {
    this.assert($R(1, 1, true).every());
    this.assert($R(0, 3, false).every(function(value) {
      return value <= 3;
    }));
  },

  'testToArray': function() {
    this.assertEnumEqual([],     $R(0, 0, true).toArray());
    this.assertEnumEqual([0],    $R(0, 0, false).toArray());
    this.assertEnumEqual([0],    $R(0, 1, true).toArray());
    this.assertEnumEqual([0, 1], $R(0, 1, false).toArray());

    this.assertEnumEqual([-3, -2, -1, 0, 1, 2],     $R(-3, 3, true).toArray());
    this.assertEnumEqual([-3, -2, -1, 0, 1, 2, 3],  $R(-3, 3, false).toArray());
    this.assertEnumEqual(['a', 'b', 'c', 'd', 'e'], $R('a', 'e').toArray());
  },

  'testDefaultsToNotExclusive': function() {
    this.assertEnumEqual($R(-3, 3), $R(-3, 3, false));
  },

  'testMax': function() {
    this.assertEqual(4,   $R(0, 5, true).max(),
     'exclusive numeric range');

    this.assertEqual(5, $R(0, 5).max(),
      'non-exclusive numeric range');

    this.assertEqual('c', $R('a', 'd', true).max(),
     'exclusive character range');

    this.assertEqual('d', $R('a', 'd').max(),
      'non-exclusive character range');

    this.assertEqual('c', $R('a', 'd').max(
      function(value) { return value.charCodeAt(0) % 4 }),
      'non-exclusive character range with callback');

    this.assertRespondsTo('succ', $R('a', 'c').max(),
      'failed to return an extended String object');

    this.assertRespondsTo('succ', $R(0, 3).max(),
      'failed to return an extended Number object');
  },

  'testMin': function() {
    this.assertEqual(1,   $R(1, 5, true).min(),
     'exclusive numeric range');

    this.assertEqual(0, $R(0, 5).min(),
      'non-exclusive numeric range');

    this.assertEqual('b', $R('b', 'd', true).min(),
     'exclusive character range');

    this.assertEqual('a', $R('a', 'd').min(),
      'non-exclusive character range');

    this.assertEqual('d', $R('a', 'd').min(
      function(value) { return value.charCodeAt(0) % 4 }),
      'non-exclusive character range with callback');

    this.assertRespondsTo('succ', $R('a', 'c').min(),
      'failed to return an extended String object');

    this.assertRespondsTo('succ', $R(0, 3).min(),
      'failed to return an extended Number object');
  },

  'testRangeCache': function() {
    var range = $R(-2, 2);
    range.toArray();
    this.assertEnumEqual([-2, -1, 0, 1, 2], range.toArray());

    range.exclusive = true;
    this.assertEnumEqual([-2, -1, 0, 1], range.toArray());

    range.start = 3;
    range.end   = 6;
    range.exclusive = false;
    this.assertEnumEqual([3, 4, 5, 6], range.toArray());
  },

  'testSize': function() {
    var range = $R(-1, 10);
    this.assertEqual(12, range.size(),
      'non-exclusive numeric range');

    range = $R(-1, 10, true);
    this.assertEqual(11, range.size(),
      'non-cached of exclusive numeric range');

    range._each(fuse.emptyFunction);
    this.assertEqual(11, range._cache.length,
      'cached exclusive numberic range');

    range = $R('a', 'd');
    this.assertEqual(4, range.size(),
      'non-exclusive character range');

    range = $R('a', 'd', true);
    this.assertEqual(3, range.size(),
      'exclusive character range');

    range._each(fuse.emptyFunction);
    this.assertEqual(3, range._cache.length,
      'cached exclusive character range');

    this.assertRespondsTo('succ', range.size(),
      'failed to return an extended native');
  }
});