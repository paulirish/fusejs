var Fixtures = {
  People: [
    { 'name': 'Joe Gornick',       'nickname': 'juanbond' },
    { 'name': 'John David Dalton', 'nickname': 'jdd' },
    { 'name': 'Diego Perini',      'nickname': 'dperini' },
    { 'name': 'Juriy Zaytsev',     'nickname': 'kangax' }
  ],
  
  Nicknames: $w('juanbond jdd dperini kangax'),
  
  Emoticons: $w(';-) ;-( :-) :-P'),
  
  Basic: [1, 2, 3],
  
  Primes: [
     1,  2,  3,  5,  7,  11, 13, 17, 19, 23,
    29, 31, 37, 41, 43,  47, 53, 59, 61, 67,
    71, 73, 79, 83, 89,  97
  ],
  
  Z: []
};

for (var i = 1; i <= 100; i++)
  Fixtures.Z.push(i);
