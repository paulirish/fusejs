EnumObject = Class.create(Enumerable, {
  initialize: function(interior) {
    this.interior = interior;
  },
  
  _each: function(callback) {
    for (key in this.interior) {
      if (Object.isOwnProperty(this.interior, key))
        callback(this.interior[key], key, this);
    }
  }
});

Fixtures = {
  People: new EnumObject([
    { 'name': 'Sam Stephenson',    'nickname': 'sam-' },
    { 'name': 'Marcel Molina Jr.', 'nickname': 'noradio' },
    { 'name': 'Scott Barron',      'nickname': 'htonl' },
    { 'name': 'Nicholas Seckar',   'nickname': 'Ulysses' }
  ]),
  
  Nicknames: new EnumObject($w('sam- noradio htonl Ulysses')),
  
  Emoticons: new EnumObject($w(';-) ;-( :-) :-P')),
  
  Basic: new EnumObject([1, 2, 3]),
  
  Primes: new EnumObject([
     1,  2,  3,  5,  7,  11, 13, 17, 19, 23,
    29, 31, 37, 41, 43,  47, 53, 59, 61, 67,
    71, 73, 79, 83, 89,  97
  ]),
  
  Z: []
};

for (var i = 1; i <= 100; i++)
  Fixtures.Z.push(i);
Fixtures.Z = new EnumObject(Fixtures.Z);