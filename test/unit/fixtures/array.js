function prime(value) {
  for (var i = 2; i < value; i++)
    if (value % i == 0) return false;
  return true;
}

/*--------------------------------------------------------------------------*/

var Fixtures = {
  'People': Fuse.List(
    { 'name': 'Joe Gornick',       'nickname': 'juanbond' },
    { 'name': 'John David Dalton', 'nickname': 'jdd' },
    { 'name': 'Diego Perini',      'nickname': 'dperini' },
    { 'name': 'Juriy Zaytsev',     'nickname': 'kangax' }
  ),

  'Nicknames': Fuse.Util.$w('juanbond jdd dperini kangax'),

  'Emoticons': Fuse.Util.$w(';-) ;-( :-) :-P'),

  'Basic': Fuse.List(1, 2, 3),

  'Primes': Fuse.List(
     1,  2,  3,  5,  7,  11, 13, 17, 19, 23,
    29, 31, 37, 41, 43,  47, 53, 59, 61, 67,
    71, 73, 79, 83, 89,  97
  ),

  'Object': { '0':0, '2':2, 'length':3 },

  'Z': Fuse.List()
};

for (var i = 1; i < 101; i++)
  Fixtures.Z.push(i);
