new Test.Unit.Runner({
  
  testInclude: function() {
    this.assert(!$R(0, 0, true).contains(0));
    this.assert($R(0, 0, false).contains(0));

    this.assert($R(0, 5, true).contains(0));
    this.assert($R(0, 5, true).contains(4));
    this.assert(!$R(0, 5, true).contains(5));

    this.assert($R(0, 5, false).contains(0));
    this.assert($R(0, 5, false).contains(5));
    this.assert(!$R(0, 5, false).contains(6));
  },

  testEach: function() {
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

  testAny: function() {
    this.assert(!$R(1, 1, true).some());
    this.assert($R(0, 3, false).some(function(value) {
      return value == 3;
    }));
  },

  testAll: function() {
    this.assert($R(1, 1, true).every());
    this.assert($R(0, 3, false).every(function(value) {
      return value <= 3;
    }));
  },

  testToArray: function() {
    this.assertEnumEqual([], $R(0, 0, true).toArray());
    this.assertEnumEqual([0], $R(0, 0, false).toArray());
    this.assertEnumEqual([0], $R(0, 1, true).toArray());
    this.assertEnumEqual([0, 1], $R(0, 1, false).toArray());
    this.assertEnumEqual([-3, -2, -1, 0, 1, 2], $R(-3, 3, true).toArray());
    this.assertEnumEqual([-3, -2, -1, 0, 1, 2, 3], $R(-3, 3, false).toArray());
    this.assertEnumEqual(['a', 'b', 'c', 'd', 'e'], $R('a', 'e').toArray());
  },
  
  testDefaultsToNotExclusive: function() {
    this.assertEnumEqual($R(-3,3), $R(-3,3,false));
  },
  
  testRangeCache: function() {
    var range = $R(-2, 2);
    range.toArray();
    this.assertEnumEqual([-2, -1, 0, 1, 2], range.toArray());

    range.exclusive = true;
    this.assertEnumEqual([-2, -1, 0, 1], range.toArray());

    range.start = 3;
    range.end   = 6;
    range.exclusive = false;
    this.assertEnumEqual([3, 4, 5, 6], range.toArray());
  }
});