new Test.Unit.Runner({

  'testNumberMathMethods': function() {
    this.assertEqual(1,  Fuse.Number(0.9).round());
    this.assertEqual(-2, Fuse.Number(-1.9).floor());
    this.assertEqual(-1, Fuse.Number(-1.9).ceil());

    var PI = Fuse.Number(Math.PI);
    $w('abs floor round ceil').each(function(method) {
      this.assertEqual(Math[method](Math.PI), PI[method]());
    }, this);
  },

  'testNumberToColorPart': function() {
    this.assertEqual('00', Fuse.Number(0).toColorPart());
    this.assertEqual('0a', Fuse.Number(10).toColorPart());
    this.assertEqual('ff', Fuse.Number(255).toColorPart());
    this.assertEqual('ff', Fuse.Number.toColorPart('255'),
      'non-number value');
  },

  'testNumberToPaddedString': function() {
    this.assertEqual('00',   Fuse.Number(0).toPaddedString(2, 16));
    this.assertEqual('0a',   Fuse.Number(10).toPaddedString(2, 16));
    this.assertEqual('ff',   Fuse.Number(255).toPaddedString(2, 16));
    this.assertEqual('000',  Fuse.Number(0).toPaddedString(3));
    this.assertEqual('010',  Fuse.Number(10).toPaddedString(3));
    this.assertEqual('100',  Fuse.Number(100).toPaddedString(3));
    this.assertEqual('1000', Fuse.Number(1000).toPaddedString(3));

    this.assertEqual('00000012', Fuse.Number(12).toPaddedString(8),
      'length longer than default pad');

    this.assertEqual('12',  Fuse.Number(12).toPaddedString(1),
      'shorter than default pad');

    this.assertEqual('100', Fuse.Number.toPaddedString('100', 3),
      'non-number value');

    this.assertEqual('00',  Fuse.Number.toPaddedString('abc', 2),
      'non-number value');
  },

  'testNumberTimes': function() {
    var results = [];
    Fuse.Number(5).times(function(i) { results.push(i) });
    this.assertEnumEqual([0, 1, 2, 3, 4], results);

    results = [];
    Fuse.Number(5).times(function(i) { results.push(i * this.i) }, { 'i': 2 });
    this.assertEnumEqual([0, 2, 4, 6, 8], results);

    results = [];
    Fuse.Number.times('5', function(i) { results.push(i) });
    this.assertEnumEqual([0, 1, 2, 3, 4], results,
      'non-number value');
  }
});