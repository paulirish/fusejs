new Test.Unit.Runner({

  'testArrayToJSON': function() {
    this.assertEqual('[]', Fuse.List().toJSON());
    this.assertEqual('[\"a\"]', Fuse.List('a').toJSON());
    this.assertEqual('[\"a\", 1]', Fuse.List('a', 1).toJSON());
    this.assertEqual('[\"a\", {\"b\": null}]', Fuse.List('a', {'b': null}).toJSON());
  },

  'testDateToJSON': function() {
    this.assertEqual('\"1970-01-01T00:00:00Z\"',
      new Fuse.Date(Fuse.Date.UTC(1970, 0, 1)).toJSON());
  },

  'testHashToJSON': function() {
    this.assertEqual('{\"b\": [false, true], \"c\": {\"a\": \"hello!\"}}',
      $H({ 'b': [undef, false, true, undef], c: {a: 'hello!'} }).toJSON());
  },

  'testObjectToJSON': function() {
    this.assertUndefined(Fuse.Object.toJSON(undef));
    this.assertUndefined(Fuse.Object.toJSON(Fuse.K));

    this.assertEqual('""',       Fuse.Object.toJSON(''));
    this.assertEqual('[]',       Fuse.Object.toJSON([]));
    this.assertEqual('["a"]',    Fuse.Object.toJSON(['a']));
    this.assertEqual('["a", 1]', Fuse.Object.toJSON(['a', 1]));

    this.assertEqual('["a", {"b": null}]',
      Fuse.Object.toJSON(['a', { 'b': null }]));

    this.assertEqual('{"a": "hello!"}',
      Fuse.Object.toJSON({ 'a': 'hello!'}));

    this.assertEqual('{}', Fuse.Object.toJSON({ }));
    this.assertEqual('{}', Fuse.Object.toJSON({ 'a': undef, 'b': undef, 'c': Fuse.K }));

    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      Fuse.Object.toJSON({ 'b': [undef, false, true, undef], 'c': {'a':'hello!' } }));

    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      Fuse.Object.toJSON($H({ 'b': [undef, false, true, undef], 'c': { 'a': 'hello!' } })));

    this.assertEqual('true',  Fuse.Object.toJSON(true));
    this.assertEqual('false', Fuse.Object.toJSON(false));
    this.assertEqual('null',  Fuse.Object.toJSON(null));

    var Person = Fuse.Class({ 'constructor': function(name) { this.name = name } });
    Person.prototype.toJSON = function() { return '-' + this.name };
    var sam = new Person('sam');

    this.assertEqual('-sam', Fuse.Object.toJSON(sam));
    this.assertEqual('-sam', sam.toJSON());

    var element = $('test');
    this.assertUndefined(Fuse.Object.toJSON(element));

    element.toJSON = function() { return 'I\'m a div with id test' };
    this.assertEqual('I\'m a div with id test', Fuse.Object.toJSON(element));

    this.assertEqual('{"a": "A", "b": "B", "toString": "bar", "valueOf": ""}',
      Fuse.Object.toJSON(Fixtures.mixed_dont_enum));
  },

  'testNumberToJSON': function() {
    this.assertEqual('null', Fuse.Number(Fuse.Number.NaN).toJSON());
    this.assertEqual('0',    Fuse.Number(0).toJSON());
    this.assertEqual('-293', Fuse.Number(-293).toJSON());
  },

  'testStringToJSON': function() {
    this.assertEqual('\"\"',     Fuse.String('').toJSON());
    this.assertEqual('\"test\"', Fuse.String('test').toJSON());
  },

  'testStringIsJSON': function() {
    this.assert(Fuse.String('""').isJSON());
    this.assert(Fuse.String('"foo"').isJSON());
    this.assert(Fuse.String('{}').isJSON());
    this.assert(Fuse.String('[]').isJSON());
    this.assert(Fuse.String('null').isJSON());
    this.assert(Fuse.String('123').isJSON());
    this.assert(Fuse.String('true').isJSON());
    this.assert(Fuse.String('false').isJSON());
    this.assert(Fuse.String('"\\""').isJSON());

    this.assert(!Fuse.String('').isJSON());
    this.assert(!Fuse.String('     ').isJSON());
    this.assert(!Fuse.String('\\"').isJSON());
    this.assert(!Fuse.String('new').isJSON());
    this.assert(!Fuse.String('\u0028\u0029').isJSON());

    // we use '@' as a placeholder for characters authorized only inside brackets,
    // so this tests make sure it is not considered authorized elsewhere.
    this.assert(!Fuse.String('@').isJSON());
  },

  'testStringEvalJSON': function() {
    var valid  = Fuse.String('{"test": \n\r"hello world!"}'),
     invalid   = Fuse.String('{"test": "hello world!"'),
     dangerous = Fuse.String('{});attackTarget = "attack succeeded!";({}');

    // use smaller huge string size for KHTML
    var size    = Fuse.String(navigator.userAgent).contains('KHTML') ? 20 : 100,
     longString = '"' + Fuse.String('123456789\\"').times(size * 10) + '"',
     object     = '{' + longString + ': ' + longString + '},',
     huge       = Fuse.String('[' + Fuse.String(object).times(size) + '{"test": 123}]');

    this.assertEqual('hello world!', valid.evalJSON().test);
    this.assertEqual('hello world!', valid.evalJSON(true).test);
    this.assertRaise('SyntaxError', function() { invalid.evalJSON() });
    this.assertRaise('SyntaxError', function() { invalid.evalJSON(true) });

    attackTarget = 'scared';
    dangerous.evalJSON();
    this.assertEqual('attack succeeded!', attackTarget);

    attackTarget = 'Not scared!';
    this.assertRaise('SyntaxError', function(){ dangerous.evalJSON(true) });
    this.assertEqual('Not scared!', attackTarget);

    this.assertEqual('hello world!',
      Fuse.String('/*-secure- \r  \n ' + valid + ' \n  */').evalJSON().test);

    var temp = Fuse.jsonFilter;
    Fuse.jsonFilter = /^\/\*([\s\S]*)\*\/$/; // test custom delimiters.

    this.assertEqual('hello world!',
      Fuse.String('/*' + valid + '*/').evalJSON().test);

    Fuse.jsonFilter = temp;

    this.assertMatch(123,      Fuse.List.last(huge.evalJSON(true)).test);
    this.assertEqual('',       Fuse.String('""').evalJSON());
    this.assertEqual('foo',    Fuse.String('"foo"').evalJSON());
    this.assertEqual('object', typeof Fuse.String('{}').evalJSON());

    this.assert(Fuse.List.isArray(Fuse.String('[]').evalJSON()));
    this.assertNull(Fuse.String('null').evalJSON());
    this.assert(123, Fuse.String('123').evalJSON());

    this.assertIdentical(true,  Fuse.String('true').evalJSON());
    this.assertIdentical(false, Fuse.String('false').evalJSON());
    this.assertEqual('"',       Fuse.String('"\\""').evalJSON());
  }
});