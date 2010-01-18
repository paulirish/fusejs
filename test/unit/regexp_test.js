new Test.Unit.Runner({

  'testRegExpClone': function() {
    var pattern = /[a-z]([a-z])\1/g;

    this.assertEqual(pattern.source, Fuse.RegExp.clone(pattern).source,
      'Clones `source` property does not match reference pattern\'s `source`.');

    this.assert(pattern.global,
      'Regexp objects do *not* have `global` property.');

    this.assert(!Fuse.RegExp.clone(pattern, { 'global':false }).global,
      'Failed to change `global` flag on clone.');

    this.assert(!pattern.ignoreCase, '`ignoreCase` should be false on reference pattern');

    this.assert(Fuse.RegExp.clone(pattern, { 'ignoreCase':true }).ignoreCase,
      'Failed to change `ignoreCase` flag on clone.');

    this.assert(!pattern.multiline, '`multiline` should be false on reference pattern');

    this.assert(Fuse.RegExp.clone(pattern, { 'multiline':true }).multiline,
      'Failed to change `multiline` flag on clone.');

    var source = 'foobar baabang';
    this.assertEnumEqual(['foo', 'o'], source.match(Fuse.RegExp.clone(pattern, { 'global': false })),
      'Clone did not respect the `global` flag as false.');

    this.assertEnumEqual(['foo', 'baa'], source.match(Fuse.RegExp.clone(pattern)),
      'Clone did not respect the `global` flag as true.');

    pattern = /(?:lower|Upper)/g;
    source  = 'lower Upper UPPER';

    this.assertEnumEqual(['lower', 'Upper', 'UPPER'], source.match(
      Fuse.RegExp.clone(pattern, { 'ignoreCase': true })),
      'Clone did not respect the ignoreCase flag as true.');

    this.assertEnumEqual(['lower', 'Upper'], source.match(
      Fuse.RegExp.clone(pattern, { 'ignoreCase': false })),
      'Clone did not respect the` ignoreCase` flag as false.');

    pattern = /^a.*?z$/; source = 'abcxyz\n123\nahh onooz';

    this.assertEnumEqual(['abcxyz'], source.match(
      Fuse.RegExp.clone(pattern, { 'multiline': true })),
      'Clone did not respect the `multiline` flag as true.');

    this.assertEnumEqual(['abcxyz', 'ahh onooz'], source.match(
      Fuse.RegExp.clone(pattern, { 'multiline': true, 'global': true })),
      'Clone did not respect flag combination of `multiline` flag as true and `global` flag as true.');

    this.assertNull(source.match(
      Fuse.RegExp.clone(pattern, { 'multiline': false })),
      'Clone did not respect the `multiline` flag as false.');
  },

  'testRegExpEscape': function() {
    this.assertEqual('word',                Fuse.RegExp.escape('word'));
    this.assertEqual('\\/slashes\\/',       Fuse.RegExp.escape('/slashes/'));
    this.assertEqual('\\\\backslashes\\\\', Fuse.RegExp.escape('\\backslashes\\'));
    this.assertEqual('\\\\border of word',  Fuse.RegExp.escape('\\border of word'));

    this.assertEqual('\\(\\?\\:non-capturing\\)',
      Fuse.RegExp.escape('(?:non-capturing)'));

    this.assertEqual('non-capturing',
      new RegExp(Fuse.RegExp.escape('(?:') + '([^)]+)').exec('(?:non-capturing)')[1]);

    this.assertEqual('\\(\\?\\=positive-lookahead\\)',
      Fuse.RegExp.escape('(?=positive-lookahead)'));

    this.assertEqual('positive-lookahead',
      new RegExp(Fuse.RegExp.escape('(?=') + '([^)]+)').exec('(?=positive-lookahead)')[1]);

    this.assertEqual('\\(\\?<\\=positive-lookbehind\\)',
      Fuse.RegExp.escape('(?<=positive-lookbehind)'));

    this.assertEqual('positive-lookbehind',
      new RegExp(Fuse.RegExp.escape('(?<=') + '([^)]+)').exec('(?<=positive-lookbehind)')[1]);

    this.assertEqual('\\(\\?\\!negative-lookahead\\)',
      Fuse.RegExp.escape('(?!negative-lookahead)'));

    this.assertEqual('negative-lookahead',
      new RegExp(Fuse.RegExp.escape('(?!') + '([^)]+)').exec('(?!negative-lookahead)')[1]);

    this.assertEqual('\\(\\?<\\!negative-lookbehind\\)',
      Fuse.RegExp.escape('(?<!negative-lookbehind)'));

    this.assertEqual('negative-lookbehind',
      new RegExp(Fuse.RegExp.escape('(?<!') + '([^)]+)').exec('(?<!negative-lookbehind)')[1]);

    this.assertEqual('\\[\\\\w\\]\\+', Fuse.RegExp.escape('[\\w]+'));

    this.assertEqual('character class',
      new RegExp(Fuse.RegExp.escape('[') + '([^\\]]+)').exec('[character class]')[1]);

    this.assertEqual('<div>',
      new RegExp(Fuse.RegExp.escape('<div>')).exec('<td><div></td>')[0]);

    this.assertEqual('false',     Fuse.RegExp.escape(false));
    this.assertEqual('undefined', Fuse.RegExp.escape());
    this.assertEqual('null',      Fuse.RegExp.escape(null));
    this.assertEqual('42',        Fuse.RegExp.escape(42));

    this.assertEqual('\\\\n\\\\r\\\\t', Fuse.RegExp.escape('\\n\\r\\t'));
    this.assertEqual('\n\r\t',          Fuse.RegExp.escape('\n\r\t'));
    this.assertEqual('\\{5,2\\}',       Fuse.RegExp.escape('{5,2}'));

    this.assertEqual(
      '\\/\\(\\[\\.\\*\\+\\?\\^\\=\\!\\:\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\\\\/\\\\\\\\\\]\\)\\/g',
      Fuse.RegExp.escape('/([.*+?^=!:${}()|[\\]\\/\\\\])/g')
    );
  }
});