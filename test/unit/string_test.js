new Test.Unit.Runner({

  'testInterpret': function(){
    this.assertEqual('true',    Fuse.String.interpret(true));
    this.assertEqual('123',     Fuse.String.interpret(123));
    this.assertEqual('foo bar', Fuse.String.interpret('foo bar'));
    this.assertEqual('object string',
      Fuse.String.interpret({ 'toString': function(){ return 'object string' } }));

    this.assertEqual('0',     Fuse.String.interpret(0));
    this.assertEqual('false', Fuse.String.interpret(false));
    this.assertEqual('',      Fuse.String.interpret(undef));
    this.assertEqual('',      Fuse.String.interpret(null));
    this.assertEqual('',      Fuse.String.interpret(''));
  },

  'testGsubWithReplacementFunction': function() {
    var source = Fuse.String('foo boo boz');

    this.assertEqual('Foo Boo BoZ',
      source.gsub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }));

    this.assertEqual('f2 b2 b1z',
      source.gsub(/o+/, function(match) {
        return match[0].length;
      }));

    this.assertEqual('f0 b0 b1z',
      source.gsub(/o+/, function(match) {
        return match[0].length % 2;
      }));
  },

  'testGsubWithReplacementString': function() {
    var source = Fuse.String('foo boo boz');

    this.assertEqual('foobooboz',
      source.gsub(/\s+/, ''));
    this.assertEqual('  z',
      source.gsub(/(.)(o+)/, ''));

    this.assertEqual('ウィメンズ2007<br/>クルーズコレクション',
      Fuse.String('ウィメンズ2007\nクルーズコレクション').gsub(/\n/,'<br/>'));

    this.assertEqual('ウィメンズ2007<br/>クルーズコレクション',
      Fuse.String('ウィメンズ2007\nクルーズコレクション').gsub('\n','<br/>'));
  },

  'testGsubWithReplacementTemplateString': function() {
    var source = Fuse.String('foo boo boz');

    this.assertEqual('-oo-#{1}- -oo-#{1}- -o-#{1}-z',
      source.gsub(/(.)(o+)/, '-#{2}-\\#{1}-'));

    this.assertEqual('-foo-f- -boo-b- -bo-b-z',
      source.gsub(/(.)(o+)/, '-#{0}-#{1}-'));

    this.assertEqual('-oo-f- -oo-b- -o-b-z',
      source.gsub(/(.)(o+)/, '-#{2}-#{1}-'));

    this.assertEqual('  z',
      source.gsub(/(.)(o+)/, '#{3}'));
  },

  'testGsubEscapesRegExpSpecialCharacters': function() {
    this.assertEqual('happy Smyle',
      Fuse.String('happy :-)').gsub(':-)', 'Smyle'));

    this.assertEqual('sad Frwne',
      Fuse.String('sad >:($').gsub('>:($', 'Frwne'));

    this.assertEqual('ab', Fuse.String('a|b').gsub('|', ''));
    this.assertEqual('ab', Fuse.String('ab(?:)').gsub('(?:)', ''));
    this.assertEqual('ab', Fuse.String('ab()').gsub('()', ''));
    this.assertEqual('ab', Fuse.String('ab').gsub('^', ''));
    this.assertEqual('ab', Fuse.String('a?b').gsub('?', ''));
    this.assertEqual('ab', Fuse.String('a+b').gsub('+', ''));
    this.assertEqual('ab', Fuse.String('a*b').gsub('*', ''));
    this.assertEqual('ab', Fuse.String('a{1}b').gsub('{1}', ''));
    this.assertEqual('ab', Fuse.String('a.b').gsub('.', ''));
  },

  'testMatch': function() {
    var source = Fuse.String('oxo'), pattern = /x/g;
    source.match(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'wrongly set lastIndex on global pattern');

    pattern = /x/;
    source.match(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'wrongly set lastIndex on non-global pattern');
  },

  'testReplace': function() {
    var source = Fuse.String('321abc123'), expected = '321xyz123';
    this.assertEqual(expected, source.replace('abc', 'xyz'),
      'simple string pattern.');

    var args = [], slice = Array.prototype.slice;
    this.assertEqual('_abc_', source.replace(/\d+/g, function() {
      args.push(slice.call(arguments, 0));
      return '_';
    }), 'function as replace.');

    this.assertEnumEqual(['321', 0, '321abc123'], args[0],
      'Failed to pass the proper arguments to the replacement function.');

    this.assertEqual(2, args.length,
      'Failed to execute the function for each replacement.');

    // more regexp and function tests
    var source = Fuse.String('foo boo boz');
    this.assertEqual('Foo boo boz',
      source.replace(/[^o]+/, function(string) {
        return string.toUpperCase();
      }), 'simple regexp pattern');

    this.assertEqual('Foo Boo BoZ',
      source.replace(/[^o]+/g, function(string) {
        return string.toUpperCase();
      }), 'global flag');

    this.assertEqual('bar boo boz',
      source.replace(/FOO/i, function() {
        return 'bar';
      }), 'case insensitive flag');

    this.assertEqual(source,
      source.replace('.*', Fuse.emptyFunction),
      'regular expression characters escaped');

    this.assertEqual(source,
      source.replace('X', Fuse.emptyFunction),
      'no occurence to replace');

    /*
    // crashes Safari 3.4 beta
    var test = this;
    source.replace(/(b(?:o)(z))/, function(substring, group1, group2, offset, string) {
      test.assertIdentical(window, this);
      test.assertEqual(5, arguments.length);
      test.assertEqual('boz', substring);
      test.assertEqual('boz', group1);
      test.assertEqual('z', group2);
      test.assertEqual(8, offset);
      test.assertEqual(source, string);
    });
    */

    this.assertEqual('foo undefined boz',
      source.replace('boo', Fuse.emptyFunction), 'undefined return value');

    this.assertEqual('foo null boz',
      source.replace('boo', function() {
        return null;
      }), 'null return value');

    this.assertEqual('-foo boo boz',
      source.replace(/|/, function() {
        return '-';
      }), 'empty matching regexp');

    this.assertEqual('-f-o-o- -- -b-o-z-',
      source.replace(/boo|/g, function() {
        return '-';
    }), 'empty matching regexp with global flag');

    var pattern = /boo/g;
    pattern.lastIndex = source.length;
    this.assertEqual('foo bar boz',
      source.replace(pattern, function() {
        return 'bar';
      }), 'lastIndex ignored');

    // index and source
    var source = Fuse.String('foo boo boz');
    this.assertEqual('f1 b5 b9z', source.replace(/o+/g, function(match, index) {
      return index;
    }), 'Given incorrect index argument');

    this.assertEqual('foo boo bofoo boo boz',
      source.replace(/.$/, function(match, index, source) {
        return source;
      }), 'Given incorrect source argument');

    // test empty
    var expected, pattern,
     source = Fuse.String('awesome'), replacement = function() { return 'x' };

    expected = 'xxsxoxmxex'; pattern = new RegExp('(awe|)', 'g');
    this.assertEqual(expected, source.replace(pattern, replacement));

    expected = 'awesomex'; pattern = new RegExp('(awe|)$', 'g');
    this.assertEqual(expected, source.replace(pattern, replacement));

    expected = 'xawesome'; pattern = /()/;
    this.assertEqual(expected, source.replace(pattern, replacement));

    expected = 'xaxwxexsxoxmxex'; pattern = /()/g;
    this.assertEqual(expected, source.replace(pattern, replacement));

    pattern = new RegExp('','g');
    this.assertEqual(expected, source.replace(pattern, replacement));
  },

  'testSubstitutionEdgeCases': function() {
    var source = Fuse.String('abc');

    this.assertEqual('-a-b-c-',
      source.gsub('', '-'),
      'empty string');

    this.assertEqual('--b-c-',
      source.gsub(/a|/, '-'),
      'empty matching pattern');

    this.assertEqual('-bc',
      source.gsub(/A/i, '-'),
      'case insensitive flag');

    this.assertEqual('-bc',
      source.sub(/./g, '-'),
      'sub with global flag');

    this.assertEqual('anullc',
      source.sub('b', function() { return null }),
      '`null` not returned');

    this.assertEqual('aundefinedc',
      source.sub('b', Fuse.emptyFunction),
      '`undefined` not returned');

    // test with empty pattern (String#gsub is used by String#sub)
    source = Fuse.String('ab');
    var empty = new RegExp('');

    this.assertEqual('xaxbx', source.gsub('', 'x'));
    this.assertEqual('xaxbx', source.gsub(empty, 'x'));
    this.assertEqual('xab',   source.sub('', 'x'));

    this.assertEqual('abc', Fuse.String('anullc').sub(null, 'b'));
    this.assertEqual('abc', Fuse.String('aundefinedc').gsub(undef, 'b'));
    this.assertEqual('abc', Fuse.String('a0c').sub(0, 'b'));
    this.assertEqual('abc', Fuse.String('atruec').gsub(true, 'b'));
    this.assertEqual('abc', Fuse.String('afalsec').sub(false, 'b'));

    this.assertEqual('---a---b---', source.gsub(empty, '-#{0}-#{1}-'));
    this.assertEqual('++a++b++',    source.gsub('', function(match) {
      return '+' + match[0] + '+';
    }));

    // test using the global flag (should not hang)
    this.assertEqual('abc',         Fuse.String('axc').sub(/x/g, 'b'));
    this.assertEqual('abbacadabba', Fuse.String('axxacadaxxa').gsub(/x/g, 'b'));
    this.assertEqual('abbacadabba', Fuse.String('axxacadaxxa').gsub(new RegExp('x','g'), 'b'));
  },

  'testSubWithReplacementFunction': function() {
    var source = Fuse.String('foo boo boz');

    this.assertEqual('Foo boo boz',
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }), 1);

    this.assertEqual('Foo Boo boz',
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, 2), 2);

    this.assertEqual(source,
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, 0), 0);

    this.assertEqual(source,
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, -1), -1);
  },

  'testSubWithReplacementString': function() {
    var source = Fuse.String('foo boo boz');

    this.assertEqual('oo boo boz',
      source.sub(/[^o]+/, ''));

    this.assertEqual('oooo boz',
      source.sub(/[^o]+/, '', 2));

    this.assertEqual('-f-oo boo boz',
      source.sub(/[^o]+/, '-#{0}-'));

    this.assertEqual('-f-oo- b-oo boz',
      source.sub(/[^o]+/, '-#{0}-', 2));
  },

  'testScan': function() {
    var source  = Fuse.String('foo boo boz');
    var results = [];
    var str     = source.scan(/[o]+/, function(match) {
      results.push(match[0].length);
    });

    this.assertEnumEqual([2, 2, 1], results);
    this.assertEqual(source, source.scan(/x/, this.fail));
    this.assert(Fuse.Object.isString(str));
  },

  'testToArray': function() {
    this.assertEnumEqual([],            Fuse.String('').toArray());
    this.assertEnumEqual(['a'],         Fuse.String('a').toArray());
    this.assertEnumEqual(['a','b'],     Fuse.String('ab').toArray());
    this.assertEnumEqual(['f','o','o'], Fuse.String('foo').toArray());
  },

  /*
    Note that camelize() differs from its Rails counterpart,
    as it is optimized for dealing with JavaScript object
    properties in conjunction with CSS property names:
     - Looks for dashes, not underscores
     - CamelCases first word if there is a front dash
  */
  'testCamelize': function() {
    this.assertEqual('', Fuse.String('').camelize(),
      'Empty string');

    this.assertEqual('', Fuse.String('-').camelize(),
      'Hyphen only');

    this.assertEqual('foo', Fuse.String('foo').camelize(),
      'String with no hyphens');

    this.assertEqual('foo_bar', Fuse.String('foo_bar').camelize(),
      'String with an underscore');

    this.assertEqual('fooBar',  Fuse.String('foo-bar').camelize(),
      'String with one hyphen');

    this.assertEqual('borderBottomWidth', Fuse.String('border-bottom-width').camelize(),
      'String simulating style property');

    this.assertEqual('classNameTest', Fuse.String('class-name-test').camelize(),
      'String simulating className (1)');

    this.assertEqual('classNameTest', Fuse.String('className-test').camelize(),
      'String simulating className (2)');

    this.assertEqual('classNameTest', Fuse.String('class-nameTest').camelize(),
      'String simulating className (2)');

    this.assertEqual('FooBar',  Fuse.String('---foo-bar').camelize(),
      'String with multiple leading hyphens');

    this.assertEqual('FooBar',  Fuse.String('---foo---bar---').camelize(),
      'String containing groups of hyphens');

    this.assertEqual('FooBar',  Fuse.String('FooBar').camelize(),
      'String pre-camelized');

    this.assertEqual('toString', Fuse.String('toString').camelize(),
      'Built-in Object.prototype.* members should not interfere with internal cache');

    /*
    this.benchmark(function(){
      'class-name-test'.camelize();
    }, 10000);
    */
  },

  'testCapitalize': function() {
    this.assertEqual('',      Fuse.String('').capitalize());
    this.assertEqual('Ä',    Fuse.String('ä').capitalize());
    this.assertEqual('A',     Fuse.String('A').capitalize());
    this.assertEqual('Hello', Fuse.String('hello').capitalize());
    this.assertEqual('Hello', Fuse.String('HELLO').capitalize());
    this.assertEqual('Hello', Fuse.String('Hello').capitalize());
    this.assertEqual('Hello world', Fuse.String('hello WORLD').capitalize());
  },

  'testUnderscore': function() {
    this.assertEqual('',    Fuse.String('').underscore());
    this.assertEqual('_',   Fuse.String('-').underscore());
    this.assertEqual('foo', Fuse.String('foo').underscore());
    this.assertEqual('foo', Fuse.String('Foo').underscore());
    this.assertEqual('foo_bar', Fuse.String('foo_bar').underscore());

    this.assertEqual('border_bottom',       Fuse.String('borderBottom').underscore());
    this.assertEqual('border_bottom_width', Fuse.String('borderBottomWidth').underscore());
    this.assertEqual('border_bottom_width', Fuse.String('border-Bottom-Width').underscore());
  },

  'testHyphenate': function() {
    this.assertEqual('',        Fuse.String('').hyphenate());
    this.assertEqual('foo',     Fuse.String('foo').hyphenate());
    this.assertEqual('Foo',     Fuse.String('Foo').hyphenate());
    this.assertEqual('foo-bar', Fuse.String('foo-bar').hyphenate());
    this.assertEqual('border-bottom-width',
      Fuse.String('border_bottom_width').hyphenate());
  },

  'testTruncate': function() {
    var undef,
     source = Fuse.String('foo boo boz foo boo boz foo boo boz foo boo boz');

    this.assertEqual(source, source.truncate(source.length),
      'truncate length equal to string length');

    this.assertEqual('...', source.truncate(0),
      'truncate length of 0');

    this.assertEqual('foo boo boz foo boo boz foo...', source.truncate(undef),
      'truncate with undefined length');

    this.assertEqual('foo boo boz foo boo boz foo...', source.truncate('xyz'),
      'truncate with non-numeric length');

    this.assertEqual('fo...', source.truncate(5),
      'basic truncate');

    this.assertEqual('foo b', source.truncate(5, ''),
      'truncate with custom truncation text');

    this.assert(Fuse.Object.isString(Fuse.String('foo').truncate(5)),
     'non truncated result is not a string');

    this.assert(Fuse.Object.isString(Fuse.String('foo bar baz').truncate(5)),
      'truncated result is not a string');
  },

  'testTrim': function() {
    this.assertEqual('hello world',      Fuse.String('   hello world  ').trim());
    this.assertEqual('hello world',      Fuse.String('hello world').trim());
    this.assertEqual('hello  \n  world', Fuse.String('  hello  \n  world  ').trim());
    this.assertEqual('',                 Fuse.String(' ').trim());

    // Ensure trim removes all whitespace and line terminators
    // IE doesn't understand '\v' so replace it with '\x0B'
    this.assertEqual('hello', Fuse.String(' \n\r\t\x0B\f\xA0 hello \xA0\n \r\t\f\x0B').trim());
  },

  'testTrimLeft': function() {
    this.assertEqual('hello world  ',      Fuse.String('   hello world  ').trimLeft());
    this.assertEqual('hello world',        Fuse.String('hello world').trimLeft());
    this.assertEqual('hello  \n  world  ', Fuse.String('  hello  \n  world  ').trimLeft());
    this.assertEqual('',                   Fuse.String(' ').trimLeft());
    this.assertEqual('hello', Fuse.String(' \n\r\t\x0B\f\xA0 hello').trimLeft());
  },

  'testTrimRight': function() {
    this.assertEqual('   hello world',     Fuse.String('   hello world  ').trimRight());
    this.assertEqual('hello world',        Fuse.String('hello world').trimRight());
    this.assertEqual('  hello  \n  world', Fuse.String('  hello  \n  world  ').trimRight());
    this.assertEqual('',                   Fuse.String(' ').trimRight());
    this.assertEqual('hello', Fuse.String('hello \xA0\n \r\t\f\x0B').trimRight());
  },

  'testStripTags': function() {
    this.assertEqual('hello world',
      Fuse.String('hello world').stripTags());

    this.assertEqual('hello world',
      Fuse.String('hello <span>world</span>').stripTags());

    this.assertEqual('hello world',
      Fuse.String('<a href="#" onclick="moo!">hello</a> world').stripTags());

    this.assertEqual('hello world',
      Fuse.String('h<b><em>e</em></b>l<i>l</i>o w<span class="moo" id="x"><b>o</b></span>rld').stripTags());

    this.assertEqual('hello world',
      Fuse.String('hello wor<input type="text" value="foo>bar">ld').stripTags());

    this.assertEqual('1\n2',
      Fuse.String('1\n2').stripTags());

    this.assertEqual('one < two blah baz', Fuse.String(
      'one < two <a href="# "\ntitle="foo > bar" >blah</a > <input disabled>baz').stripTags(),
      'failed to ignore none tag related `<` or `>` characters');

    this.assertEqual('1<invalid a="b&c"/>2<invalid a="b<c">3<invald a="b"c">4<invalid  a =  "bc">', Fuse.String(
      '<b>1</b><invalid a="b&c"/><img a="b>c" />2<invalid a="b<c"><b a="b&amp;c">3</b>' +
      '<invald a="b"c"><b a="b&#38;c" >4</b><invalid  a =  "bc">').stripTags(),
      'failed to ignore invalid tags');
  },

  'testStripScripts': function() {
    this.assertEqual('foo bar', Fuse.String('foo bar').stripScripts());
    this.assertEqual('foo bar', Fuse.String('foo <script>boo();<\/script>bar').stripScripts());
    this.assertEqual('foo bar', Fuse.String('foo <script type="text/javascript">boo();\nmoo();<\/script>bar').stripScripts());
  },

  'testExtractScripts': function() {
    this.assertEnumEqual([],         Fuse.String('foo bar').extractScripts());
    this.assertEnumEqual(['boo();'], Fuse.String('foo <script>boo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['boo();','boo();\nmoo();'],
      Fuse.String('foo <script>boo();<\/script><script type="text/javascript">boo();\nmoo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['boo();','boo();\nmoo();'],
      Fuse.String('foo <script>boo();<\/script>blub\nblub<script type="text/javascript">boo();\nmoo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['methodA();', 'methodB();','methodC();'],
      Fuse.String('blah<!--\n<script>removedA();<\/script>\n-->' +
        '<script type="text/javascript">methodA();<\/script>' +
        '<!--\n<script>removedB();<\/script>\n-->' +
        '<script></script>blah<script>methodB();<\/script>blah' +
        '<!--\n<script type="text/javascript">removedC();<\/script>\n-->' +
        '<script>methodC();<\/script>').extractScripts());

    this.assertEnumEqual(['\n      alert("Scripts work too");\n    '],
      Fuse.String('\u003Cdiv id=\"testhtml"\u003E\n  \u003Cdiv\u003E\n    ' +
        'Content successfully replaced\n    \u003Cscript\u003E\n      ' +
        'alert("Scripts work too");\n    \u003C/script\u003E\n  \u003C /div\u003E\n' +
        '\u003C/div\u003E\n').extractScripts());

    var russianChars = '//�?º�?Ÿ�?Œ�?µ�?œÑ�?°Ñ�?ž�?¹\n',
     longComment = '//' + Array(7000).join('.') + '\n',
     longScript  = '\nvar foo = 1;\n' + russianChars + longComment,
     longString  = 'foo <script type="text/javascript">' + longScript + '<'+'/script> bar';
    this.assertEnumEqual([longScript], Fuse.String(longString).extractScripts());

    /*
    var str = 'foo <script>boo();<'+'/script>blub\nblub<script type="text/javascript">boo();\nmoo();<'+'/script>bar';
    this.benchmark(function() { str.extractScripts() }, 1000);
    */
  },

  'testEvalScripts': function() {
    this.assertEqual(0, evalScriptsCounter,
      'Sanity check. No scripts should be evaled yet.');

    Fuse.String('foo <script>evalScriptsCounter++<\/script>bar').evalScripts();
    this.assertEqual(1, evalScriptsCounter);

    var stringWithScripts = '';
    Fuse.Number(3).times(function(){ stringWithScripts += 'foo <script>evalScriptsCounter++<\/script>bar' });
    Fuse.String(stringWithScripts).evalScripts();
    this.assertEqual(4, evalScriptsCounter);

    this.assertEnumEqual([4, 'hello world!'],
      Fuse.String('<script>2 + 2</script><script>"hello world!"</script>').evalScripts(),
      'Should return the evaled scripts.');
  },

  'testEscapeHTML': function() {
    this.assertEqual('foo bar',    Fuse.String('foo bar').escapeHTML());
    this.assertEqual('foo ß bar', Fuse.String('foo ß bar').escapeHTML());

    this.assertEqual('foo &lt;span&gt;bar&lt;/span&gt;',
      Fuse.String('foo <span>bar</span>').escapeHTML());

    this.assertEqual('ウィメンズ2007\nクルーズコレクション',
      Fuse.String('ウィメンズ2007\nクルーズコレクション').escapeHTML());

    this.assertEqual('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g',
      Fuse.String('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g').escapeHTML());

    this.assertEqual(largeTextEscaped, largeTextUnescaped.escapeHTML());

    this.assertEqual('&amp;', Fuse.String('&').escapeHTML());
    this.assertEqual('1\n2',  Fuse.String('1\n2').escapeHTML());

    /* this.benchmark(function() { largeTextUnescaped.escapeHTML() }, 1000); */
  },

  'testUnescapeHTML': function() {
    this.assertEqual('foo bar',
      Fuse.String('foo bar').unescapeHTML());

    this.assertEqual('foo <span>bar</span>',
      Fuse.String('foo &lt;span&gt;bar&lt;/span&gt;').unescapeHTML());

    this.assertEqual('foo ß bar',
      Fuse.String('foo ß bar').unescapeHTML());

    this.assertEqual('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g',
      Fuse.String('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g').unescapeHTML());

    this.assertEqual(largeTextUnescaped, largeTextEscaped.unescapeHTML());

    this.assertEqual('test \xfa',
      Fuse.String('test &uacute;').unescapeHTML());

    this.assertEqual('1\n2',
      Fuse.String('1\n2').unescapeHTML(),
      'Failed with newlines');

    this.assertEqual('<h1>Pride & Prejudice</h1>',
      Fuse.String('<h1>Pride &amp; Prejudice</h1>').unescapeHTML(),
      'Failed on string containing unescaped tags');

    var sameInSameOut = Fuse.String('"&lt;" means "<" in HTML');
    this.assertEqual(sameInSameOut, sameInSameOut.escapeHTML().unescapeHTML());

    /* this.benchmark(function() { largeTextEscaped.unescapeHTML() }, 1000); */
  },

  'testInterpolate': function() {
    var subject = { 'name': 'Stephan' },
     pattern    = /(^|.|\r|\n)(#\((.*?)\))/;

    this.assertEqual('#{name}: Stephan',
      Fuse.String('\\#{name}: #{name}').interpolate(subject));

    this.assertEqual('#(name): Stephan',
      Fuse.String('\\#(name): #(name)').interpolate(subject, pattern));
  },

  'testToQueryParams': function() {
    // only the query part
    var result = { 'a':undef, 'b':'c' };

    this.assertHashEqual({ },
      Fuse.String('').toQueryParams(),
      'empty query');

    this.assertHashEqual({ },
      Fuse.String('foo?').toQueryParams(),
      'empty query with URL');

    this.assertHashEqual(result,
      Fuse.String('foo?a&b=c').toQueryParams(),
      'query with URL');

    this.assertHashEqual(result,
      Fuse.String('foo?a&b=c#fragment').toQueryParams(),
      'query with URL and fragment');

    this.assertHashEqual(result,
      Fuse.String('a;b=c').toQueryParams(';'),
      'custom delimiter');

    this.assertHashEqual({ 'a': undef },
      Fuse.String('a').toQueryParams(),
      'key without value');

    this.assertHashEqual({ 'a': 'b' },
      Fuse.String('a=b&=c').toQueryParams(),
      'empty key');

    this.assertHashEqual({ 'a': 'b', 'c': '' },
      Fuse.String('a=b&c=').toQueryParams(),
      'empty value');

    this.assertHashEqual({ 'a': 'b', 'c': undef },
      Fuse.Object.toQueryString(Fuse.String('a=b&c').toQueryParams()).toQueryParams(),
      'cross-convert containing an undefined value');

    this.assertHashEqual({'a b':'c', 'd':'e f', 'g':'h' },
      Fuse.String('a%20b=c&d=e%20f&g=h').toQueryParams(),
      'proper decoding');

    this.assertHashEqual({ 'a':'b=c=d' },
      Fuse.String('a=b=c=d').toQueryParams(),
      'multiple equal signs');

    this.assertHashEqual({ 'a':'b', c:'d' },
      Fuse.String('&a=b&&&c=d').toQueryParams(),
      'proper splitting');

    this.assertEnumEqual($w('r g b'),
      Fuse.String('col=r&col=g&col=b').toQueryParams()['col'],
      'collection without square brackets');

    var msg = 'empty values inside collection';

    this.assertEnumEqual(['r', '', 'b'],
      Fuse.String('c=r&c=&c=b').toQueryParams()['c'], msg);

    this.assertEnumEqual(['', 'blue'],
      Fuse.String('c=&c=blue').toQueryParams()['c'],  msg);

    this.assertEnumEqual(['blue', ''],
      Fuse.String('c=blue&c=').toQueryParams()['c'],  msg);

    this.assertHashEqual(Fixtures.mixed_dont_enum,
      Fuse.String('a=A&b=B&toString=bar&valueOf=').toQueryParams(),
      'Should not iterate over inherited properties.');
  },

  'testInclude': function() {
    this.assert(Fuse.String('hello world').contains('h'));
    this.assert(Fuse.String('hello world').contains('hello'));
    this.assert(Fuse.String('hello world').contains('llo w'));
    this.assert(Fuse.String('hello world').contains('world'));

    this.assert(!Fuse.String('hello world').contains('bye'));
    this.assert(!Fuse.String('').contains('bye'));
  },

  'testLastIndexOf': function() {
    // tests based on the V8 project's String.prototype.lastIndexOf unit tests
    var source = Fuse.String('test test test');
    this.assertEqual(5,  source.lastIndexOf('test', 5));
    this.assertEqual(5,  source.lastIndexOf('test', 6));
    this.assertEqual(0,  source.lastIndexOf('test', 4));
    this.assertEqual(0,  source.lastIndexOf('test', 0));
    this.assertEqual(10, source.lastIndexOf('test'));
    this.assertEqual(-1, source.lastIndexOf('notpresent'));
    this.assertEqual(-1, source.lastIndexOf());
    this.assertEqual(10, source.lastIndexOf('test', 'string'));

    this.assertEqual(0, source.lastIndexOf('test', -1),
      'failed with negative position');

    // this.assertEqual(1,  new Fuse.String().lastIndexOf.length);

    for (var i = source.length + 10; i >= 0; i--) {
      var expected = i < source.length ? i : source.length;
      this.assertEqual(expected, source.lastIndexOf('', i));
    }
  },

  'testStartsWith': function() {
    this.assert(Fuse.String('hello world').startsWith('h'));
    this.assert(Fuse.String('hello world').startsWith('hello'));

    this.assert(!Fuse.String('hello world').startsWith('bye'));
    this.assert(!Fuse.String('').startsWith('bye'));
    this.assert(!Fuse.String('hell').startsWith('hello'));
  },

  'testEndsWith': function() {
    this.assert(Fuse.String('hello world').endsWith('d'));
    this.assert(Fuse.String('hello world').endsWith(' world'));
    this.assert(Fuse.String('hello world world').endsWith(' world'));

    this.assert(!Fuse.String('hello world').endsWith('planet'));
    this.assert(!Fuse.String('').endsWith('planet'));
    this.assert(!Fuse.String('z').endsWith('az'));

    this.assert(Fuse.String('hello world').endsWith(''),
      'failed empty string test');

    this.assertRaise('TypeError',
      function() { Fuse.String('hello world').endsWith() },
      'failed to raise error when passed a non string pattern');
  },

  'testBlank': function() {
    this.assert(Fuse.String('').blank());
    this.assert(Fuse.String(' ').blank());
    this.assert(Fuse.String('\t\r\n ').blank());

    this.assert(!Fuse.String('a').blank());
    this.assert(!Fuse.String('\t y \n').blank());
  },

  'testEmpty': function() {
    this.assert(Fuse.String('').isEmpty());

    this.assert(!Fuse.String(' ').isEmpty());
    this.assert(!Fuse.String('\t\r\n ').isEmpty());
    this.assert(!Fuse.String('a').isEmpty());
    this.assert(!Fuse.String('\t y \n').isEmpty());
  },

  'testSucc': function() {
    this.assertEqual('b',    Fuse.String('a').succ());
    this.assertEqual('B',    Fuse.String('A').succ());
    this.assertEqual('1',    Fuse.String('0').succ());
    this.assertEqual('abce', Fuse.String('abcd').succ());
    this.assertEqual('{',    Fuse.String('z').succ());
    this.assertEqual(':',    Fuse.String('9').succ());
  },

  'testTimes': function() {
    this.assertEqual('',      Fuse.String('').times(0));
    this.assertEqual('',      Fuse.String('').times(5));
    this.assertEqual('',      Fuse.String('a').times(-1));
    this.assertEqual('',      Fuse.String('a').times(0));
    this.assertEqual('a',     Fuse.String('a').times(1));
    this.assertEqual('aa',    Fuse.String('a').times(2));
    this.assertEqual('aaaaa', Fuse.String('a').times(5));

    this.assertEqual('foofoofoofoofoo', Fuse.String('foo').times(5));
    this.assertEqual('', Fuse.String('foo').times(-5));

    /*
    window.String.prototype.oldTimes = function(count) {
      var result = '';
      for (var i = 0; i < count; i++) result += this;
      return result;
    };

    this.benchmark(function() {
      'foo'.times(15);
    }, 1000, 'new: ');

    this.benchmark(function() {
      'foo'.oldTimes(15);
    }, 1000, 'previous: ');
    */
  }
});