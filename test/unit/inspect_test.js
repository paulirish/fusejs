new Test.Unit.Runner({

  'testArrayInspect': function() {
    this.assertEqual('[]', Fuse.List().inspect());
    this.assertEqual('[1]', Fuse.List.create(1).inspect());
    this.assertEqual('[\'a\']', Fuse.List('a').inspect());
    this.assertEqual('[\'a\', 1]', Fuse.List('a', 1).inspect());

    this.assertEqual('[0, undefined, 2]',
      Fuse.List.plugin.inspect.call({ '0':0, '2':2, 'length':3 }),
      'called with an object as the `this` value');

    this.assert('[]' != Fuse.Object.inspect(Fuse.Array.plugin),
      'Failed to inspect Fuse.Array.plugin');
  },

  'testElementInspect': function() {
    var element = $('inspect_id_only');

    this.assertEqual('<div id="inspect_id_only">',
      element.inspect(),
      'element with id only');

    this.assertEqual('<div class="inspect_class_only">',
      element.next().inspect(),
      'element with className only');

    this.assertEqual('<div>',
      element.next(2).inspect(),
      'element with no className or id');

    this.assertNothingRaised(
      function() { Fuse.Object.inspect(Element) },
      'Failed to inspect Element');

    this.assertNothingRaised(
      function() { Fuse.Object.inspect(Element.Methods) },
      'Failed to inspect Element.Methods');
  },

  'testEnumerableInspect': function() {
    var EnumObject = Fuse.Class(Fuse.Enumerable, {
      'initialize': function(interior) {
        this.interior = interior;
      },

      '_each': function(callback) {
        for (key in this.interior) {
          if (Fuse.Object.hasKey(this.interior, key))
            callback(this.interior[key], key, this);
        }
      }
    });

    this.assertEqual('#<Enumerable:[]>', new EnumObject({ }).inspect());

    var many =  ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D#'];
    this.assertEqual("#<Enumerable:['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D#']>",
      new EnumObject(many).inspect());

    this.assert('#<Enumerable:[]>' != Fuse.Object.inspect(Fuse.Enumerable.plugin),
      'Failed to inspect Fuse.Enumerable.plugin');
  },

  'testEventInspect': function() {
    this.assert('[object Event]' != Fuse.Object.inspect(Event.Methods),
      'Failed to inspect Event.Methods');
  },

  'testHashInspect': function() {
    this.assertEqual('#<Hash:{}>', $H({ }).inspect());

    var one = { 'a': 'A#' };
    this.assertEqual("#<Hash:{'a': 'A#'}>",
      $H(one).inspect());

    var many =  { 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D#' };
    this.assertEqual("#<Hash:{'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D#'}>",
      $H(many).inspect());

    var mixed_dont_enum = { 'a': 'A', 'b': 'B', 'toString': 'bar', 'valueOf': '' };
    this.assertEqual("#<Hash:{'a': 'A', 'b': 'B', 'toString': 'bar', 'valueOf': ''}>",
      $H(mixed_dont_enum).inspect());

    this.assertNothingRaised(
      function() {Fuse.Object.inspect(Fuse.Hash.plugin) },
      'Failed to inspect Fuse.Hash.plugin');
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

  'testStringInspect': function() {
    this.assertEqual('\'\'',
      Fuse.String('').inspect());

    this.assertEqual('\'test\'',
      Fuse.String('test').inspect());

    this.assertEqual('\'test \\\'test\\\' "test"\'',
      Fuse.String('test \'test\' "test"').inspect());

    this.assertEqual('\"test \'test\' \\"test\\"\"',
      Fuse.String('test \'test\' "test"').inspect(true));

    this.assertEqual('\'\\b\\t\\n\\f\\r"\\\\\'',
      Fuse.String('\b\t\n\f\r"\\').inspect());

    this.assertEqual('\"\\b\\t\\n\\f\\r\\"\\\\\"',
      Fuse.String('\b\t\n\f\r"\\').inspect(true));

    this.assertEqual('\'\\b\\t\\n\\f\\r\'',
      Fuse.String('\x08\x09\x0a\x0c\x0d').inspect());

    this.assertEqual('\'\\u001a\'',
      Fuse.String('\x1a').inspect());

    this.assertNothingRaised(
      function() {Fuse.Object.inspect(Fuse.String.plugin) },
      'Failed to inspect Fuse.String.plugin');
  }
});