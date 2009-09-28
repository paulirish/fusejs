new Test.Unit.Runner({

  'testIsRunningFromRake':  function() {
    if (Fuse.String.startsWith(window.location.href, 'http')) {
      this.assert(this.isRunningFromRake);
      this.info('These tests are running from rake.')
    }
    else {
      this.assert(!this.isRunningFromRake);
      this.info('These tests are *not* running from rake.')
    }
  },

  'testBuildMessage':  function() {
    this.assertEqual("'foo' 'bar'", this.buildMessage('', '? ?', 'foo', 'bar'))
  },

  'testAssertEqual': function() {
    this.assertEqual(0, 0);
    this.assertEqual(0, 0, 'test');

    this.assertEqual(0,'0');
    this.assertEqual(65.0, 65);

    this.assertEqual('a', 'a');
    this.assertEqual('a', 'a', 'test');

    this.assertNotEqual(0, 1);
    this.assertNotEqual('a', 'b');
    this.assertNotEqual({ }, { });
    this.assertNotEqual([],  []);
    this.assertNotEqual([],  { });
  },

  'testAssertEnumEqual': function() {
    this.assertEnumEqual([], []);
    this.assertEnumEqual(['a', 'b'], ['a', 'b']);
    this.assertEnumEqual(['1', '2'], [1, 2]);
    this.assertEnumNotEqual(['1', '2'], [1, 2, 3]);
  },

  'testAssertHashEqual': function() {
    this.assertHashEqual({}, {});
    this.assertHashEqual({ 'a': 'b'}, {'a': 'b' });
    this.assertHashEqual({ 'a': 'b', 'c': 'd' }, { 'c': 'd', 'a': 'b' });
    this.assertHashNotEqual({ 'a': 'b', 'c': 'd' }, { 'c': 'd', 'a': 'boo!' });
  },

  'testAssertRespondsTo': function() {
    this.assertRespondsTo('isNice',   testObj);
    this.assertRespondsTo('isBroken', testObj);
  },

  'testAssertIdentical': function() {
    this.assertIdentical(0, 0);
    this.assertIdentical(0, 0, 'test');
    this.assertIdentical(1, 1);
    this.assertIdentical('a', 'a');
    this.assertIdentical('a', 'a', 'test');
    this.assertIdentical('', '');
    this.assertIdentical(undef, undef);
    this.assertIdentical(null, null);
    this.assertIdentical(true, true);
    this.assertIdentical(false, false);

    var obj = { 'a': 'b' };
    this.assertIdentical(obj, obj);

    this.assertNotIdentical({ '1': 2, '3': 4 }, { '1': 2, '3': 4 });

    this.assertIdentical(1, 1.0); // both are typeof == 'number'

    this.assertNotIdentical(1, '1');
    this.assertNotIdentical(1, '1.0');
  },

  'testAssertNullAndAssertUndefined': function() {
    this.assertNull(null);

    this.assertNotNull(undef);
    this.assertNotNull(0);
    this.assertNotNull('');

    this.assertNotUndefined(null);
    this.assertNotUndefined(0);
    this.assertNotUndefined('');
    
    this.assertNullOrUndefined(null);
    this.assertNullOrUndefined(undef);

    this.assertNotNullOrUndefined(0);
    this.assertNotNullOrUndefined('');

    this.assertUndefined(undef);
  },

  'testAssertMatch': function() {
    this.assertMatch(/knowmad.jpg$/, 'http://script.aculo.us/images/knowmad.jpg');
    this.assertMatch(/Fuc/, 'Thomas Fuchs');

    this.assertMatch(/^\$(\d{1,3}(\,\d{3})*|(\d+))(\.\d{2})?$/,
      '$19.95');

    this.assertMatch(/(\d{3}\) ?)|(\d{3}[- \.])?\d{3}[- \.]\d{4}(\s(x\d+)?){0,1}$/,
      '704-343-9330');

    this.assertMatch(/^(?:(?:(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)(?:0?2\1(?:29)))|(?:(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:(?:0?[13578]|1[02])\2(?:31))|(?:(?:0?[1,3-9]|1[0-2])\2(29|30))|(?:(?:0?[1-9])|(?:1[0-2]))\2(?:0?[1-9]|1\d|2[0-8]))))$/,
      '2001-06-16');

    this.assertMatch(/^((0?[123456789])|(1[012]))\s*:\s*([012345]\d)(\s*:\s*([012345]\d))?\s*[ap]m\s*-\s*((0?[123456789])|(1[012]))\s*:\s*([012345]\d)(\s*:\s*([012345]\d))?\s*[ap]m$/i,
      '2:00PM-2:15PM');

    this.assertNoMatch(/zubar/, 'foo bar');
  },

  'testAssertInstanceOf': function() {
    this.assertInstanceOf(String, new String);
    this.assertInstanceOf(RegExp, /foo/);
    this.assertNotInstanceOf(String, { });
  },

  'testAssertVisible': function() {
    this.assertVisible('testcss1');
    this.assertNotVisible('testcss1_span');
    //this.assertNotVisible('testcss2', 'Due to a Safari bug, this test fails in Safari.');

    $('testcss1').hide();
    this.assertNotVisible('testcss1');
    this.assertNotVisible('testcss1_span');

    $('testcss1').show();
    this.assertVisible('testcss1');
    this.assertNotVisible('testcss1_span');

    $('testcss1_span').show();
    this.assertVisible('testcss1_span');

    $('testcss1').hide();
    this.assertNotVisible('testcss1_span'); // hidden by parent
  },

  'testAssertElementsMatch': function() {
    this.assertElementsMatch($$('#tlist'), '#tlist');
    this.assertElementMatches($('tlist'),  '#tlist');
  }
});

/*--------------------------------------------------------------------------*/

new Test.Unit.Runner({
  'testDummy': function() {
    this.assert(true);
  },

  'testMultipleTestRunner': function() {
    this.assertEqual('passed', $('testlog_2').down('td', 1).raw.innerHTML);
  }
}, { 'testLog': 'testlog_2' });