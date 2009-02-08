var globalArgsTest = 'nothing to see here';

function prime(value) {
  for (var i = 2; i < value; i++)
    if (value % i == 0) return false;
  return true;
}

new Test.Unit.Runner({
  test$A: function() {
    this.assertEnumEqual([], $A({}));
  },
  
  test$w: function() {
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w('a b c d'));
    this.assertEnumEqual([], $w(' '));
    this.assertEnumEqual([], $w(''));
    this.assertEnumEqual([], $w(null));
    this.assertEnumEqual([], $w(undefined));
    this.assertEnumEqual([], $w());
    this.assertEnumEqual([], $w(10));
    this.assertEnumEqual(['a'], $w('a'));
    this.assertEnumEqual(['a'], $w('a '));
    this.assertEnumEqual(['a'], $w(' a'));
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w(' a   b\nc\t\nd\n'));
  },
    
  testToArrayOnArguments: function() {
    function toArrayOnArguments(){
      globalArgsTest = $A(arguments);
    }
    toArrayOnArguments();
    this.assertEnumEqual([], globalArgsTest);
    toArrayOnArguments('foo');
    this.assertEnumEqual(['foo'], globalArgsTest);
    toArrayOnArguments('foo','bar');
    this.assertEnumEqual(['foo','bar'], globalArgsTest);
  },
  
  testToArrayOnNodeList: function() {
    // direct HTML
    this.assertEqual(3, $A($('test_node').childNodes).length);
    
    // DOM
    var element = document.createElement('div');
    element.appendChild(document.createTextNode('22'));
    (2).times(function() { element.appendChild(document.createElement('span')) });
    this.assertEqual(3, $A(element.childNodes).length);
    
    // HTML String
    element = document.createElement('div');
    $(element).update('22<span></span><span></span');
    this.assertEqual(3, $A(element.childNodes).length);
  },
  
  testClear: function() {
    this.assertEnumEqual([], [].clear());
    this.assertEnumEqual([], [1].clear());
    this.assertEnumEqual([], [1,2].clear());
  },
  
  testClone: function() {
    this.assertEnumEqual([], [].clone());
    this.assertEnumEqual([1], [1].clone());
    this.assertEnumEqual([1,2], [1,2].clone());
    this.assertEnumEqual([0,1,2], [0,1,2].clone());
    var a = [0,1,2];
    var b = a;
    this.assertIdentical(a, b);
    b = a.clone();
    this.assertNotIdentical(a, b);
  },

  testCompact: function() {
    this.assertEnumEqual([],      [].compact());
    this.assertEnumEqual([1,2,3], [1,2,3].compact());
    this.assertEnumEqual([0,1,2,3], [0,null,1,2,undefined,3].compact());
    this.assertEnumEqual([1,2,3], [0,null,1,'',2,undefined,3].compact(true));
    this.assertEnumEqual([1,2,3], [null,1,2,3,null].compact());
  }, 

  testConcat: function() {
    // test passing an arguments object to concat
     var self = this;
    (function() {
      self.assertEqual(1, [].concat(arguments).length, 'treats arguments as an array');
    })(1, 2);
    
    var list = ['a', 'b', 'c'];
    this.assertEnumEqual($w('a b c d e f g h i'),
      list.concat(['d', 'e'], 'f', ['g', 'h'], ['i']), 'failed basic concat test');
  },

  testContains: function() {
    var names = ['joe', 'john', 'zach'];
    var basic = [1, 2, 3];
    this.assert(names.contains('joe'));
    this.assert(names.contains('joe', true));
    this.assert(!names.contains('gizmo'));
    
    this.assert(basic.contains(2));
    this.assert(basic.contains('2'));
    this.assert(!basic.contains('2', true));
    this.assert(!basic.contains('4'));    
  },

  testEvery: function() {
    this.assert([].every());
    
    this.assert([true, true, true].every());
    this.assert(![true, false, false].every());
    this.assert(![false, false, false].every());

    this.assert(Fixtures.Basic.every(function(value) {
      return value > 0;
    }));
    this.assert(!Fixtures.Basic.every(function(value) {
      return value > 1;
    }));
  },

  testFilter: function() {
    this.assertEqual(Fixtures.Primes.join(', '),
      Fixtures.Z.filter(prime).join(', '));
  },

  testFirst: function() {
    var basic = [1,2,3];
    this.assertUndefined([].first());
    this.assertEnumEqual([], [].first(3));
    this.assertUndefined([].first(function(item) { return item === 2 }));
    this.assertEqual(1, basic.first());
    this.assertEnumEqual([1,2], basic.first(2));
    this.assertEqual(2, basic.first(function(item) { return item === 2 }));
    this.assertUndefined(basic.first(function(item) { return item === 4 }));
    this.assertEnumEqual([1], basic.first(-3));
    this.assertEnumEqual([1,2,3], basic.first(1000));
    this.assertEnumEqual([], basic.first('r0x0r5'));
  },
  
  testFlatten: function() {
    this.assertEnumEqual([],      [].flatten());
    this.assertEnumEqual([1,2,3], [1,2,3].flatten());
    this.assertEnumEqual([1,2,3], [1,[[[2,3]]]].flatten());
    this.assertEnumEqual([1,2,3], [[1],[2],[3]].flatten());
    this.assertEnumEqual([1,2,3], [[[[[[[1]]]]]],2,3].flatten());
  },
  
  testForEach: function() {
    var nicknames = [];
    Fixtures.People.forEach(function(person, index) {
      nicknames.push(person.nickname);
    });
    
    this.assertEqual(Fixtures.Nicknames.join(', '), 
      nicknames.join(', '));
  },
  
  testGrep: function() {
    // test empty pattern
    this.assertEqual('abc', ['a', 'b', 'c'].grep('').join(''));
    this.assertEqual('abc', ['a', 'b', 'c'].grep(new RegExp('')).join(''));

    this.assertEqual('juanbond, jdd', 
      Fixtures.Nicknames.grep(/j/).join(", "));
    
    this.assertEqual('JUANBOND, JDD', 
      Fixtures.Nicknames.grep(/j/, function(nickname) {
        return nickname.toUpperCase();
      }).join(", "));

    this.assertEnumEqual($('grepHeader', 'grepCell'),
      $('grepTable', 'grepTBody', 'grepRow', 'grepHeader', 'grepCell').grep(new Selector('.cell')));
  },  
  
  testIndexOf: function() {
    this.assertEqual(-1, [].indexOf(1));
    this.assertEqual(-1, [0].indexOf(1));
    this.assertEqual(0, [1].indexOf(1));
    this.assertEqual(1, [0,1,2].indexOf(1));
    this.assertEqual(0, [1,2,1].indexOf(1));
    this.assertEqual(2, [1,2,1].indexOf(1, -1));
    this.assertEqual(1, [undefined,null].indexOf(null));
  },  
  
  testInject: function() {
    this.assertEqual(1061, 
      Fixtures.Primes.inject(0, function(sum, value) {
        return sum + value;
      }));
  },

  testInsert: function() {
    this.assertEnumEqual([0, 1, 2, 4, 5], [1, 2, 4, 5].insert(0, 0));
    this.assertEnumEqual([1, 2, 3, 4, 5], [1, 2, 4, 5].insert(2, 3));
    this.assertEnumEqual([1, 2, 4, 5, 6, 7, 8], [1, 2, 4, 5].insert(-1, 6, 7, 8));
    this.assertEnumEqual([1, 2, 4, 5, undefined, undefined, 8], [1, 2, 4, 5].insert(6, 8));
  },

  testInspect: function() {
    this.assertEqual('[]',[].inspect());
    this.assertEqual('[1]',[1].inspect());
    this.assertEqual('[\'a\']',['a'].inspect());
    this.assertEqual('[\'a\', 1]',['a',1].inspect());
  },

  testIntersect: function() {
    this.assertEnumEqual([1,3], [1,1,3,5].intersect([1,2,3]));
    this.assertEnumEqual([1], [1,1].intersect([1,1]));
    this.assertEnumEqual([0], [0,2].intersect([1,0]));
    this.assertEnumEqual([], [1,1,3,5].intersect([4]));
    this.assertEnumEqual([], [1].intersect(['1']));
    
    this.assertEnumEqual(
      ['B','C','D'], 
      $R('A','Z').toArray().intersect($R('B','D').toArray())
    );
  },

  testInvoke: function() {
    var result = [[2, 1, 3], [6, 5, 4]].invoke('sort');
    this.assertEqual(2, result.length);
    this.assertEqual('1, 2, 3', result[0].join(', '));
    this.assertEqual('4, 5, 6', result[1].join(', '));
    
    result = result.invoke('invoke', 'toString', 2);
    this.assertEqual('1, 10, 11', result[0].join(', '));
    this.assertEqual('100, 101, 110', result[1].join(', '));
  },

  testLast: function() {
    var array = [];
    array[-1] = 'blah';
    this.assertUndefined(array.last());

    var basic = [1,2,3];
    this.assertUndefined([].last());
    this.assertEnumEqual([], [].last(3));
    this.assertUndefined([].last(function(item) { return item === 2 }));
    
    this.assertEqual(1, [1].last());
    this.assertEqual(2, [1,2].last());
    
    this.assertEqual(3, basic.last());
    this.assertEnumEqual([2,3], basic.last(2));
    this.assertEqual(2, basic.last(function(item) { return item === 2 }));
    this.assertUndefined(basic.last(function(item) { return item === 4 }));
    
    this.assertEnumEqual([3], basic.last(-3));
    this.assertEnumEqual([1,2,3], basic.last(1000));
    
    this.assertEnumEqual([], basic.last('r0x0r5'));
  },
  
  testLastIndexOf: function() {
    this.assertEqual(-1,[].lastIndexOf(1));
    this.assertEqual(-1, [0].lastIndexOf(1));
    this.assertEqual(0, [1].lastIndexOf(1));
    this.assertEqual(2, [0,2,4,6].lastIndexOf(4));
    this.assertEqual(3, [4,4,2,4,6].lastIndexOf(4));
    this.assertEqual(3, [0,2,4,6].lastIndexOf(6,3));
    this.assertEqual(-1, [0,2,4,6].lastIndexOf(6,2));
    this.assertEqual(0, [6,2,4,6].lastIndexOf(6,2));
    
    var fixture = [1,2,3,4,3];
    this.assertEqual(4, fixture.lastIndexOf(3));
    this.assertEnumEqual([1,2,3,4,3],fixture);
    
    //tests from http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
    var array = [2, 5, 9, 2];
    this.assertEqual(3,array.lastIndexOf(2));
    this.assertEqual(-1,array.lastIndexOf(7));
    this.assertEqual(3,array.lastIndexOf(2,3));
    this.assertEqual(0,array.lastIndexOf(2,2));
    this.assertEqual(0,array.lastIndexOf(2,-2));
    this.assertEqual(3,array.lastIndexOf(2,-1));
  },
  
  testMap: function() {
    this.assertEqual(Fixtures.Nicknames.join(', '), 
      Fixtures.People.map(function(person) {
        return person.nickname;
      }).join(", "));
    
    this.assertEqual(26,  Fixtures.Primes.map().length);
  },  
  
  testMax: function() {
    this.assertEqual(100, Fixtures.Z.max());
    this.assertEqual(97, Fixtures.Primes.max());
    this.assertEqual(2, [ -9, -8, -7, -6, -4, -3, -2,  0, -1,  2 ].max());
    this.assertEqual('kangax', Fixtures.Nicknames.max()); // ?s > ?U
  },
  
  testMin: function() {
    this.assertEqual(1, Fixtures.Z.min());
    this.assertEqual(0, [  1, 2, 3, 4, 5, 6, 7, 8, 0, 9 ].min());
    this.assertEqual('dperini', Fixtures.Nicknames.min()); // ?U < ?h
  },  
  
  testPartition: function() {
    var result = Fixtures.People.partition(function(person) {
      return person.name.length < 13;
    }).invoke('pluck', 'nickname');
    
    this.assertEqual(2, result.length);
    this.assertEqual('juanbond, dperini', result[0].join(', '));
    this.assertEqual('jdd, kangax', result[1].join(', '));
  },

  testPluck: function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.pluck('nickname').join(', '));
  },
  
  testSize: function() {
    this.assertEqual(4, [0, 1, 2, 3].size());
    this.assertEqual(0, [].size());
  },
  
  testSome: function() {
    this.assert(!([].some()));
    
    this.assert([true, true, true].some());
    this.assert([true, false, false].some());
    this.assert(![false, false, false].some());
    
    this.assert(Fixtures.Basic.some(function(value) {
      return value > 2;
    }));
    this.assert(!Fixtures.Basic.some(function(value) {
      return value > 5;
    }));
  },
  
  testSortBy: function() {
    this.assertEqual('dperini, jdd, juanbond, kangax',
      Fixtures.People.sortBy(function(value) {
        return value.nickname.toLowerCase();
      }).pluck('nickname').join(', '));
  },  
  
  testToJSON: function() {
    this.assertEqual('[]', [].toJSON());
    this.assertEqual('[\"a\"]', ['a'].toJSON());
    this.assertEqual('[\"a\", 1]', ['a', 1].toJSON());
    this.assertEqual('[\"a\", {\"b\": null}]', ['a', {'b': null}].toJSON());
  },
  
  testUnique: function() {
    this.assertEnumEqual([1], [1, 1, 1].unique());
    this.assertEnumEqual([1], [1].unique());
    this.assertEnumEqual([], [].unique());
    this.assertEnumEqual([0, 1, 2, 3], [0, 1, 2, 2, 3, 0, 2].unique());
  },  

  testWithout: function() {
    this.assertEnumEqual([], [].without(0));
    this.assertEnumEqual([], [0].without(0));
    this.assertEnumEqual([1], [0,1].without(0));
    this.assertEnumEqual([1,2], [0,1,2].without(0));
    this.assertEnumEqual(['test1','test3'], ['test1','test2','test3'].without('test2'));
  },
  
  testZip: function() {
    var result = [1, 2, 3].zip([4, 5, 6], [7, 8, 9]);
    this.assertEqual('[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', result.inspect());
    
    result = [1, 2, 3].zip([4, 5, 6], [7, 8, 9], function(array) { return array.reverse() });
    this.assertEqual('[[7, 4, 1], [8, 5, 2], [9, 6, 3]]', result.inspect());
  }
});