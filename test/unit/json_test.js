new Test.Unit.Runner({

  'testArrayToJSON': function() {
    this.assertEqual('[]', fuse.Array().toJSON());
    this.assertEqual('[\"a\"]', fuse.Array('a').toJSON());
    this.assertEqual('[\"a\", 1]', fuse.Array('a', 1).toJSON());
    this.assertEqual('[\"a\", {\"b\": null}]', fuse.Array('a', {'b': null}).toJSON());
  },

  'testDateToJSON': function() {
    this.assertEqual('\"1970-01-01T00:00:00Z\"',
      new fuse.Date(fuse.Date.UTC(1970, 0, 1)).toJSON());
  },

  'testHashToJSON': function() {
    this.assertEqual('{\"b\": [false, true], \"c\": {\"a\": \"hello!\"}}',
      $H({ 'b': [undef, false, true, undef], c: {a: 'hello!'} }).toJSON());
  },

  'testObjectToJSON': function() {
    this.assertUndefined(fuse.Object.toJSON(undef));
    this.assertUndefined(fuse.Object.toJSON(fuse.K));

    this.assertEqual('""',       fuse.Object.toJSON(''));
    this.assertEqual('[]',       fuse.Object.toJSON([]));
    this.assertEqual('["a"]',    fuse.Object.toJSON(['a']));
    this.assertEqual('["a", 1]', fuse.Object.toJSON(['a', 1]));

    this.assertEqual('["a", {"b": null}]',
      fuse.Object.toJSON(['a', { 'b': null }]));

    this.assertEqual('{"a": "hello!"}',
      fuse.Object.toJSON({ 'a': 'hello!'}));

    this.assertEqual('{}', fuse.Object.toJSON({ }));
    this.assertEqual('{}', fuse.Object.toJSON({ 'a': undef, 'b': undef, 'c': fuse.K }));

    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      fuse.Object.toJSON({ 'b': [undef, false, true, undef], 'c': {'a':'hello!' } }));

    this.assertEqual('{"b": [false, true], "c": {"a": "hello!"}}',
      fuse.Object.toJSON($H({ 'b': [undef, false, true, undef], 'c': { 'a': 'hello!' } })));

    this.assertEqual('true',  fuse.Object.toJSON(true));
    this.assertEqual('false', fuse.Object.toJSON(false));
    this.assertEqual('null',  fuse.Object.toJSON(null));

    var Person = fuse.Class({ 'constructor': function(name) { this.name = name } });
    Person.prototype.toJSON = function() { return '-' + this.name };
    var sam = new Person('sam');

    this.assertEqual('-sam', fuse.Object.toJSON(sam));
    this.assertEqual('-sam', sam.toJSON());

    var element = $('test');
    this.assertUndefined(fuse.Object.toJSON(element));

    element.toJSON = function() { return 'I\'m a div with id test' };
    this.assertEqual('I\'m a div with id test', fuse.Object.toJSON(element));

    this.assertEqual('{"a": "A", "b": "B", "toString": "bar", "valueOf": ""}',
      fuse.Object.toJSON(Fixtures.mixed_dont_enum));
  },

  'testNumberToJSON': function() {
    this.assertEqual('null', fuse.Number(fuse.Number.NaN).toJSON());
    this.assertEqual('0',    fuse.Number(0).toJSON());
    this.assertEqual('-293', fuse.Number(-293).toJSON());
  },

  'testStringToJSON': function() {
    this.assertEqual('\"\"',     fuse.String('').toJSON());
    this.assertEqual('\"test\"', fuse.String('test').toJSON());
  },

  'testStringIsJSON': function() {
    this.assert(fuse.String('""').isJSON());
    this.assert(fuse.String('"foo"').isJSON());
    this.assert(fuse.String('{}').isJSON());
    this.assert(fuse.String('[]').isJSON());
    this.assert(fuse.String('null').isJSON());
    this.assert(fuse.String('123').isJSON());
    this.assert(fuse.String('true').isJSON());
    this.assert(fuse.String('false').isJSON());
    this.assert(fuse.String('"\\""').isJSON());

    this.assert(!fuse.String('').isJSON());
    this.assert(!fuse.String('     ').isJSON());
    this.assert(!fuse.String('\\"').isJSON());
    this.assert(!fuse.String('new').isJSON());
    this.assert(!fuse.String('\u0028\u0029').isJSON());

    // we use '@' as a placeholder for characters authorized only inside brackets,
    // so this tests make sure it is not considered authorized elsewhere.
    this.assert(!fuse.String('@').isJSON());
  },

  'testStringEvalJSON': function() {
    var valid  = fuse.String('{"test": \n\r"hello world!"}'),
     invalid   = fuse.String('{"test": "hello world!"'),
     dangerous = fuse.String('{});attackTarget = "attack succeeded!";({}');

    // use smaller huge string size for KHTML
    var size    = fuse.String(navigator.userAgent).contains('KHTML') ? 20 : 100,
     longString = '"' + fuse.String('123456789\\"').times(size * 10) + '"',
     object     = '{' + longString + ': ' + longString + '},',
     huge       = fuse.String('[' + fuse.String(object).times(size) + '{"test": 123}]');

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
      fuse.String('/*-secure- \r  \n ' + valid + ' \n  */').evalJSON().test);

    var temp = fuse.jsonFilter;
    fuse.jsonFilter = /^\/\*([\s\S]*)\*\/$/; // test custom delimiters.

    this.assertEqual('hello world!',
      fuse.String('/*' + valid + '*/').evalJSON().test);

    fuse.jsonFilter = temp;

    this.assertMatch(123,      fuse.Array.last(huge.evalJSON(true)).test);
    this.assertEqual('',       fuse.String('""').evalJSON());
    this.assertEqual('foo',    fuse.String('"foo"').evalJSON());
    this.assertEqual('object', typeof fuse.String('{}').evalJSON());

    this.assert(fuse.Array.isArray(fuse.String('[]').evalJSON()));
    this.assertNull(fuse.String('null').evalJSON());
    this.assert(123, fuse.String('123').evalJSON());

    this.assertIdentical(true,  fuse.String('true').evalJSON());
    this.assertIdentical(false, fuse.String('false').evalJSON());
    this.assertEqual('"',       fuse.String('"\\""').evalJSON());
  }
});