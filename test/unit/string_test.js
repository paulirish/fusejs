new Test.Unit.Runner({
  testInterpret: function(){
    this.assertIdentical('true', String.interpret(true));
    this.assertIdentical('123',  String.interpret(123));
    this.assertIdentical('foo bar', String.interpret('foo bar'));
    this.assertIdentical(
      'object string',
      String.interpret({ toString: function(){ return 'object string' } }));

    this.assertIdentical('0', String.interpret(0));
    this.assertIdentical('false', String.interpret(false));
    this.assertIdentical('', String.interpret(undefined));
    this.assertIdentical('', String.interpret(null));
    this.assertIdentical('', String.interpret(''));
  },

  testGsubWithReplacementFunction: function() {
    var source = 'foo boo boz';
    
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
  
  testGsubWithReplacementString: function() {
    var source = 'foo boo boz';
    
    this.assertEqual('foobooboz',
      source.gsub(/\s+/, ''));
    this.assertEqual('  z', 
      source.gsub(/(.)(o+)/, ''));
      
    this.assertEqual('ウィメンズ2007<br/>クルーズコレクション', 
      'ウィメンズ2007\nクルーズコレクション'.gsub(/\n/,'<br/>'));
    this.assertEqual('ウィメンズ2007<br/>クルーズコレクション', 
      'ウィメンズ2007\nクルーズコレクション'.gsub('\n','<br/>'));
  },
  
  testGsubWithReplacementTemplateString: function() {
    var source = 'foo boo boz';
    
    this.assertEqual('-oo-#{1}- -oo-#{1}- -o-#{1}-z',
      source.gsub(/(.)(o+)/, '-#{2}-\\#{1}-'));
    this.assertEqual('-foo-f- -boo-b- -bo-b-z',
      source.gsub(/(.)(o+)/, '-#{0}-#{1}-'));
    this.assertEqual('-oo-f- -oo-b- -o-b-z',
      source.gsub(/(.)(o+)/, '-#{2}-#{1}-'));
    this.assertEqual('  z',
      source.gsub(/(.)(o+)/, '#{3}'));      
  },

  testGsubEscapesRegExpSpecialCharacters: function() {
    this.assertEqual('happy Smyle',
      'happy :-)'.gsub(':-)', 'Smyle'));
    this.assertEqual('sad Frwne',
      'sad >:($'.gsub('>:($', 'Frwne'));

    this.assertEqual('ab', 'a|b'.gsub('|', ''));
    this.assertEqual('ab', 'ab(?:)'.gsub('(?:)', ''));
    this.assertEqual('ab', 'ab()'.gsub('()', ''));
    this.assertEqual('ab', 'ab'.gsub('^', ''));
    this.assertEqual('ab', 'a?b'.gsub('?', ''));
    this.assertEqual('ab', 'a+b'.gsub('+', ''));
    this.assertEqual('ab', 'a*b'.gsub('*', ''));
    this.assertEqual('ab', 'a{1}b'.gsub('{1}', ''));
    this.assertEqual('ab', 'a.b'.gsub('.', ''));
  },

  testSubsWithUncommonPattern: function() {
    // test with empty pattern (String#gsub is used by String#sub)
    var empty = new RegExp('');
    this.assertEqual('xaxbx', 'ab'.gsub('', 'x'));
    this.assertEqual('xaxbx', 'ab'.gsub(empty, 'x'));
    this.assertEqual('xaxbx', 'ab'.sub('', 'x'));

    this.assertEqual('abc', 'anullc'.sub(null, 'b'));
    this.assertEqual('abc', 'aundefinedc'.sub(window.undefined, 'b'));
    this.assertEqual('abc', 'a0c'.sub(0, 'b'));
    this.assertEqual('abc', 'atruec'.sub(true, 'b'));
    this.assertEqual('abc', 'afalsec'.sub(false, 'b'));
    
    this.assertEqual('---a---b---', 'ab'.gsub(empty, '-#{0}-#{1}-'));
    this.assertEqual('++a++b++', 'ab'.gsub('', function(match) {
      return '+' + match[0] + '+';
    }));
  },
  
  testSubWithReplacementFunction: function() {
    var source = 'foo boo boz';

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
  
  testSubWithReplacementString: function() {
    var source = 'foo boo boz';
    
    this.assertEqual('oo boo boz',
      source.sub(/[^o]+/, ''));
    this.assertEqual('oooo boz',
      source.sub(/[^o]+/, '', 2));
    this.assertEqual('-f-oo boo boz',
      source.sub(/[^o]+/, '-#{0}-'));
    this.assertEqual('-f-oo- b-oo boz',
      source.sub(/[^o]+/, '-#{0}-', 2));
  },
  
  testScan: function() {
    var source = 'foo boo boz', results = [];
    var str = source.scan(/[o]+/, function(match) {
      results.push(match[0].length);
    });
    this.assertEnumEqual([2, 2, 1], results);
    this.assertEqual(source, source.scan(/x/, this.fail));
    this.assert(typeof str == 'string');
  },
  
  testToArray: function() {
    this.assertEnumEqual([],''.toArray());
    this.assertEnumEqual(['a'],'a'.toArray());
    this.assertEnumEqual(['a','b'],'ab'.toArray());
    this.assertEnumEqual(['f','o','o'],'foo'.toArray());
  },

  /* 
    Note that camelize() differs from its Rails counterpart,
    as it is optimized for dealing with JavaScript object
    properties in conjunction with CSS property names:
     - Looks for dashes, not underscores
     - CamelCases first word if there is a front dash
  */
  testCamelize: function() {
    this.assertEqual('', ''.camelize());
    this.assertEqual('', '-'.camelize());
    this.assertEqual('foo', 'foo'.camelize());
    this.assertEqual('foo_bar', 'foo_bar'.camelize());
    this.assertEqual('FooBar', '-foo-bar'.camelize());
    this.assertEqual('FooBar', 'FooBar'.camelize());
    
    this.assertEqual('fooBar', 'foo-bar'.camelize());
    this.assertEqual('borderBottomWidth', 'border-bottom-width'.camelize());
    
    this.assertEqual('classNameTest','class-name-test'.camelize());
    this.assertEqual('classNameTest','className-test'.camelize());
    this.assertEqual('classNameTest','class-nameTest'.camelize());
    
    /* this.benchmark(function(){
      'class-name-test'.camelize();
    },10000); */
  },

  testCapitalize: function() {
    this.assertEqual('',''.capitalize());
    this.assertEqual('Ä','ä'.capitalize());
    this.assertEqual('A','A'.capitalize());
    this.assertEqual('Hello','hello'.capitalize());
    this.assertEqual('Hello','HELLO'.capitalize());
    this.assertEqual('Hello','Hello'.capitalize());
    this.assertEqual('Hello world','hello WORLD'.capitalize());
  },  
    
  testUnderscore: function() {
    this.assertEqual('', ''.underscore());
    this.assertEqual('_', '-'.underscore());
    this.assertEqual('foo', 'foo'.underscore());
    this.assertEqual('foo', 'Foo'.underscore());
    this.assertEqual('foo_bar', 'foo_bar'.underscore());
    this.assertEqual('border_bottom', 'borderBottom'.underscore());
    this.assertEqual('border_bottom_width', 'borderBottomWidth'.underscore());
    this.assertEqual('border_bottom_width', 'border-Bottom-Width'.underscore());      
  },
  
  testDasherize: function() {
    this.assertEqual('', ''.dasherize());
    this.assertEqual('foo', 'foo'.dasherize());
    this.assertEqual('Foo', 'Foo'.dasherize());
    this.assertEqual('foo-bar', 'foo-bar'.dasherize());
    this.assertEqual('border-bottom-width', 'border_bottom_width'.dasherize());
  },
  
  testTruncate: function() {
    var source = 'foo boo boz foo boo boz foo boo boz foo boo boz';
    this.assertEqual(source, source.truncate(source.length));
    this.assertEqual('foo boo boz foo boo boz foo...', source.truncate(0));
    this.assertEqual('fo...', source.truncate(5));
    this.assertEqual('foo b', source.truncate(5, ''));
    
    this.assert(typeof 'foo'.truncate(5) == 'string');
    this.assert(typeof 'foo bar baz'.truncate(5) == 'string');
  },
  
  testStrip: function() {
    this.assertEqual('hello world', '   hello world  '.strip());
    this.assertEqual('hello world', 'hello world'.strip());
    this.assertEqual('hello  \n  world', '  hello  \n  world  '.strip());
    this.assertEqual('', ' '.strip());

    // Ensure strip removes all whitespace and line terminators
    // IE doesn't understand '\v' so replace it with '\x0B'
    this.assertEqual('hello', ' \n\r\t\x0B\f\xA0 hello \xA0\n \r\t\f\x0B'.strip());
  },
  
  testStripTags: function() {
    this.assertEqual('hello world', 'hello world'.stripTags());
    this.assertEqual('hello world', 'hello <span>world</span>'.stripTags());
    this.assertEqual('hello world', '<a href="#" onclick="moo!">hello</a> world'.stripTags());
    this.assertEqual('hello world', 'h<b><em>e</em></b>l<i>l</i>o w<span class="moo" id="x"><b>o</b></span>rld'.stripTags());
    this.assertEqual('hello world', 'hello wor<input type="text" value="foo>bar">ld'.stripTags());

    this.assertEqual('1\n2', '1\n2'.stripTags());
  },
  
  testStripScripts: function() {
    this.assertEqual('foo bar', 'foo bar'.stripScripts());
    this.assertEqual('foo bar', ('foo <script>boo();<'+'/script>bar').stripScripts());
    this.assertEqual('foo bar', ('foo <script type="text/javascript">boo();\nmoo();<'+'/script>bar').stripScripts());
  },
  
  testExtractScripts: function() {
    this.assertEnumEqual([], 'foo bar'.extractScripts());
    this.assertEnumEqual(['boo();'], ('foo <script>boo();<'+'/script>bar').extractScripts());
    
    this.assertEnumEqual(['boo();','boo();\nmoo();'], 
      ('foo <script>boo();<'+'/script><script type="text/javascript">boo();\nmoo();<'+'/script>bar').extractScripts());
      
    this.assertEnumEqual(['boo();','boo();\nmoo();'], 
      ('foo <script>boo();<'+'/script>blub\nblub<script type="text/javascript">boo();\nmoo();<'+'/script>bar').extractScripts());

    this.assertEnumEqual(['methodA();', 'methodB();','methodC();'], ('blah<!--\n<script>removedA();<' +
      '/script>\n--><script type="text/javascript">methodA();<' + '/script><!--\n<script>removedB();<' +
      '/script>\n--><script><' + '/script>blah<script>methodB();<' + '/script>blah<!--\n<script type="text/javascript">removedC();<' +
      '/script>\n--><script>methodC();<' + '/script>').extractScripts());
      
    var russianChars = '//�?º�?Ÿ�?Œ�?µ�?œÑ�?°Ñ�?ž�?¹\n',
     longComment  = '//' + Array(7000).join('.') + '\n',
     longScript   = '\nvar foo = 1;\n' + russianChars + longComment,
     longString   = 'foo <script type="text/javascript">'+ longScript + '<'+'/script> bar';
    this.assertEnumEqual([longScript], longString.extractScripts());

    var str = 'foo <script>boo();<'+'/script>blub\nblub<script type="text/javascript">boo();\nmoo();<'+'/script>bar';
    this.benchmark(function() { str.extractScripts() }, 1000);
  },
  
  testEvalScripts: function() {
    this.assertEqual(0, evalScriptsCounter);
    
    ('foo <script>evalScriptsCounter++<'+'/script>bar').evalScripts();
    this.assertEqual(1, evalScriptsCounter);
    
    var stringWithScripts = '';
    (3).times(function(){ stringWithScripts += 'foo <script>evalScriptsCounter++<'+'/script>bar' });
    stringWithScripts.evalScripts();
    this.assertEqual(4, evalScriptsCounter);
  },
  
  testEscapeHTML: function() {
    this.assertEqual('foo bar', 'foo bar'.escapeHTML());
    this.assertEqual('foo &lt;span&gt;bar&lt;/span&gt;', 'foo <span>bar</span>'.escapeHTML());
    this.assertEqual('foo ß bar', 'foo ß bar'.escapeHTML());
    
    this.assertEqual('ウィメンズ2007\nクルーズコレクション', 
      'ウィメンズ2007\nクルーズコレクション'.escapeHTML());
      
    this.assertEqual('a&lt;a href=&quot;blah&quot;&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g',
      'a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g'.escapeHTML());
    
    this.assertEqual(largeTextEscaped, largeTextUnescaped.escapeHTML());
    
    this.assertEqual('&amp;', '&'.escapeHTML());
    this.assertEqual('1\n2', '1\n2'.escapeHTML());
    
    this.benchmark(function() { largeTextUnescaped.escapeHTML() }, 1000);
  },
  
  testUnescapeHTML: function() {
    this.assertEqual('foo bar', 'foo bar'.unescapeHTML());
    this.assertEqual('foo <span>bar</span>', 'foo &lt;span&gt;bar&lt;/span&gt;'.unescapeHTML());
    this.assertEqual('foo ß bar', 'foo ß bar'.unescapeHTML());
    
    this.assertEqual('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g',
      'a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g'.unescapeHTML());
    
    this.assertEqual(largeTextUnescaped, largeTextEscaped.unescapeHTML());
    
    this.assertEqual('test \xfa', 'test &uacute;'.unescapeHTML());
    this.assertEqual('1\n2', '1\n2'.unescapeHTML());
    this.assertEqual('Pride & Prejudice', '<h1>Pride &amp; Prejudice</h1>'.unescapeHTML());
    
    var sameInSameOut = '"&lt;" means "<" in HTML';
    this.assertEqual(sameInSameOut, sameInSameOut.escapeHTML().unescapeHTML());
    
    this.benchmark(function() { largeTextEscaped.unescapeHTML() }, 1000);
    
  },
  
  testTemplateEvaluation: function() {
    var source = '<tr><td>#{name}</td><td>#{age}</td></tr>';
    var person = {name: 'Sam', age: 21};
    var template = new Template(source);
    
    this.assertEqual('<tr><td>Sam</td><td>21</td></tr>',
      template.evaluate(person));
    this.assertEqual('<tr><td></td><td></td></tr>',
      template.evaluate({}));
  },

  testTemplateEvaluationWithEmptyReplacement: function() {
    var template = new Template('##{}');
    this.assertEqual('#', template.evaluate());
    this.assertEqual('#', template.evaluate(null));
    this.assertEqual('#', template.evaluate({}));
    this.assertEqual('#', template.evaluate({foo: 'bar'}));

    template = new Template('#{}');
    this.assertEqual('', template.evaluate({}));
  },

  testTemplateEvaluationWithFalses: function() {
    var source = '<tr><td>#{zero}</td><td>#{_false}</td><td>#{undef}</td><td>#{_null}</td><td>#{empty}</td></tr>';
    var falses = {zero:0, _false:false, undef:undefined, _null:null, empty:""};
    var template = new Template(source);
    
    this.assertEqual('<tr><td>0</td><td>false</td><td></td><td></td><td></td></tr>',
      template.evaluate(falses));
  },

  testTemplateEvaluationWithNested: function() {
    var source = '#{name} #{manager.name} #{manager.age} #{manager.undef} #{manager.age.undef} #{colleagues.first.name}';
    var subject = { manager: { name: 'John', age: 29 }, name: 'Stephan', age: 22, colleagues: { first: { name: 'Mark' }} };
    this.assertEqual('Stephan', new Template('#{name}').evaluate(subject));
    this.assertEqual('John', new Template('#{manager.name}').evaluate(subject));
    this.assertEqual('29', new Template('#{manager.age}').evaluate(subject));
    this.assertEqual('', new Template('#{manager.undef}').evaluate(subject));
    this.assertEqual('', new Template('#{manager.age.undef}').evaluate(subject));
    this.assertEqual('Mark', new Template('#{colleagues.first.name}').evaluate(subject));
    this.assertEqual('Stephan John 29   Mark', new Template(source).evaluate(subject));
  },

  testTemplateEvaluationWithIndexing: function() {
    var source = '#{0} = #{[0]} - #{1} = #{[1]} - #{[2][0]} - #{[2].name} - #{first[0]} - #{[first][0]} - #{[\\]]} - #{first[\\]]}';
    var subject = [ 'zero', 'one', [ 'two-zero' ] ];
    subject[2].name = 'two-zero-name';
    subject.first = subject[2];
    subject[']'] = '\\';
    subject.first[']'] = 'first\\';
    this.assertEqual('zero', new Template('#{[0]}').evaluate(subject));
    this.assertEqual('one', new Template('#{[1]}').evaluate(subject));
    this.assertEqual('two-zero', new Template('#{[2][0]}').evaluate(subject));
    this.assertEqual('two-zero-name', new Template('#{[2].name}').evaluate(subject));
    this.assertEqual('two-zero', new Template('#{first[0]}').evaluate(subject));
    this.assertEqual('\\', new Template('#{[\\]]}').evaluate(subject));
    this.assertEqual('first\\', new Template('#{first[\\]]}').evaluate(subject));
    this.assertEqual('empty - empty2', new Template('#{[]} - #{m[]}').evaluate({ '': 'empty', m: {'': 'empty2'}}));
    this.assertEqual('zero = zero - one = one - two-zero - two-zero-name - two-zero - two-zero - \\ - first\\', new Template(source).evaluate(subject));
  },

  testTemplateToTemplateReplacements: function() {
    var source = 'My name is #{name}, my job is #{job}';
    var subject = {
      name: 'Stephan',
      getJob: function() { return 'Web developer'; },
      toTemplateReplacements: function() { return { name: this.name, job: this.getJob() } }
    };
    this.assertEqual('My name is Stephan, my job is Web developer', new Template(source).evaluate(subject));
    
    // test null return value of toTemplateReplacements()
    source = 'My name is "#{name}", my job is "#{job}"';
    subject = { toTemplateReplacements: Prototype.K };
    this.assertEqual('My name is "", my job is ""', new Template(source).evaluate(subject));
    
    source = 'My name is "\\#{name}", my job is "\\#{job}"';
    this.assertEqual('My name is "#{name}", my job is "#{job}"', new Template(source).evaluate(subject));
  },

  testTemplateEvaluationCombined: function() {
    var source = '#{name} is #{age} years old, managed by #{manager.name}, #{manager.age}.\n' +
      'Colleagues include #{colleagues[0].name} and #{colleagues[1].name}.';
    var subject = {
      name: 'Stephan', age: 22,
      manager: { name: 'John', age: 29 },
      colleagues: [ { name: 'Mark' }, { name: 'Indy' } ]
    };
    this.assertEqual('Stephan is 22 years old, managed by John, 29.\n' +
      'Colleagues include Mark and Indy.',
      new Template(source).evaluate(subject));
  },

  testInterpolate: function() {
    var subject = { name: 'Stephan' };
    var pattern = /(^|.|\r|\n)(#\((.*?)\))/;
    this.assertEqual('#{name}: Stephan', '\\#{name}: #{name}'.interpolate(subject));
    this.assertEqual('#(name): Stephan', '\\#(name): #(name)'.interpolate(subject, pattern));
  },

  testToQueryParams: function() {
    // only the query part
    var result = {a:undefined, b:'c'};
    this.assertHashEqual({}, ''.toQueryParams(), 'empty query');
    this.assertHashEqual({}, 'foo?'.toQueryParams(), 'empty query with URL');
    this.assertHashEqual(result, 'foo?a&b=c'.toQueryParams(), 'query with URL');
    this.assertHashEqual(result, 'foo?a&b=c#fragment'.toQueryParams(), 'query with URL and fragment');
    this.assertHashEqual(result, 'a;b=c'.toQueryParams(';'), 'custom delimiter');
  
    this.assertHashEqual({a:undefined}, 'a'.toQueryParams(), 'key without value');
    this.assertHashEqual({a:'b'},  'a=b&=c'.toQueryParams(), 'empty key');
    this.assertHashEqual({a:'b', c:''}, 'a=b&c='.toQueryParams(), 'empty value');
    
    this.assertHashEqual({'a b':'c', d:'e f', g:'h'},
      'a%20b=c&d=e%20f&g=h'.toQueryParams(), 'proper decoding');
    this.assertHashEqual({a:'b=c=d'}, 'a=b=c=d'.toQueryParams(), 'multiple equal signs');
    this.assertHashEqual({a:'b', c:'d'}, '&a=b&&&c=d'.toQueryParams(), 'proper splitting');
    
    this.assertEnumEqual($w('r g b'), 'col=r&col=g&col=b'.toQueryParams()['col'],
      'collection without square brackets');
    var msg = 'empty values inside collection';
    this.assertEnumEqual(['r', '', 'b'], 'c=r&c=&c=b'.toQueryParams()['c'], msg);
    this.assertEnumEqual(['', 'blue'],   'c=&c=blue'.toQueryParams()['c'], msg);
    this.assertEnumEqual(['blue', ''],   'c=blue&c='.toQueryParams()['c'], msg);
  },
  
  testInspect: function() {
    this.assertEqual('\'\'', ''.inspect());
    this.assertEqual('\'test\'', 'test'.inspect());
    this.assertEqual('\'test \\\'test\\\' "test"\'', 'test \'test\' "test"'.inspect());
    this.assertEqual('\"test \'test\' \\"test\\"\"', 'test \'test\' "test"'.inspect(true));
    this.assertEqual('\'\\b\\t\\n\\f\\r"\\\\\'', '\b\t\n\f\r"\\'.inspect());
    this.assertEqual('\"\\b\\t\\n\\f\\r\\"\\\\\"', '\b\t\n\f\r"\\'.inspect(true));
    this.assertEqual('\'\\b\\t\\n\\f\\r\'', '\x08\x09\x0a\x0c\x0d'.inspect());
    this.assertEqual('\'\\u001a\'', '\x1a'.inspect());
  },
  
  testInclude: function() {
    this.assert('hello world'.include('h'));
    this.assert('hello world'.include('hello'));
    this.assert('hello world'.include('llo w'));
    this.assert('hello world'.include('world'));      
    this.assert(!'hello world'.include('bye'));
    this.assert(!''.include('bye'));
  },
  
  testStartsWith: function() {
    this.assert('hello world'.startsWith('h'));
    this.assert('hello world'.startsWith('hello'));
    this.assert(!'hello world'.startsWith('bye'));
    this.assert(!''.startsWith('bye'));
    this.assert(!'hell'.startsWith('hello'));
  },
  
  testEndsWith: function() {
    this.assert('hello world'.endsWith('d'));
    this.assert('hello world'.endsWith(' world'));
    this.assert(!'hello world'.endsWith('planet'));
    this.assert(!''.endsWith('planet'));
    this.assert('hello world world'.endsWith(' world'));
    this.assert(!'z'.endsWith('az'));
  },
  
  testBlank: function() {
    this.assert(''.blank());
    this.assert(' '.blank());
    this.assert('\t\r\n '.blank());
    this.assert(!'a'.blank());
    this.assert(!'\t y \n'.blank());
  },
  
  testEmpty: function() {
    this.assert(''.empty());
    this.assert(!' '.empty());
    this.assert(!'\t\r\n '.empty());
    this.assert(!'a'.empty());
    this.assert(!'\t y \n'.empty());
  },
  
  testSucc: function() {
    this.assertEqual('b', 'a'.succ());
    this.assertEqual('B', 'A'.succ());
    this.assertEqual('1', '0'.succ());
    this.assertEqual('abce', 'abcd'.succ());
    this.assertEqual('{', 'z'.succ());
    this.assertEqual(':', '9'.succ());
  },

  testTimes: function() {

    this.assertEqual('', ''.times(0));
    this.assertEqual('', ''.times(5));
    this.assertEqual('', 'a'.times(-1));
    this.assertEqual('', 'a'.times(0));
    this.assertEqual('a', 'a'.times(1));
    this.assertEqual('aa', 'a'.times(2));
    this.assertEqual('aaaaa', 'a'.times(5));
    this.assertEqual('foofoofoofoofoo', 'foo'.times(5));
    this.assertEqual('', 'foo'.times(-5));
    
    /*window.String.prototype.oldTimes = function(count) {
      var result = '';
      for (var i = 0; i < count; i++) result += this;
      return result;
    };
    
    this.benchmark(function() {
      'foo'.times(15);
    }, 1000, 'new: ');
    
    this.benchmark(function() {
      'foo'.oldTimes(15);
    }, 1000, 'previous: ');*/
  },
  
  testToJSON: function() {
    this.assertEqual('\"\"', ''.toJSON());
    this.assertEqual('\"test\"', 'test'.toJSON());
  },
  
  testIsJSON: function() {
    this.assert(!''.isJSON());
    this.assert(!'     '.isJSON());
    this.assert('""'.isJSON());
    this.assert('"foo"'.isJSON());
    this.assert('{}'.isJSON());
    this.assert('[]'.isJSON());
    this.assert('null'.isJSON());
    this.assert('123'.isJSON());
    this.assert('true'.isJSON());
    this.assert('false'.isJSON());
    this.assert('"\\""'.isJSON());
    this.assert(!'\\"'.isJSON());
    this.assert(!'new'.isJSON());
    this.assert(!'\u0028\u0029'.isJSON());
    // we use '@' as a placeholder for characters authorized only inside brackets,
    // so this tests make sure it is not considered authorized elsewhere.
    this.assert(!'@'.isJSON());
  },

  testEvalJSON: function() {
    var valid = '{"test": \n\r"hello world!"}';
    var invalid = '{"test": "hello world!"';
    var dangerous = '{});attackTarget = "attack succeeded!";({}';

    // use smaller huge string size for KHTML
    var size = navigator.userAgent.include('KHTML') ? 20 : 100;
    var longString = '"' + '123456789\\"'.times(size * 10) + '"';
    var object = '{' + longString + ': ' + longString + '},';
    var huge = '[' + object.times(size) + '{"test": 123}]';
    
    this.assertEqual('hello world!', valid.evalJSON().test);
    this.assertEqual('hello world!', valid.evalJSON(true).test);
    this.assertRaise('SyntaxError', function() { invalid.evalJSON() });
    this.assertRaise('SyntaxError', function() { invalid.evalJSON(true) });

    attackTarget = "scared";
    dangerous.evalJSON();
    this.assertEqual("attack succeeded!", attackTarget);
    
    attackTarget = "Not scared!";
    this.assertRaise('SyntaxError', function(){dangerous.evalJSON(true)});
    this.assertEqual("Not scared!", attackTarget);

    this.assertEqual('hello world!', ('/*-secure- \r  \n ' + valid + ' \n  */').evalJSON().test);
    var temp = Prototype.JSONFilter;
    Prototype.JSONFilter = /^\/\*([\s\S]*)\*\/$/; // test custom delimiters.
    this.assertEqual('hello world!', ('/*' + valid + '*/').evalJSON().test);
    Prototype.JSONFilter = temp;
    
    this.assertMatch(123, huge.evalJSON(true).last().test);
    
    this.assertEqual('', '""'.evalJSON());
    this.assertEqual('foo', '"foo"'.evalJSON());
    this.assert('object', typeof '{}'.evalJSON());
    this.assert(Object.isArray('[]'.evalJSON()));
    this.assertNull('null'.evalJSON());
    this.assert(123, '123'.evalJSON());
    this.assertIdentical(true, 'true'.evalJSON());
    this.assertIdentical(false, 'false'.evalJSON());
    this.assertEqual('"', '"\\""'.evalJSON());
  }
});